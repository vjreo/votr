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
import { sampleBallotApi, Contest } from '../services/sampleBallotApi';
import { openUrlSafely, NC_BALLOT_URL } from '../../../shared/utils/openUrl';
import { colors, borderRadius, shadows } from '../../../shared/theme/colors';
import { DEFAULT_STATE } from '../../../shared/constants';

interface Candidate {
  id: string;
  name: string;
  party: string;
  office?: string;
  office_level?: string;
  photo?: string;
}

const OFFICE_LABELS: Record<string, string> = {
  federal: 'Federal',
  state: 'State',
  state_legislature: 'State Legislature',
  local: 'Local',
};

export default function SampleBallotScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [ballotContests, setBallotContests] = useState<Contest[]>([]);
  const [loadError, setLoadError] = useState(false);

  const userState = user?.location?.state || DEFAULT_STATE;
  const userAddress = user?.location?.address;

  const loadData = useCallback(async () => {
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

      (response.data || []).forEach((c: any) => {
        const level = c.office_level || c.officeLevel || 'local';
        const bucket = grouped[level] || grouped.local;
        bucket.push({
          ...c,
          photo: c.photo || c.photo_url,
        });
      });

      setCandidates(grouped);

      // Also try sample ballot API (raw ballot from Civic - may have data when candidates don't)
      if (userAddress) {
        try {
          const ballotRes = await sampleBallotApi.getByAddress(userAddress);
          const data = ballotRes.data;
          if (data?.success && data.contests?.length) {
            setBallotContests(data.contests);
          } else {
            setBallotContests([]);
          }
        } catch {
          setBallotContests([]);
        }
      } else {
        setBallotContests([]);
      }
    } catch (error) {
      setLoadError(true);
      setCandidates({ federal: [], state: [], state_legislature: [], local: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userState, userAddress]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const hasCandidates = Object.values(candidates).some((arr) => arr.length > 0);
  const hasBallotContests = ballotContests.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sample Ballot</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading && !hasCandidates ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your ballot...</Text>
          </View>
        ) : (
          <>
            <View style={styles.introSection}>
              <Text style={styles.introTitle}>Your ballot for {userState}</Text>
              <Text style={styles.introSubtitle}>
                {hasCandidates
                  ? 'Candidates on your ballot based on your address'
                  : 'Add your voting address in Profile to see candidates for your district.'}
              </Text>
            </View>

            {hasCandidates ? (
              Object.entries(candidates).map(([level, list]) => {
                if (list.length === 0) return null;
                const offices = [...new Set(list.map((c) => c.office || 'Unknown'))];
                return (
                  <View key={level} style={styles.section}>
                    <Text style={styles.sectionTitle}>{OFFICE_LABELS[level] || level}</Text>
                    {offices.map((office) => {
                      const officeCandidates = list.filter((c) => (c.office || 'Unknown') === office);
                      return (
                        <Card key={office} variant="outlined" style={styles.raceCard}>
                          <Text style={styles.officeName}>{office}</Text>
                          {officeCandidates.map((candidate, idx) => (
                            <TouchableOpacity
                              key={candidate.id}
                              style={[
                                styles.candidateRow,
                                idx === officeCandidates.length - 1 && styles.candidateRowLast,
                              ]}
                              onPress={() =>
                                navigation.navigate('CandidateDetail' as never, {
                                  candidateId: candidate.id,
                                } as never)
                              }
                            >
                              <View style={styles.candidateInfo}>
                                <Text style={styles.candidateName}>{candidate.name}</Text>
                                <Text style={styles.candidateParty}>{candidate.party}</Text>
                              </View>
                              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                            </TouchableOpacity>
                          ))}
                        </Card>
                      );
                    })}
                  </View>
                );
              })
            ) : hasBallotContests ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>On your ballot</Text>
                <Text style={styles.introSubtitle}>
                  Sample ballot from official election data
                </Text>
                {ballotContests.map((contest, i) => (
                  <Card key={i} variant="outlined" style={styles.raceCard}>
                    <Text style={styles.officeName}>{contest.office}</Text>
                    {contest.candidates?.map((c, j) => (
                      <View
                        key={j}
                        style={[
                          styles.candidateRow,
                          j === (contest.candidates?.length ?? 0) - 1 && styles.candidateRowLast,
                        ]}
                      >
                        <View style={styles.candidateInfo}>
                          <Text style={styles.candidateName}>{c.name}</Text>
                          {c.party && (
                            <Text style={styles.candidateParty}>{c.party}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                    {(!contest.candidates || contest.candidates.length === 0) && (
                      <Text style={styles.candidateParty}>No candidates listed</Text>
                    )}
                  </Card>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No ballot data yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your voting address in Profile, or use the official NC lookup below.
                </Text>
              </View>
            )}

            {/* Official NC lookup */}
            <View style={styles.officialSection}>
              <Text style={styles.officialTitle}>Official sample ballot</Text>
              <Text style={styles.officialSubtitle}>
                The NC State Board of Elections provides an official sample ballot lookup. You may need to enter your name and address.
              </Text>
              <Button
                title="Open NC Ballot Lookup"
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  introSection: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  raceCard: {
    padding: 16,
    marginBottom: 12,
  },
  officeName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  candidateParty: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  candidateRowLast: {
    borderBottomWidth: 0,
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
    paddingHorizontal: 24,
  },
  officialSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  officialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  officialSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
});
