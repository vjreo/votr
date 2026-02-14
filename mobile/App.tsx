import React, { useState, useEffect } from 'react';
import './shared/types/navigation'; // Navigation type declarations
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { UserProvider, useUser } from './features/auth/context/UserContext';
import api, { API_BASE_URL } from './shared/services/api';
import { GamificationProvider } from './features/gamification/context/GamificationContext';
import * as Location from 'expo-location';
import { colors } from './shared/theme/colors';

// Shared Screens
import SplashScreen from './shared/screens/SplashScreen';
import ProfileScreen from './shared/screens/ProfileScreen';
import SourceInfoScreen from './shared/screens/SourceInfoScreen';

// Auth Screens
import AddressEntryScreen from './features/auth/screens/AddressEntryScreen';
import OnboardingScreen from './features/auth/screens/OnboardingScreen';
import PreferencesEditScreen from './features/auth/screens/PreferencesEditScreen';
import LoginScreen from './features/auth/screens/LoginScreen';

// Candidate Screens
import FeedScreen from './features/candidates/screens/FeedScreen';
import HomeScreen from './features/candidates/screens/HomeScreen';
import CandidateDetailScreen from './features/candidates/screens/CandidateDetailScreen';
import RosterScreen from './features/candidates/screens/RosterScreen';
import CompareScreen from './features/candidates/screens/CompareScreen';

// Gamification Screens
import JourneyScreen from './features/gamification/screens/JourneyScreen';
import PolicyQuizScreen from './features/gamification/screens/PolicyQuizScreen';
import DailyLessonScreen from './features/gamification/screens/DailyLessonScreen';
import LessonLibraryScreen from './features/gamification/screens/LessonLibraryScreen';

// Election Screens
import ElectionCalendarScreen from './features/elections/screens/ElectionCalendarScreen';
import PollingPlaceFinderScreen from './features/elections/screens/PollingPlaceFinderScreen';
import SampleBallotScreen from './features/elections/screens/SampleBallotScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Roster"
        component={RosterScreen}
        options={{
          tabBarLabel: 'My Roster',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Journey"
        component={JourneyScreen}
        options={{
          tabBarLabel: 'Journey',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FAQ"
        component={SourceInfoScreen}
        options={{
          tabBarLabel: 'FAQ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, loading, hasLocation, updateLocation, createAnonymousUser } = useUser();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Auto-detect location only when user exists and has no location yet
    if (user && !hasLocation) {
      requestLocationPermission();
    }
  }, [user?.id, hasLocation]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !user) return;

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = geocode[0];

      if (user && address) {
        await updateLocation({
          latitude,
          longitude,
          address: `${address?.street || ''} ${address?.city || ''}, ${address?.region || ''} ${address?.postalCode || ''}`.trim(),
          city: address?.city,
          state: address?.region || '',
          zipCode: address?.postalCode,
        });
      }
    } catch (error: any) {
      // Rate limit or permission denied - fail silently; user can enter address manually
      if (__DEV__ && error?.message) {
        console.warn('Auto-location failed:', error.message);
      }
    }
  };

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show loading while checking user state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // No user (e.g. backend unreachable) – show address form; user creates account on submit
  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AddressEntry" component={AddressEntryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Determine if user needs to complete onboarding
  const needsAddress = !user?.location?.state;
  const needsPreferences = !user?.preferences || user.preferences.length === 0;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
          cardOverlayEnabled: false,
          cardShadowEnabled: false,
        }}
      >
        {/* Onboarding Flow */}
        {needsAddress ? (
          <Stack.Screen name="AddressEntry" component={AddressEntryScreen} />
        ) : needsPreferences ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          // Main App
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="CandidateDetail"
              component={CandidateDetailScreen}
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="SourceInfo"
              component={SourceInfoScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'About Bias Indicators',
              }}
            />
            <Stack.Screen
              name="PolicyQuiz"
              component={PolicyQuizScreen}
              options={{
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="QuizResults"
              component={JourneyScreen}
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="Compare"
              component={CompareScreen}
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="ElectionCalendar"
              component={ElectionCalendarScreen}
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="DailyLesson"
              component={DailyLessonScreen}
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="LessonLibrary"
              component={LessonLibraryScreen}
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="PollingPlaceFinder"
              component={PollingPlaceFinderScreen}
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="SampleBallot"
              component={SampleBallotScreen}
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="AddressEntry"
              component={AddressEntryScreen}
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="PreferencesEdit"
              component={PreferencesEditScreen}
              options={{
                presentation: 'card',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 24,
  },
  retryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  retrySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  apiUrl: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  apiHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <GamificationProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </GamificationProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
