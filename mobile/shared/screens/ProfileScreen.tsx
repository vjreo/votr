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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StreakCounter from '../../features/gamification/components/StreakCounter';
import AchievementBadge from '../../features/gamification/components/AchievementBadge';
import { useUser } from '../../features/auth/context/UserContext';
import { userApi } from '../../features/auth/services/userApi';
import { calculateLevel, getPointsForNextLevel } from '../../features/gamification/utils/gamification';
import { colors } from '../theme/colors';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, loading: userLoading, logout } = useUser();
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
      console.warn('Gamification unavailable:', (error as any)?.message || 'Network error');
      setGamification({ points: 0, streak: 0, badges: [] });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || (loading && !gamification)) {
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Stats row - compact */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <StreakCounter streak={streak} size="small" />
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{level}</Text>
          <Text style={styles.statLabel}>Level · {pointsToNext} to next</Text>
        </View>
      </View>

      {/* Voting address - compact */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Voting address</Text>
        <Text style={styles.cardValue} numberOfLines={2}>
          {user.location?.address || 'Not set'}
        </Text>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('AddressEntry')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.linkText}>Change address</Text>
        </TouchableOpacity>
      </View>

      {/* Preferences - with edit */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitleCompact}>Preferences</Text>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('PreferencesEdit')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.linkText}>Edit</Text>
          </TouchableOpacity>
        </View>
        {user.preferences && user.preferences.length > 0 ? (
          <View style={styles.preferenceList}>
            {user.preferences.map((pref: any, idx: number) => (
              <Text key={idx} style={styles.preferenceItem}>
                {pref.issueName || pref.issueId} · {pref.importance || 1}/5
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>None yet. Tap Edit to add.</Text>
        )}
      </View>

      {/* FAQ / Bias Indicators */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => (navigation as any).navigate('SourceInfo')}
        activeOpacity={0.8}
      >
        <View style={styles.faqRow}>
          <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.faqTitle}>FAQ & Bias Indicators</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
        <Text style={styles.faqSubtitle}>Learn how we assess source reliability</Text>
      </TouchableOpacity>

      {/* Achievements - compact */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Achievements</Text>
        {badges.length === 0 ? (
          <Text style={styles.emptyText}>Keep engaging to earn badges.</Text>
        ) : (
          <View style={styles.badgeRow}>
            {badges.slice(0, 6).map((badge: any) => (
              <AchievementBadge
                key={badge.id || badge.type}
                type={badge.type}
                name={badge.name}
                description={badge.description}
                unlocked={true}
                unlockedAt={badge.unlockedAt ? new Date(badge.unlockedAt) : undefined}
              />
            ))}
          </View>
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
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  cardTitleCompact: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardValue: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 2,
  },
  preferenceList: {
    marginTop: 8,
    gap: 4,
  },
  preferenceItem: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  faqSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    marginLeft: 34,
  },
});

export default ProfileScreen;
