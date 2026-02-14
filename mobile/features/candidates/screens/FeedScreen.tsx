import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CategorySection, Button } from '../../../shared/components/ui';
import CandidateCard from '../components/CandidateCard';
import { useUser } from '../../../features/auth/context/UserContext';
import { candidateApi } from '../services/candidateApi';
import { getNextElection, getUpcomingDeadlines } from '../../../shared/data/upcomingElections';
import { colors, shadows, borderRadius } from '../../../shared/theme/colors';
import { DEFAULT_STATE } from '../../../shared/constants';

const getDaysUntil = (dateString: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDate = (dateString: string): string => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Office levels
const OFFICE_LEVELS = [
  {
    key: 'federal',
    title: 'U.S. Senate',
    description: 'United States senators represent their state in the federal legislature.',
    icon: '🏛️',
  },
  {
    key: 'state',
    title: 'Governor',
    description: 'State Governors are elected by the people. Governors are responsible for implementing state laws and overseeing the operation of the state executive branch.',
    icon: '🏛️',
  },
  {
    key: 'state_legislature',
    title: 'State Legislature',
    description: 'State legislators create and vote on state laws that affect your daily life.',
    icon: '📜',
  },
  {
    key: 'local',
    title: 'Local Offices',
    description: 'Local officials handle city and county governance, schools, and community services.',
    icon: '🏘️',
  },
];

interface Candidate {
  id: string;
  name: string;
  party: string;
  photo?: string;
  office?: string;
  officeLevel?: string;
}

const FeedScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  const userState = user?.location?.state || DEFAULT_STATE;
  const userAddress = user?.location?.address;
  const nextElection = getNextElection(userState);
  const upcomingDeadlines = getUpcomingDeadlines(userState, 3);

  const loadInProgressRef = React.useRef(false);

  const loadCandidates = React.useCallback(async () => {
    if (loadInProgressRef.current) return;
    loadInProgressRef.current = true;
    try {
      setLoading(true);
      setLoadError(false);
      const response = await candidateApi.getAll({
        state: userState,
        location: userAddress || undefined,
      });

      const grouped: Record<string, Candidate[]> = {
        federal: [],
        state: [],
        state_legislature: [],
        local: [],
      };

      (response.data || []).forEach((candidate: any) => {
        const normalized = {
          ...candidate,
          photo: candidate.photo || candidate.photo_url,
        };
        const level = candidate.office_level || candidate.officeLevel || 'local';
        if (grouped[level]) {
          grouped[level].push(normalized);
        } else {
          grouped.local.push(normalized);
        }
      });

      setCandidates(grouped);
    } catch (error) {
      console.warn('Error loading candidates:', error);
      setLoadError(true);
      setCandidates({
        federal: [],
        state: [],
        state_legislature: [],
        local: [],
      });
    } finally {
      setLoading(false);
      loadInProgressRef.current = false;
    }
  }, [userState, userAddress]);

  // Single source: refetch on focus (includes initial mount). No separate useEffect.
  useFocusEffect(
    React.useCallback(() => {
      loadCandidates();
    }, [loadCandidates])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCandidates();
    setRefreshing(false);
  };

  const handleCandidatePress = (candidateId: string) => {
    navigation.navigate('CandidateDetail' as never, { candidateId } as never);
  };

  const handleToggleComparison = (candidateId: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      }
      if (prev.length >= 2) {
        // Replace the first one
        return [prev[1], candidateId];
      }
      return [...prev, candidateId];
    });
  };

  const handleCompare = () => {
    if (selectedForComparison.length === 2) {
      navigation.navigate('Compare' as never, {
        candidateIds: selectedForComparison,
      } as never);
    }
  };

  const renderOfficeSection = (level: typeof OFFICE_LEVELS[0]) => {
    const levelCandidates = candidates[level.key] || [];

    if (levelCandidates.length === 0 && !loading) {
      return null;
    }

    return (
      <CategorySection
        key={level.key}
        title={level.title}
        description={level.description}
        icon={<Text style={styles.categoryIcon}>{level.icon}</Text>}
        actionLabel={levelCandidates.length > 0 ? 'Tap image to compare candidates' : undefined}
        defaultExpanded={levelCandidates.length > 0}
      >
        {levelCandidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            id={candidate.id}
            name={candidate.name}
            party={candidate.party}
            photo={candidate.photo}
            office={candidate.office}
            onPress={() => handleCandidatePress(candidate.id)}
            onCompare={() => handleToggleComparison(candidate.id)}
            selected={selectedForComparison.includes(candidate.id)}
          />
        ))}

        {levelCandidates.length >= 2 && (
          <Button
            title="Compare"
            onPress={handleCompare}
            disabled={selectedForComparison.length !== 2}
            fullWidth
            variant={selectedForComparison.length === 2 ? 'primary' : 'secondary'}
          />
        )}
      </CategorySection>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.locationText}>{userState || DEFAULT_STATE}</Text>
          </View>
          <View style={styles.headerIcons}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </View>
        </View>

        {/* Search Bar - links to Search tab */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <Text style={styles.searchPlaceholder}>Search candidates, offices...</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading what&apos;s near you...</Text>
          </View>
        ) : (
          <>
            {/* What's happening near you */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>What&apos;s happening near you</Text>
              <Text style={styles.sectionSubtitle}>
                Upcoming elections and who&apos;s running in {userState || DEFAULT_STATE}
              </Text>
            </View>

            {nextElection && (
              <View style={styles.nextElectionCard}>
                <View style={styles.nextElectionTop}>
                  <Text style={styles.nextElectionIcon}>{nextElection.icon}</Text>
                  <View style={styles.nextElectionMeta}>
                    <Text style={styles.nextElectionName}>{nextElection.name}</Text>
                    <Text style={styles.nextElectionDate}>{formatDate(nextElection.date)}</Text>
                  </View>
                  <View style={styles.countdownBadge}>
                    <Text style={styles.countdownNumber}>
                      {getDaysUntil(nextElection.date)}
                    </Text>
                    <Text style={styles.countdownLabel}>days</Text>
                  </View>
                </View>
                <Text style={styles.nextElectionDesc}>{nextElection.description}</Text>
                <View style={styles.nextElectionOffices}>
                  {nextElection.offices.slice(0, 3).map((office, i) => (
                    <Text key={i} style={styles.officeChip}>{office}</Text>
                  ))}
                  {nextElection.offices.length > 3 && (
                    <Text style={styles.officeChip}>+{nextElection.offices.length - 3} more</Text>
                  )}
                </View>
                <View style={styles.feedCardActions}>
                  <TouchableOpacity
                    style={styles.viewCalendarRow}
                    onPress={() => navigation.navigate('SampleBallot')}
                  >
                    <Text style={styles.viewCalendarText}>View sample ballot</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.viewCalendarRow}
                    onPress={() => navigation.navigate('ElectionCalendar')}
                  >
                    <Text style={styles.viewCalendarText}>Full calendar</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {upcomingDeadlines.length > 0 && (
              <View style={styles.deadlinesSection}>
                <Text style={styles.deadlinesTitle}>Key deadlines</Text>
                {upcomingDeadlines.map(({ deadline, election }, i) => (
                  <View
                    key={i}
                    style={[
                      styles.deadlineRow,
                      i === upcomingDeadlines.length - 1 && styles.deadlineRowLast,
                    ]}
                  >
                    <Text style={styles.deadlineIcon}>{deadline.icon}</Text>
                    <View style={styles.deadlineContent}>
                      <Text style={styles.deadlineName}>{deadline.name}</Text>
                      <Text style={styles.deadlineMeta}>
                        {formatDate(deadline.date)} · {getDaysUntil(deadline.date)} days
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!nextElection && upcomingDeadlines.length === 0 && (
              <TouchableOpacity
                style={styles.nextElectionCard}
                onPress={() => navigation.navigate('ElectionCalendar')}
              >
                <Text style={styles.nextElectionIcon}>🗳️</Text>
                <Text style={styles.nextElectionName}>Election calendar</Text>
                <Text style={styles.nextElectionDesc}>
                  View upcoming elections and deadlines for your area.
                </Text>
                <View style={styles.viewCalendarRow}>
                  <Text style={styles.viewCalendarText}>Open calendar</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            )}

            {/* Who's running */}
            <View style={[styles.sectionHeader, { marginTop: 28 }]}>
              <Text style={styles.sectionTitle}>Who&apos;s running</Text>
              <Text style={styles.sectionSubtitle}>
                {Object.values(candidates).some((arr) => arr.length > 0)
                  ? 'Candidates on your ballot for upcoming races'
                  : 'Add your address in Profile, or browse Search to discover candidates.'}
              </Text>
            </View>

            {OFFICE_LEVELS.map(renderOfficeSection)}

            {Object.values(candidates).every((arr) => arr.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons
                  name={loadError ? 'cloud-offline-outline' : 'people-outline'}
                  size={48}
                  color={colors.textTertiary}
                />
                <Text style={styles.emptyTitle}>
                  {loadError ? "Couldn't load candidates" : 'No candidates yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {loadError
                    ? 'Check your connection and pull to refresh.'
                    : 'Browse the Search tab to discover candidates, or update your address in Profile.'}
                </Text>
                {!loadError && (
                  <Text style={styles.searchTabHint}>→ Try Search to discover candidates</Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingBottom: 12,
    ...shadows.small,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: colors.textTertiary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  categoryIcon: {
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  nextElectionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...shadows.small,
  },
  nextElectionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nextElectionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  nextElectionMeta: {
    flex: 1,
  },
  nextElectionName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  nextElectionDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countdownBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  nextElectionDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  nextElectionOffices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  officeChip: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  feedCardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 4,
  },
  viewCalendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCalendarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  deadlinesSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...shadows.small,
  },
  deadlinesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deadlineRowLast: {
    borderBottomWidth: 0,
  },
  deadlineIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  deadlineMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchTabHint: {
    marginTop: 16,
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default FeedScreen;
