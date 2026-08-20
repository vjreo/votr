import React, { useState } from 'react';
import './shared/types/navigation'; // Navigation type declarations
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { UserProvider, useUser } from './features/auth/context/UserContext';
import { GamificationProvider } from './features/gamification/context/GamificationContext';
import { colors } from './shared/theme/colors';
import { features } from './shared/config/features';

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

// Bottom Tab Navigator — MVP mode: Match + Shortlist + Profile (no Discover/Journey tabs)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarLabel: features.mvpMode ? 'Match' : 'Feed',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={
                features.mvpMode
                  ? focused
                    ? 'heart'
                    : 'heart-outline'
                  : focused
                    ? 'newspaper'
                    : 'newspaper-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />
      {features.showDiscoverTab ? (
        <Tab.Screen
          name="Discover"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Discover',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />
          ),
          }}
        />
      ) : null}
      <Tab.Screen
        name="Roster"
        component={RosterScreen}
        options={{
          tabBarLabel: features.mvpMode ? 'Shortlist' : 'My Roster',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={size} color={color} />
          ),
        }}
      />
      {features.showJourneyTab ? (
        <Tab.Screen
          name="Journey"
          component={JourneyScreen}
          options={{
            tabBarLabel: 'Journey',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={size} color={color} />
          ),
          }}
        />
      ) : null}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, loading, hasLocation } = useUser();
  const [showSplash, setShowSplash] = useState(true);

  // Location is set only when user explicitly enters address in AddressEntryScreen.
  // No auto-detect—we default to NC until user enters their voting address.

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
              name="DiscoverList"
              component={HomeScreen}
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
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
                headerBackTitle: 'Back',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
                headerTitleStyle: { color: colors.textPrimary, fontWeight: '600' },
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
    backgroundColor: colors.background,
    padding: 24,
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <GamificationProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </GamificationProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
