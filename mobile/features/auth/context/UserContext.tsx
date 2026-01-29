import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../../shared/types';
import { userApi } from '../services/userApi';
import { authApi } from '../services/authApi';
import api from '../../../shared/services/api';

interface RosterCandidate {
  id: string;
  name: string;
  party: string;
  office?: string;
  photo?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  accessToken: string | null;
  hasLocation: boolean;
  roster: RosterCandidate[];
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  createAnonymousUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  oauthLogin: (provider: 'google' | 'apple', providerId: string, email?: string, name?: string) => Promise<void>;
  linkAnonymousAccount: (anonymousUserId: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: any[]) => Promise<void>;
  updateLocation: (location: any) => Promise<void>;
  refreshGamification: () => Promise<void>;
  addToRoster: (candidate: RosterCandidate) => Promise<void>;
  removeFromRoster: (candidateId: string) => Promise<void>;
  isInRoster: (candidateId: string) => boolean;
  clearRoster: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER_ID: 'userId',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  IS_ANONYMOUS: 'isAnonymous',
  ROSTER: 'roster',
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [roster, setRoster] = useState<RosterCandidate[]>([]);

  // Computed property for checking if user has location
  const hasLocation = Boolean(user?.location?.state);

  useEffect(() => {
    loadStoredUser();
    loadRoster();
  }, []);

  const loadRoster = async () => {
    try {
      const storedRoster = await AsyncStorage.getItem(STORAGE_KEYS.ROSTER);
      if (storedRoster) {
        setRoster(JSON.parse(storedRoster));
      }
    } catch (error) {
      console.error('Error loading roster:', error);
    }
  };

  useEffect(() => {
    // Set auth header for API requests
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);

  const loadStoredUser = async () => {
    try {
      const [storedUserId, storedAccessToken, storedRefreshToken, storedIsAnonymous] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.IS_ANONYMOUS),
      ]);

      if (storedUserId && storedAccessToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setIsAnonymous(storedIsAnonymous === 'true');

        // Load user data
        try {
          const response = await userApi.get(storedUserId);
          setUserState(response.data);
        } catch (error) {
          // Token might be expired, try refresh
          if (storedRefreshToken) {
            await refreshAccessToken(storedRefreshToken);
          } else {
            // No refresh token, create anonymous user
            await createAnonymousUser();
          }
        }
      } else {
        // No stored user, create anonymous
        await createAnonymousUser();
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      await createAnonymousUser();
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async (refreshTokenValue: string) => {
    try {
      const response = await authApi.refresh(refreshTokenValue);
      const newAccessToken = response.data.accessToken;
      setAccessToken(newAccessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
      
      // Reload user data
      if (user?.id) {
        const userResponse = await userApi.get(user.id);
        setUserState(userResponse.data);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Refresh failed, create new anonymous user
      await createAnonymousUser();
    }
  };

  const createAnonymousUser = async () => {
    try {
      const response = await authApi.createAnonymous();
      const { user: newUser, accessToken: token, refreshToken: refresh } = response.data;

      setUserState(newUser);
      setAccessToken(token);
      setRefreshToken(refresh);
      setIsAnonymous(true);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_ID, newUser.id),
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh),
        AsyncStorage.setItem(STORAGE_KEYS.IS_ANONYMOUS, 'true'),
      ]);
    } catch (error) {
      console.error('Error creating anonymous user:', error);
    }
  };

  const setUser = async (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, newUser.id);
    } else {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.IS_ANONYMOUS),
      ]);
    }
  };

  const setTokens = async (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh),
    ]);
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { user: loggedInUser, accessToken: token, refreshToken: refresh } = response.data;

    setUserState(loggedInUser);
    setAccessToken(token);
    setRefreshToken(refresh);
    setIsAnonymous(false);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER_ID, loggedInUser.id),
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh),
      AsyncStorage.setItem(STORAGE_KEYS.IS_ANONYMOUS, 'false'),
    ]);
  };

  const register = async (email: string, password: string) => {
    const response = await authApi.register(email, password);
    const { user: newUser, accessToken: token, refreshToken: refresh } = response.data;

    setUserState(newUser);
    setAccessToken(token);
    setRefreshToken(refresh);
    setIsAnonymous(false);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER_ID, newUser.id),
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh),
      AsyncStorage.setItem(STORAGE_KEYS.IS_ANONYMOUS, 'false'),
    ]);
  };

  const oauthLogin = async (provider: 'google' | 'apple', providerId: string, email?: string, name?: string) => {
    const response = await authApi.oauth(provider, providerId, email, name);
    const { user: loggedInUser, accessToken: token, refreshToken: refresh } = response.data;

    setUserState(loggedInUser);
    setAccessToken(token);
    setRefreshToken(refresh);
    setIsAnonymous(false);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER_ID, loggedInUser.id),
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh),
      AsyncStorage.setItem(STORAGE_KEYS.IS_ANONYMOUS, 'false'),
    ]);
  };

  const linkAnonymousAccount = async (anonymousUserId: string) => {
    if (!user || !accessToken) return;

    try {
      await authApi.linkAnonymous(anonymousUserId);
      // Reload user data to get merged data
      const response = await userApi.get(user.id);
      setUserState(response.data);
    } catch (error) {
      console.error('Error linking anonymous account:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }

    setUserState(null);
    setAccessToken(null);
    setRefreshToken(null);
    setIsAnonymous(true);

    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.IS_ANONYMOUS),
    ]);

    // Create new anonymous user
    await createAnonymousUser();
  };

  const updatePreferences = async (preferences: any[]) => {
    if (!user) return;
    try {
      await userApi.updatePreferences(user.id, preferences);
      const updatedUser = { ...user, preferences };
      setUserState(updatedUser);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const updateLocation = async (location: any) => {
    if (!user) return;
    try {
      await userApi.updateLocation(user.id, location);
      const updatedUser = { ...user, location };
      setUserState(updatedUser);
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  };

  const refreshGamification = async () => {
    if (!user) return;
    try {
      const response = await userApi.getGamification(user.id);
      const updatedUser = { ...user, gamification: response.data };
      setUserState(updatedUser);
    } catch (error) {
      console.error('Error refreshing gamification:', error);
    }
  };

  // Roster management functions
  const addToRoster = useCallback(async (candidate: RosterCandidate) => {
    setRoster((prevRoster) => {
      // Check if already in roster
      if (prevRoster.some((c) => c.id === candidate.id)) {
        return prevRoster;
      }
      const newRoster = [...prevRoster, candidate];
      // Persist to AsyncStorage
      AsyncStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(newRoster));
      return newRoster;
    });
  }, []);

  const removeFromRoster = useCallback(async (candidateId: string) => {
    setRoster((prevRoster) => {
      const newRoster = prevRoster.filter((c) => c.id !== candidateId);
      // Persist to AsyncStorage
      AsyncStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(newRoster));
      return newRoster;
    });
  }, []);

  const isInRoster = useCallback((candidateId: string): boolean => {
    return roster.some((c) => c.id === candidateId);
  }, [roster]);

  const clearRoster = useCallback(async () => {
    setRoster([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.ROSTER);
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        isAnonymous,
        accessToken,
        hasLocation,
        roster,
        setUser,
        setTokens,
        createAnonymousUser,
        login,
        register,
        oauthLogin,
        linkAnonymousAccount,
        logout,
        updatePreferences,
        updateLocation,
        refreshGamification,
        addToRoster,
        removeFromRoster,
        isInRoster,
        clearRoster,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
