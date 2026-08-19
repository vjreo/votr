import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CategorySection, Button } from '../../../shared/components/ui';
import CandidateCard from '../components/CandidateCard';
import SwipeableCard from '../components/SwipeableCard';
import { useUser } from '../../../features/auth/context/UserContext';
import { candidateApi } from '../services/candidateApi';
import { getNextElection } from '../../../shared/data/upcomingElections';
import { colors, borderRadius } from '../../../shared/theme/colors';
import { DEFAULT_STATE } from '../../../shared/constants';
import { features } from '../../../shared/config/features';
import type { Candidate } from '../../../shared/types';
import {
  groupCandidatesByOfficeLevel,
  toSwipeCandidate,
  type OfficeBucket,
} from '../utils/candidateGrouping';
import { useCandidatePairCompare } from '../hooks/useCandidatePairCompare';
import { logEvent } from '../../../shared/services/analytics';

const getDaysUntil = (dateString: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDate = (dateString: string): string => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

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
    description: 'Governors implement state laws and run the state executive branch.',
    icon: '🏛️',
  },
  {
    key: 'state_legislature',
    title: 'State Legislature',
    description: 'State legislators create and vote on state laws.',
    icon: '📜',
  },
  {
    key: 'local',
    title: 'Local Offices',
    description: 'Local officials handle city, county, schools, and community services.',
    icon: '🏘️',
  },
];

const FeedScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, accessToken, addToRoster, isInRoster, roster } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [candidates, setCandidates] = useState<Record<OfficeBucket, Candidate[]>>(() =>
    groupCandidatesByOfficeLevel([], false) as Record<OfficeBucket, Candidate[]>
  );
  const { selectedForComparison, handleToggleComparison, handleCompare } =
    useCandidatePairCompare();
  const [matchDeck, setMatchDeck] = useState<Candidate[]>([]);
  const [hasHadDeck, setHasHadDeck] = useState(false);

  const passedIdsRef = React.useRef<Set<string>>(new Set());
  const locationKeyRef = React.useRef<string>('');
  const loadInProgressRef = React.useRef(false);

  const userState = user?.location?.state || DEFAULT_STATE;
  const userAddress = user?.location?.address;
  const nextElection = getNextElection(userState);
  const locationKey = `${userState}|${userAddress || ''}|${user?.location?.latitude || ''}|${user?.location?.longitude || ''}`;

  const loadCandidates = React.useCallback(async () => {
    if (loadInProgressRef.current) return;
    loadInProgressRef.current = true;
    try {
      setLoading(true);
      setLoadError(false);
      const prefCount = user?.preferences?.length ?? 0;
      const useMatch = Boolean(accessToken && prefCount > 0);
      const response = await candidateApi.getAll({
        state: userState,
        location: userAddress || undefined,
        lat: user?.location?.latitude,
        lng: user?.location?.longitude,
        includeMatch: useMatch,
        sortMatch: useMatch,
      });

      const grouped = groupCandidatesByOfficeLevel(
        (response.data || []) as unknown[],
        useMatch
      ) as Record<OfficeBucket, Candidate[]>;
      setCandidates(grouped);

      const listCount = Object.values(grouped).reduce((n, arr) => n + arr.length, 0);
      logEvent('candidates_feed_loaded', {
        count: listCount,
        includeMatch: useMatch,
        state: userState,
      });

      const rows = (response.data || []) as Record<string, unknown>[];
      if (useMatch && rows.length > 0) {
        const deck = rows
          .map((r) => toSwipeCandidate(r, userState))
          .filter((c) => !passedIdsRef.current.has(c.id))
          .slice(0, 12);
        setMatchDeck(deck);
        if (deck.length > 0) setHasHadDeck(true);
      } else {
        setMatchDeck([]);
      }
    } catch (error) {
      console.warn('Error loading candidates:', error);
      setLoadError(true);
      setCandidates(groupCandidatesByOfficeLevel([], false) as Record<OfficeBucket, Candidate[]>);
      setMatchDeck([]);
    } finally {
      setLoading(false);
      loadInProgressRef.current = false;
    }
  }, [
    userState,
    userAddress,
    accessToken,
    user?.preferences?.length,
    user?.location?.latitude,
    user?.location?.longitude,
  ]);

  React.useEffect(() => {
    if (locationKeyRef.current && locationKeyRef.current !== locationKey) {
      passedIdsRef.current = new Set();
      setHasHadDeck(false);
    }
    locationKeyRef.current = locationKey;
    loadCandidates();
  }, [loadCandidates, locationKey]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCandidates();
    setRefreshing(false);
  };

  const handleCandidatePress = (candidateId: string) => {
    navigation.navigate('CandidateDetail' as never, { candidateId } as never);
  };

  const openBrowse = () => navigation.navigate('DiscoverList' as never);

  const popMatchDeck = (id: string) => {
    setMatchDeck((prev) => prev.filter((c) => c.id !== id));
  };

  const handlePass = (id: string) => {
    passedIdsRef.current.add(id);
    popMatchDeck(id);
  };

  const handleLike = (candidate: Candidate) => {
    passedIdsRef.current.add(candidate.id);
    addToRoster({
      id: candidate.id,
      name: candidate.name,
      party: candidate.party || '',
      office: candidate.office,
      photo: candidate.photo,
    });
    popMatchDeck(candidate.id);
  };

  const visibleDeck = matchDeck.filter((c) => !isInRoster(c.id));
  const topCard = visibleDeck[0];
  const deckFinished = hasHadDeck && visibleDeck.length === 0;
  const hasBallotCandidates = Object.values(candidates).some((arr) => arr.length > 0);
  const showOfficeLists = !features.mvpMode || (!hasHadDeck && visibleDeck.length === 0);

  const renderOfficeSection = (level: (typeof OFFICE_LEVELS)[0]) => {
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
            name={candidate.name}
            party={candidate.party}
            photo={candidate.photo}
            office={candidate.office}
            matchScore={candidate.matchScore}
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={() => navigation.navigate('AddressEntry')}
            accessibilityRole="button"
            accessibilityLabel="Change voting address"
          >
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.locationText}>{userState || DEFAULT_STATE}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ElectionCalendar')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Election calendar"
          >
            <Ionicons name="calendar-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchContainer}
          onPress={openBrowse}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Browse candidates and offices"
        >
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <Text style={styles.searchPlaceholder}>Browse candidates, offices...</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

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
            <Text style={styles.loadingText}>Finding candidates on your ballot...</Text>
          </View>
        ) : (
          <>
            {nextElection && (
              <TouchableOpacity
                style={styles.electionChip}
                onPress={() => navigation.navigate('ElectionCalendar')}
                accessibilityRole="button"
                accessibilityLabel={`${nextElection.name}, ${formatDate(nextElection.date)}`}
              >
                <Text style={styles.electionChipIcon}>{nextElection.icon}</Text>
                <View style={styles.electionChipMeta}>
                  <Text style={styles.electionChipName} numberOfLines={1}>
                    {nextElection.name}
                  </Text>
                  <Text style={styles.electionChipDate}>
                    {formatDate(nextElection.date)} · {getDaysUntil(nextElection.date)} days
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}

            {visibleDeck.length > 0 && (
              <View style={styles.matchDeckBlock}>
                <Text style={styles.matchDeckTitle}>
                  {features.mvpMode ? 'Your matches' : 'Top matches for you'}
                </Text>
                <Text style={styles.matchDeckHint}>
                  Right or ♥ adds them to your shortlist. Left skips. Up or ℹ to read more.
                </Text>
                <View style={styles.matchDeckStack}>
                  {visibleDeck.slice(0, 3).map((c, index) => (
                    <SwipeableCard
                      key={c.id}
                      candidate={c}
                      matchScore={c.matchScore}
                      index={index}
                      onSwipeLeft={() => handlePass(c.id)}
                      onSwipeRight={() => handleLike(c)}
                      onSwipeUp={() =>
                        navigation.navigate('CandidateDetail' as never, {
                          candidateId: c.id,
                        } as never)
                      }
                    />
                  ))}
                </View>
                {topCard && (
                  <View style={styles.matchActions}>
                    <TouchableOpacity
                      style={[styles.matchActionBtn, styles.matchActionPass]}
                      onPress={() => handlePass(topCard.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Pass on ${topCard.name}`}
                    >
                      <Ionicons name="close" size={28} color={colors.swipePass} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.matchActionBtn, styles.matchActionMore]}
                      onPress={() =>
                        navigation.navigate('CandidateDetail' as never, {
                          candidateId: topCard.id,
                        } as never)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Learn more about ${topCard.name}`}
                    >
                      <Ionicons name="information" size={26} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.matchActionBtn, styles.matchActionLike]}
                      onPress={() => handleLike(topCard)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${topCard.name} to shortlist`}
                    >
                      <Ionicons name="heart" size={26} color={colors.swipeLike} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {deckFinished && (
              <View style={styles.finishedCard}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                <Text style={styles.finishedTitle}>You reviewed your top matches</Text>
                <Text style={styles.finishedSubtitle}>
                  {roster.length === 0
                    ? 'No one made the shortlist yet. Browse the rest of the ballot, or pull down to start over.'
                    : `${roster.length} candidate${roster.length === 1 ? '' : 's'} on your shortlist.`}
                </Text>
                <View style={styles.finishedActions}>
                  {roster.length > 0 && (
                    <Button
                      title="View shortlist"
                      onPress={() => navigation.navigate('Roster')}
                      fullWidth
                    />
                  )}
                  <Button
                    title="Browse all candidates"
                    onPress={openBrowse}
                    variant={roster.length > 0 ? 'secondary' : 'primary'}
                    fullWidth
                  />
                </View>
              </View>
            )}

            {showOfficeLists && (
              <>
                <View style={[styles.sectionHeader, { marginTop: visibleDeck.length > 0 ? 24 : 8 }]}>
                  <Text style={styles.sectionTitle}>Candidates on your ballot</Text>
                  <Text style={styles.sectionSubtitle}>
                    {hasBallotCandidates
                      ? 'Tap a candidate to learn more. Add the ones you want to your shortlist.'
                      : features.mvpMode
                        ? 'Add your voting address in Profile for local context—or browse all North Carolina candidates.'
                        : 'Add your address in Profile to see races in your area, or open Discover to browse.'}
                  </Text>
                </View>

                {OFFICE_LEVELS.map(renderOfficeSection)}
              </>
            )}

            {Object.values(candidates).every((arr) => arr.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons
                  name={loadError ? 'cloud-offline-outline' : 'people-outline'}
                  size={56}
                  color={colors.textTertiary}
                />
                <Text style={styles.emptyTitle}>
                  {loadError ? "Couldn't load candidates" : 'No candidates yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {loadError
                    ? 'Check your connection and pull down to refresh.'
                    : 'Enter your voting address to see races in your area—or browse all North Carolina candidates.'}
                </Text>
                {!loadError && (
                  <View style={styles.emptyActions}>
                    <TouchableOpacity
                      style={styles.emptyCta}
                      onPress={() => navigation.navigate('AddressEntry')}
                    >
                      <Text style={styles.emptyCtaText}>Add address</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.emptyCta} onPress={openBrowse}>
                      <Text style={styles.emptyCtaText}>
                        {features.mvpMode ? 'Browse NC candidates' : 'Try Discover'}
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
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
    backgroundColor: colors.surface,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
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
  electionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 10,
  },
  electionChipIcon: {
    fontSize: 22,
  },
  electionChipMeta: {
    flex: 1,
  },
  electionChipName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  electionChipDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  matchDeckBlock: {
    marginBottom: 8,
  },
  matchDeckTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  matchDeckHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  matchDeckStack: {
    position: 'relative',
    width: '100%',
    height: 520,
    alignItems: 'center',
    marginBottom: 12,
  },
  matchActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 8,
  },
  matchActionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  matchActionPass: {
    backgroundColor: colors.errorMuted,
    borderColor: colors.swipePass + '55',
  },
  matchActionMore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderLight,
  },
  matchActionLike: {
    backgroundColor: colors.successMuted,
    borderColor: colors.swipeLike + '55',
  },
  finishedCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  finishedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  finishedSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 20,
  },
  finishedActions: {
    width: '100%',
    gap: 10,
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
    lineHeight: 20,
  },
  emptyActions: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
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
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primaryMuted,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  emptyCtaText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default FeedScreen;
