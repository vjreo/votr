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
import { Button } from '../../../shared/components/ui';
import SwipeableCard from '../components/SwipeableCard';
import { useUser } from '../../../features/auth/context/UserContext';
import { candidateApi } from '../services/candidateApi';
import { getNextElection, getDaysUntil } from '../../../shared/data/upcomingElections';
import { colors, borderRadius, typography } from '../../../shared/theme/colors';
import { DEFAULT_STATE } from '../../../shared/constants';
import type { Candidate } from '../../../shared/types';
import { toSwipeCandidate } from '../utils/candidateGrouping';
import { logEvent } from '../../../shared/services/analytics';

const DECK_SIZE = 3;
const UNDO_MS = 5000;

function nextFromPool(
  pool: Candidate[],
  current: Candidate[],
  passed: Set<string>,
  rostered: (id: string) => boolean,
  count: number
): Candidate[] {
  const have = new Set(current.map((c) => c.id));
  const out = [...current];
  for (const c of pool) {
    if (out.length >= count) break;
    if (have.has(c.id) || passed.has(c.id) || rostered(c.id)) continue;
    out.push(c);
    have.add(c.id);
  }
  return out;
}

const FeedScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, accessToken, addToRoster, isInRoster, roster } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [pool, setPool] = useState<Candidate[]>([]);
  const [matchDeck, setMatchDeck] = useState<Candidate[]>([]);
  const [hasHadDeck, setHasHadDeck] = useState(false);
  const [lastPassed, setLastPassed] = useState<Candidate | null>(null);

  const passedIdsRef = React.useRef<Set<string>>(new Set());
  const locationKeyRef = React.useRef<string>('');
  const loadInProgressRef = React.useRef(false);
  const undoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInRosterRef = React.useRef(isInRoster);
  isInRosterRef.current = isInRoster;

  const userState = user?.location?.state || DEFAULT_STATE;
  const userAddress = user?.location?.address;
  const nextElection = getNextElection(userState);
  const locationKey = `${userState}|${userAddress || ''}|${user?.location?.latitude || ''}|${user?.location?.longitude || ''}`;

  const clearUndoTimer = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  const armUndo = (candidate: Candidate) => {
    clearUndoTimer();
    setLastPassed(candidate);
    undoTimerRef.current = setTimeout(() => {
      setLastPassed(null);
      undoTimerRef.current = null;
    }, UNDO_MS);
  };

  React.useEffect(() => () => clearUndoTimer(), []);

  const loadCandidates = React.useCallback(async (opts?: { quiet?: boolean }) => {
    if (loadInProgressRef.current) return;
    loadInProgressRef.current = true;
    try {
      if (!opts?.quiet) setLoading(true);
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

      const rows = (response.data || []) as Record<string, unknown>[];
      const list = rows.map((r) => toSwipeCandidate(r, userState));
      setPool(list);
      logEvent('candidates_feed_loaded', {
        count: list.length,
        includeMatch: useMatch,
        state: userState,
      });

      const deck = nextFromPool(
        list,
        [],
        passedIdsRef.current,
        (id) => isInRosterRef.current(id),
        DECK_SIZE
      );
      setMatchDeck(deck);
      setHasHadDeck(deck.length > 0);
    } catch (error) {
      console.warn('Error loading candidates:', error);
      setLoadError(true);
      setPool([]);
      setMatchDeck([]);
      setHasHadDeck(false);
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
      setLastPassed(null);
      clearUndoTimer();
    }
    locationKeyRef.current = locationKey;
    loadCandidates();
  }, [loadCandidates, locationKey]);

  const startOver = () => {
    passedIdsRef.current = new Set();
    setLastPassed(null);
    clearUndoTimer();
    const deck = nextFromPool(pool, [], new Set(), isInRoster, DECK_SIZE);
    setMatchDeck(deck);
    setHasHadDeck(deck.length > 0);
  };

  const handleRefresh = async () => {
    passedIdsRef.current = new Set();
    setLastPassed(null);
    clearUndoTimer();
    setRefreshing(true);
    await loadCandidates({ quiet: true });
    setRefreshing(false);
  };

  const openBrowse = () => navigation.navigate('DiscoverList' as never);

  const refillDeck = (withoutId: string) => {
    setMatchDeck((prev) =>
      nextFromPool(
        pool,
        prev.filter((c) => c.id !== withoutId),
        passedIdsRef.current,
        isInRoster,
        DECK_SIZE
      )
    );
  };

  const handlePass = (candidate: Candidate) => {
    passedIdsRef.current.add(candidate.id);
    armUndo(candidate);
    refillDeck(candidate.id);
  };

  const handleUndo = () => {
    if (!lastPassed) return;
    passedIdsRef.current.delete(lastPassed.id);
    const restored = lastPassed;
    setLastPassed(null);
    clearUndoTimer();
    setMatchDeck((prev) => {
      const without = prev.filter((c) => c.id !== restored.id);
      return [restored, ...without].slice(0, DECK_SIZE);
    });
    setHasHadDeck(true);
  };

  const handleLike = (candidate: Candidate) => {
    passedIdsRef.current.add(candidate.id);
    if (lastPassed?.id === candidate.id) {
      setLastPassed(null);
      clearUndoTimer();
    }
    addToRoster({
      id: candidate.id,
      name: candidate.name,
      party: candidate.party || '',
      office: candidate.office,
      photo: candidate.photo,
    });
    refillDeck(candidate.id);
  };

  const visibleDeck = matchDeck.filter((c) => !isInRoster(c.id));
  const topCard = visibleDeck[0];
  const deckFinished = hasHadDeck && visibleDeck.length === 0;
  const poolEmpty = pool.length === 0;

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
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.locationText}>{userState || DEFAULT_STATE}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ElectionCalendar')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Election calendar"
          >
            <Ionicons name="calendar-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        {nextElection ? (
          <Text style={styles.electionLine}>
            {nextElection.name} · {getDaysUntil(nextElection.date)} days
          </Text>
        ) : null}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={openBrowse}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Browse candidates and offices"
        >
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <Text style={styles.searchPlaceholder}>Browse by name or office</Text>
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
            {visibleDeck.length > 0 && (
              <View style={styles.matchDeckBlock}>
                <View style={styles.matchDeckStack}>
                  {visibleDeck.map((c, index) => (
                    <SwipeableCard
                      key={c.id}
                      candidate={c}
                      matchScore={c.matchScore}
                      index={index}
                      onSwipeLeft={() => handlePass(c)}
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
                      onPress={() => handlePass(topCard)}
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
                      <Ionicons name="information" size={22} color={colors.textPrimary} />
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
                <Text style={styles.finishedTitle}>You reviewed your ballot matches</Text>
                <Text style={styles.finishedSubtitle}>
                  {roster.length === 0
                    ? 'No one made the shortlist yet. Start over, or browse by office.'
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
                    title="Start over"
                    onPress={startOver}
                    variant={roster.length > 0 ? 'secondary' : 'primary'}
                    fullWidth
                  />
                  <Button
                    title="Browse all candidates"
                    onPress={openBrowse}
                    variant="secondary"
                    fullWidth
                  />
                </View>
              </View>
            )}

            {poolEmpty && (
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
                      <Text style={styles.emptyCtaText}>Browse NC candidates</Text>
                      <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {lastPassed && (
        <View style={[styles.undoToast, { bottom: insets.bottom + 16 }]}>
          <Text style={styles.undoText} numberOfLines={1}>
            Passed on {lastPassed.name}
          </Text>
          <TouchableOpacity
            onPress={handleUndo}
            accessibilityRole="button"
            accessibilityLabel={`Undo pass on ${lastPassed.name}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.undoAction}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  locationText: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  electionLine: {
    ...typography.caption1,
    color: colors.textTertiary,
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  searchPlaceholder: {
    flex: 1,
    ...typography.subhead,
    color: colors.textTertiary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  matchDeckBlock: {
    flex: 1,
    minHeight: 480,
  },
  matchDeckStack: {
    position: 'relative',
    width: '100%',
    flex: 1,
    minHeight: 480,
    alignItems: 'center',
    marginBottom: 8,
  },
  matchActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22,
    paddingVertical: 8,
  },
  matchActionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  matchActionPass: {
    backgroundColor: colors.errorMuted,
    borderColor: colors.swipePass + '44',
  },
  matchActionMore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  matchActionLike: {
    backgroundColor: colors.successMuted,
    borderColor: colors.swipeLike + '44',
  },
  finishedCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: 28,
    marginTop: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  finishedTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  finishedSubtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  finishedActions: {
    width: '100%',
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 14,
    ...typography.callout,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
  },
  emptyTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  emptyActions: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primaryMuted,
    borderRadius: borderRadius.full,
  },
  emptyCtaText: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.primary,
  },
  undoToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.full,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    gap: 12,
  },
  undoText: {
    flex: 1,
    ...typography.subhead,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  undoAction: {
    ...typography.callout,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default FeedScreen;
