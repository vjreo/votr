import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StreakCounter from '../../features/gamification/components/StreakCounter';
import AchievementBadge from '../../features/gamification/components/AchievementBadge';
import MatchScoreIndicator from '../../features/candidates/components/MatchScoreIndicator';
import { useUser } from '../../features/auth/context/UserContext';
import { userApi } from '../../features/auth/services/userApi';
import { calculateLevel, getPointsForNextLevel } from '../../features/gamification/utils/gamification';
import { colors } from '../theme/colors';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, loading: userLoading, isAnonymous, logout } = useUser();
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamification();
  }, [user]);

  const loadGamification = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await userApi.getGamification(user.id);
      setGamification(response.data);
    } catch (error) {
      console.error('Error loading gamification:', error);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please log in</Text>
      </View>
    );
  }

  const points = gamification?.points || 0;
  const streak = gamification?.streak || 0;
  const level = calculateLevel(points);
  const pointsToNext = getPointsForNextLevel(points);
  const badges = gamification?.badges || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Profile</Text>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <StreakCounter streak={streak} size="large" />
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>Level {level}</Text>
          <Text style={styles.statLabel}>{pointsToNext} to next</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {badges.length === 0 ? (
          <Text style={styles.emptyText}>No achievements yet. Keep swiping!</Text>
        ) : (
          badges.map((badge: any) => (
            <AchievementBadge
              key={badge.id || badge.type}
              type={badge.type}
              name={badge.name}
              description={badge.description}
              unlocked={true}
              unlockedAt={badge.unlockedAt ? new Date(badge.unlockedAt) : undefined}
            />
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Preferences</Text>
        {user.preferences && user.preferences.length > 0 ? (
          <View style={styles.preferencesContainer}>
            {user.preferences.map((pref: any, idx: number) => (
              <View key={idx} style={styles.preferenceItem}>
                <Text style={styles.preferenceName}>{pref.issueName || pref.issueId}</Text>
                <Text style={styles.preferenceImportance}>
                  Importance: {pref.importance || 1}/5
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No preferences set</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statsSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    padding: 20,
    backgroundColor: colors.white,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  preferencesContainer: {
    gap: 8,
  },
  preferenceItem: {
    padding: 12,
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preferenceName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  preferenceImportance: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  accountButton: {
    padding: 16,
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  accountButtonSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ProfileScreen;

