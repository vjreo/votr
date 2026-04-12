import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../../shared/types';
import { userApi } from '../services/userApi';
import { authApi } from '../services/authApi';
import api from '../../../shared/services/api';
import { logEvent } from '../../../shared/services/analytics';

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
  createAnonymousUser: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  oauthLogin: (provider: 'google' | 'apple', providerId: string, email?: string, name?: string) => Promise<void>;
  linkAnonymousAccount: (anonymousUserId: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: any[]) => Promise<void>;
  updateLocation: (location: any, userId?: string) => Promise<void>;
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

const minimalUser = (id: string): User =>
  ({
    id,
    preferences: [],
    gamification: { points: 0, streak: 0, lastActiveDate: '', level: 1, badges: [] },
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as User;

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
    loadRosterFromStorage();
    const safety = setTimeout(() => setLoading(false), 12000);
    return () => clearTimeout(safety);
  }, []);

  const loadRosterFromStorage = async () => {
    try {
      const storedRoster = await AsyncStorage.getItem(STORAGE_KEYS.ROSTER);
      if (storedRoster) {
        setRoster(JSON.parse(storedRoster));
      }
    } catch (error) {
      console.error('Error loading roster:', error);
    }
  };

  // When user is authenticated, fetch roster from backend; when anonymous, use AsyncStorage
  useEffect(() => {
    if (accessToken && !isAnonymous && user?.id) {
      userApi
        .getRoster()
        .then((res) => {
          const data = res.data;
          if (Array.isArray(data) && data.length >= 0) {
            setRoster(data);
            AsyncStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(data));
          }
        })
        .catch(() => {
          // Fallback to local on API error
        });
    }
  }, [accessToken, isAnonymous, user?.id]);

  useEffect(() => {
    // Set auth header for API requests
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);

  const persistAuth = useCallback(
    (userId: string, access: string, refresh: string, anonymous: boolean) => {
      setAccessToken(access);
      setRefreshToken(refresh);
      setIsAnonymous(anonymous);
      return Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_ID, String(userId)),
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh),
        AsyncStorage.setItem(STORAGE_KEYS.IS_ANONYMOUS, anonymous ? 'true' : 'false'),
      ]);
    },
    []
  );

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
        setUserState(minimalUser(storedUserId));

        try {
          const response = await userApi.get(storedUserId);
          setUserState(response.data);
        } catch {
          if (storedRefreshToken) {
            await refreshAccessToken(storedRefreshToken);
          } else {
            await createAnonymousUser();
          }
        }
      } else {
        await createAnonymousUser();
      }
    } catch {
      await createAnonymousUser();
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async (refreshTokenValue: string) => {
    try {
      const { data } = await authApi.refresh(refreshTokenValue);
      setAccessToken(data.accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      if (user?.id) {
        const { data: userData } = await userApi.get(user.id);
        setUserState(userData);
      }
    } catch {
      await createAnonymousUser();
    }
  };

  const createAnonymousUser = async (): Promise<User | null> => {
    try {
      const response = await authApi.createAnonymous();
      const { user: newUser, accessToken: token, refreshToken: refresh } = response.data;
      setUserState(newUser);
      await persistAuth(String(newUser.id), token, refresh, true);
      return newUser;
    } catch (err: any) {
      const unreachable =
        err?.code === 'ERR_NETWORK' ||
        err?.code === 'ECONNABORTED' ||
        err?.message === 'Network Error' ||
        err?.message?.includes('timeout');
      if (!unreachable) console.error('Error creating anonymous user:', err);
      return null;
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
    const { data } = await authApi.login(email, password);
    setUserState(data.user);
    await persistAuth(String(data.user.id), data.accessToken, data.refreshToken, false);
    await syncRosterToBackend();
  };

  const register = async (email: string, password: string) => {
    const { data } = await authApi.register(email, password);
    setUserState(data.user);
    await persistAuth(String(data.user.id), data.accessToken, data.refreshToken, false);
    await syncRosterToBackend();
  };

  const oauthLogin = async (provider: 'google' | 'apple', providerId: string, email?: string, name?: string) => {
    const { data } = await authApi.oauth(provider, providerId, email, name);
    setUserState(data.user);
    await persistAuth(String(data.user.id), data.accessToken, data.refreshToken, false);
    await syncRosterToBackend();
  };

  const linkAnonymousAccount = async (anonymousUserId: string) => {
    if (!user || !accessToken) return;

    try {
      await authApi.linkAnonymous(anonymousUserId);
      // Reload user data to get merged data
      const response = await userApi.get(user.id);
      setUserState(response.data);
      await syncRosterToBackend();
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

  const updateLocation = async (location: any, userId?: string) => {
    const targetUserId = userId ?? user?.id;
    if (!targetUserId) return;
    try {
      await userApi.updateLocation(targetUserId, location);
      const updatedUser = user ? { ...user, location } : { ...minimalUser(targetUserId), location };
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

  const syncRosterToBackend = useCallback(async () => {
    if (!accessToken || isAnonymous) return;
    try {
      const storedRoster = await AsyncStorage.getItem(STORAGE_KEYS.ROSTER);
      const localRoster = storedRoster ? JSON.parse(storedRoster) : [];
      if (localRoster.length > 0) {
        const { data } = await userApi.syncRoster(localRoster);
        setRoster(data || []);
        await AsyncStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(data || []));
      } else {
        const { data } = await userApi.getRoster();
        setRoster(data || []);
        await AsyncStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(data || []));
      }
    } catch {
      // Ignore sync errors
    }
  }, [accessToken, isAnonymous]);

  // Roster management functions
  const addToRoster = useCallback(async (candidate: RosterCandidate) => {
    setRoster((prevRoster) => {
      if (prevRoster.some((c) => c.id === candidate.id)) return prevRoster;
      logEvent('roster_candidate_added', { candidateId: candidate.id });
      const newRoster = [...prevRoster, candidate];
      AsyncStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(newRoster));
      return newRoster;
    });
    if (accessToken && !isAnonymous) {
      userApi.addToRoster(candidate.id).catch(() => {});
    }
  }, [accessToken, isAnonymous]);

  const removeFromRoster = useCallback(async (candidateId: string) => {
    setRoster((prevRoster) => {
      const newRoster = prevRoster.filter((c) => c.id !== candidateId);
      AsyncStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(newRoster));
      return newRoster;
    });
    if (accessToken && !isAnonymous) {
      userApi.removeFromRoster(candidateId).catch(() => {});
    }
  }, [accessToken, isAnonymous]);

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
        loading: Boolean(loading),
        isAnonymous: Boolean(isAnonymous),
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
