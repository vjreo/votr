import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../../../shared/components/ui';
import { useUser } from '../../../features/auth/context/UserContext';
import { candidateApi } from '../../candidates/services/candidateApi';
import { ballotMeasuresApi, BallotMeasure } from '../services/ballotMeasuresApi';
import { openUrlSafely, NC_BALLOT_URL } from '../../../shared/utils/openUrl';
import {
  getNextElection,
  getUpcomingDeadlines,
  getDaysUntil,
  formatShortDate,
} from '../../../shared/data/upcomingElections';
import { colors, borderRadius, shadows, typography } from '../../../shared/theme/colors';
import { DEFAULT_STATE } from '../../../shared/constants';

interface Candidate {
  id: string;
  name: string;
  party: string;
  office?: string;
  office_level?: string;
  photo?: string;
  dataStatus?: string;
}

interface ContestGroup {
  level: string;
  label: string;
  icon: string;
  contests: Array<{
    office: string;
    candidates: Candidate[];
  }>;
}

const LEVEL_CONFIG: Record<string, { label: string; icon: string; order: number }> = {
  federal: { label: 'Federal', icon: 'globe-outline', order: 1 },
  state: { label: 'State', icon: 'business-outline', order: 2 },
  state_legislature: { label: 'State Legislature', icon: 'people-outline', order: 3 },
  local: { label: 'County & Local', icon: 'home-outline', order: 4 },
};

function formatParty(party: string): string {
  if (!party) return '';
  if (party.toLowerCase().includes('democrat')) return 'Democrat';
  if (party.toLowerCase().includes('republican')) return 'Republican';
  if (party.toLowerCase().includes('libertarian')) return 'Libertarian';
  if (party.toLowerCase().includes('green')) return 'Green';
  return party;
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export default function YourBallotScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, isInRoster } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contestGroups, setContestGroups] = useState<ContestGroup[]>([]);
  const [amendments, setAmendments] = useState<BallotMeasure[]>([]);
  const [bonds, setBonds] = useState<BallotMeasure[]>([]);

  const userState = user?.location?.state || DEFAULT_STATE;
  const userAddress = user?.location?.address;
  const userCity = userAddress?.toLowerCase().includes('charlotte') ? 'Charlotte' : null;
  const nextElection = getNextElection(userState);
  const upcomingDeadlines = getUpcomingDeadlines(userState, 2);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load candidates
      const response = await candidateApi.getAll({
        state: userState,
        location: userAddress || undefined,
        lat: user?.location?.latitude,
        lng: user?.location?.longitude,
      });

      const candidates = (response.data || []) as Candidate[];

      // Group by office level, then by office
      const byLevel: Record<string, Record<string, Candidate[]>> = {};

      candidates.forEach((c) => {
        const level = c.office_level || 'local';
        const office = c.office || 'Unknown Office';

        if (!byLevel[level]) byLevel[level] = {};
        if (!byLevel[level][office]) byLevel[level][office] = [];
        byLevel[level][office].push(c);
      });

      // Convert to sorted contest groups
      const groups: ContestGroup[] = Object.entries(byLevel)
        .map(([level, offices]) => ({
          level,
          label: LEVEL_CONFIG[level]?.label || level,
          icon: LEVEL_CONFIG[level]?.icon || 'help-outline',
          contests: Object.entries(offices)
            .map(([office, cands]) => ({ office, candidates: cands }))
            .sort((a, b) => a.office.localeCompare(b.office)),
        }))
        .sort((a, b) => {
          const orderA = LEVEL_CONFIG[a.level]?.order || 99;
          const orderB = LEVEL_CONFIG[b.level]?.order || 99;
          return orderA - orderB;
        });

      setContestGroups(groups);

      // Load ballot measures
      try {
        const measuresRes = await ballotMeasuresApi.getAll({
          state: userState,
          county: 'Mecklenburg',
          city: userCity || undefined,
        });

        const measures = measuresRes.data?.measures || [];
        setAmendments(measures.filter((m: BallotMeasure) => m.type === 'amendment'));
        setBonds(measures.filter((m: BallotMeasure) => m.type === 'bond'));
      } catch {
        setAmendments([]);
        setBonds([]);
      }
    } catch (error) {
      console.warn('Error loading ballot data:', error);
      setContestGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userState, userAddress, user?.location?.latitude, user?.location?.longitude, userCity]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const hasContests = contestGroups.some((g) => g.contests.length > 0);
  const hasMeasures = amendments.length > 0 || bonds.length > 0;
  const hasAddress = Boolean(userAddress);

  const nextCriticalDeadline = upcomingDeadlines.find((d) => d.deadline.critical);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Your ballot</Text>
            <TouchableOpacity
              style={styles.locationPill}
              onPress={() => navigation.navigate('AddressEntry')}
              accessibilityLabel="Change voting address"
            >
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {hasAddress ? userAddress : `${userState} statewide`}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => navigation.navigate('ElectionCalendar')}
            accessibilityLabel="Election calendar"
          >
            <Ionicons name="calendar-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Next deadline strip */}
        {nextCriticalDeadline && (
          <View style={styles.deadlineStrip}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <Text style={styles.deadlineText}>
              {nextCriticalDeadline.deadline.name}:{' '}
              <Text style={styles.deadlineDate}>
                {formatShortDate(nextCriticalDeadline.deadline.date)} ({getDaysUntil(nextCriticalDeadline.deadline.date)} days)
              </Text>
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your ballot...</Text>
          </View>
        ) : !hasAddress ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={48} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Where do you vote?</Text>
            <Text style={styles.emptySubtitle}>
              Add your voting address to see the exact races and measures on your ballot.
            </Text>
            <Button
              title="Add your address"
              onPress={() => navigation.navigate('AddressEntry')}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <>
            {/* Election info card */}
            {nextElection && (
              <Card variant="outlined" style={styles.electionCard}>
                <View style={styles.electionHeader}>
                  <Text style={styles.electionName}>{nextElection.name}</Text>
                  <Text style={styles.electionDate}>
                    {new Date(nextElection.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <Text style={styles.electionDescription}>{nextElection.description}</Text>
              </Card>
            )}

            {/* Contest sections */}
            {hasContests ? (
              contestGroups.map((group) => (
                <View key={group.level} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name={group.icon as any} size={18} color={colors.textSecondary} />
                    <Text style={styles.sectionTitle}>{group.label}</Text>
                  </View>

                  {group.contests.map((contest) => (
                    <Card key={contest.office} variant="outlined" style={styles.contestCard}>
                      <Text style={styles.officeName}>{contest.office}</Text>
                      {contest.candidates.map((candidate, idx) => {
                        const inRoster = isInRoster?.(candidate.id);
                        return (
                          <TouchableOpacity
                            key={candidate.id}
                            style={[
                              styles.candidateRow,
                              idx === contest.candidates.length - 1 && styles.candidateRowLast,
                            ]}
                            onPress={() =>
                              navigation.navigate('CandidateDetail', { candidateId: candidate.id })
                            }
                          >
                            <View style={styles.candidateInfo}>
                              <View style={styles.candidateNameRow}>
                                <Text style={styles.candidateName}>{candidate.name}</Text>
                                {inRoster && (
                                  <View style={styles.shortlistBadge}>
                                    <Ionicons name="checkmark" size={10} color={colors.white} />
                                  </View>
                                )}
                              </View>
                              <Text style={styles.candidateParty}>{formatParty(candidate.party)}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                          </TouchableOpacity>
                        );
                      })}
                    </Card>
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.noContestsCard}>
                <Ionicons name="document-text-outline" size={32} color={colors.textTertiary} />
                <Text style={styles.noContestsText}>
                  No candidate data available yet for your address. Check back as Election Day approaches.
                </Text>
              </View>
            )}

            {/* Ballot Measures: Amendments */}
            {amendments.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.sectionTitle}>Statewide Amendments</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Constitutional amendments on every NC ballot
                </Text>

                {amendments.map((measure) => (
                  <Card key={measure.id} variant="outlined" style={styles.measureCard}>
                    <Text style={styles.measureTitle}>{measure.short_title || measure.title}</Text>
                    <Text style={styles.measureQuestion}>{measure.ballot_question}</Text>
                    {measure.explanation && (
                      <Text style={styles.measureExplanation}>{measure.explanation}</Text>
                    )}
                    <View style={styles.measureChoices}>
                      {(measure.choices || ['For', 'Against']).map((choice) => (
                        <View key={choice} style={styles.choicePill}>
                          <Text style={styles.choiceText}>{choice}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {/* Ballot Measures: City Bonds */}
            {bonds.length > 0 && userCity && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="cash-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.sectionTitle}>{userCity} Bonds</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Bond referendums for {userCity} city voters
                </Text>

                {bonds.map((measure) => (
                  <Card key={measure.id} variant="outlined" style={styles.measureCard}>
                    <View style={styles.measureTitleRow}>
                      <Text style={styles.measureTitle}>{measure.short_title || measure.title}</Text>
                      {measure.principal && (
                        <Text style={styles.measureAmount}>{formatMoney(measure.principal)}</Text>
                      )}
                    </View>
                    <Text style={styles.measureQuestion}>{measure.ballot_question}</Text>
                    {measure.explanation && (
                      <Text style={styles.measureExplanation}>{measure.explanation}</Text>
                    )}
                    {measure.estimated_tax_impact && (
                      <Text style={styles.measureTaxImpact}>
                        Estimated tax impact: {measure.estimated_tax_impact}
                      </Text>
                    )}
                    <View style={styles.measureChoices}>
                      {(measure.choices || ['Yes', 'No']).map((choice) => (
                        <View key={choice} style={styles.choicePill}>
                          <Text style={styles.choiceText}>{choice}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {/* Official lookup link */}
            <View style={styles.officialSection}>
              <Text style={styles.officialTitle}>Official sample ballot</Text>
              <Text style={styles.officialSubtitle}>
                For the complete official ballot including judicial races and additional local offices, use the NC State Board of Elections lookup.
              </Text>
              <Button
                title="View official ballot"
                onPress={() => openUrlSafely(NC_BALLOT_URL)}
                variant="secondary"
                fullWidth
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  locationText: {
    ...typography.footnote,
    color: colors.textPrimary,
    flex: 1,
  },
  calendarButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deadlineStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.warningMuted,
    borderRadius: borderRadius.md,
  },
  deadlineText: {
    ...typography.footnote,
    color: colors.textPrimary,
  },
  deadlineDate: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    ...typography.callout,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    ...typography.title2,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    minWidth: 200,
  },
  electionCard: {
    marginBottom: 20,
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary + '33',
  },
  electionHeader: {
    marginBottom: 8,
  },
  electionName: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  electionDate: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
  electionDescription: {
    ...typography.subhead,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginBottom: 12,
    marginLeft: 26,
  },
  contestCard: {
    marginBottom: 10,
  },
  officeName: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  candidateRowLast: {
    paddingBottom: 0,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  candidateName: {
    ...typography.callout,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  shortlistBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateParty: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noContestsCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  noContestsText: {
    ...typography.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  measureCard: {
    marginBottom: 12,
  },
  measureTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  measureTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: 12,
  },
  measureAmount: {
    ...typography.headline,
    color: colors.primary,
    fontWeight: '700',
  },
  measureQuestion: {
    ...typography.subhead,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  measureExplanation: {
    ...typography.footnote,
    color: colors.textTertiary,
    lineHeight: 18,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  measureTaxImpact: {
    ...typography.footnote,
    color: colors.success,
    marginBottom: 10,
  },
  measureChoices: {
    flexDirection: 'row',
    gap: 8,
  },
  choicePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.chipBackground,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  choiceText: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  officialSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  officialTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  officialSubtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
});
