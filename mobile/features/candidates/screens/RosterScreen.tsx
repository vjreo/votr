import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../../shared/components/ui';
import { useUser } from '../../../features/auth/context/UserContext';
import { colors, typography } from '../../../shared/theme/colors';
import { features } from '../../../shared/config/features';
import { getNextElection } from '../../../shared/data/upcomingElections';
import { DEFAULT_STATE } from '../../../shared/constants';

interface RosterCandidate {
  id: string;
  name: string;
  party: string;
  office?: string;
  photo?: string;
}

const RosterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { roster, removeFromRoster, user } = useUser();

  // Group candidates by office type
  const groupedRoster = (roster || []).reduce((acc: Record<string, RosterCandidate[]>, candidate: RosterCandidate) => {
    const office = candidate.office || 'Other';
    if (!acc[office]) {
      acc[office] = [];
    }
    acc[office].push(candidate);
    return acc;
  }, {});

  const handleCandidatePress = (candidateId: string) => {
    navigation.navigate('CandidateDetail' as never, { candidateId } as never);
  };

  const handleRemove = (candidateId: string) => {
    removeFromRoster?.(candidateId);
  };

  const handleShare = async () => {
    const lines = (roster || [])
      .map((c) => `• ${c.name}${c.office ? ` — ${c.office}` : ''}`)
      .join('\n');
    try {
      await Share.share({
        message: `My VOTR shortlist:\n\n${lines}`,
      });
    } catch {
      Alert.alert('Couldn’t share', 'Try again in a moment.');
    }
  };

  const isEmpty = !roster || roster.length === 0;
  const nextElection = getNextElection(user?.location?.state || DEFAULT_STATE);
  const electionLabel = nextElection
    ? new Date(nextElection.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{features.mvpMode ? 'Shortlist' : 'My roster'}</Text>
        {!isEmpty && (
          <Text style={styles.subtitle}>
            {roster.length} candidate{roster.length !== 1 ? 's' : ''} for the ballot
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="clipboard-outline" size={64} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No one on your shortlist yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart on candidates you like. Build your list here, then bring it when you vote.
            </Text>
            <Button
              title="Start matching"
              onPress={() => navigation.navigate('Feed')}
              style={styles.emptyButton}
            />
            <Button
              title="Browse by office"
              onPress={() => navigation.navigate('DiscoverList' as never)}
              variant="secondary"
              style={styles.emptyButtonSecondary}
            />
          </View>
        ) : (
          <>
            {Object.entries(groupedRoster).map(([office, candidates]) => (
              <View key={office} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{office}</Text>
                  {candidates.length === 2 && (
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('Compare' as never, {
                          candidateIds: candidates.map((c) => c.id),
                        } as never)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Compare ${candidates[0].name} and ${candidates[1].name}`}
                    >
                      <Text style={styles.compareLink}>Compare</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {candidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    variant="elevated"
                    style={styles.candidateCard}
                    onPress={() => handleCandidatePress(candidate.id)}
                  >
                    <View style={styles.candidateContent}>
                      <View style={styles.candidatePhoto}>
                        {candidate.photo ? (
                          <Image
                            source={{ uri: candidate.photo }}
                            style={styles.photo}
                          />
                        ) : (
                          <View style={styles.photoPlaceholder}>
                            <Ionicons name="person" size={24} color={colors.textTertiary} />
                          </View>
                        )}
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={12} color={colors.white} />
                        </View>
                      </View>

                      <View style={styles.candidateInfo}>
                        <Text style={styles.candidateName}>{candidate.name}</Text>
                        <Text style={[styles.candidateParty, { color: colors.textSecondary }]}>
                          {candidate.party}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemove(candidate.id)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${candidate.name} from roster`}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))}
              </View>
            ))}

            <View style={styles.actionsSection}>
              <Button
                title="Share shortlist"
                onPress={handleShare}
                fullWidth
                variant="secondary"
                icon={<Ionicons name="share-outline" size={20} color={colors.primary} />}
              />
              <Button
                title="Preview sample ballot"
                onPress={() => navigation.navigate('SampleBallot' as never)}
                fullWidth
                variant="secondary"
                icon={<Ionicons name="document-text-outline" size={20} color={colors.primary} />}
              />
            </View>

            <Card variant="outlined" style={styles.reminderCard}>
              <View style={styles.reminderContent}>
                <Ionicons name="calendar-outline" size={32} color={colors.primary} />
                <View style={styles.reminderText}>
                  <Text style={styles.reminderTitle}>
                    {electionLabel ? `Election Day · ${electionLabel}` : 'Election Day'}
                  </Text>
                  <Text style={styles.reminderSubtitle}>
                    Bring this shortlist with you to the polls.
                  </Text>
                </View>
              </View>
            </Card>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  emptyButtonSecondary: {
    minWidth: 200,
    marginTop: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  compareLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  candidateCard: {
    marginBottom: 8,
  },
  candidateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  candidatePhoto: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  photoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  candidateParty: {
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  actionsSection: {
    marginTop: 8,
    marginBottom: 24,
    gap: 10,
  },
  reminderCard: {
    backgroundColor: colors.primaryMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary + '33',
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reminderText: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reminderSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default RosterScreen;
