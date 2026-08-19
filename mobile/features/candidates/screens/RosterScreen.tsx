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
import { colors, shadows } from '../../../shared/theme/colors';
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
        <Text style={styles.title}>{features.mvpMode ? 'Your Shortlist' : 'Build Your Voting List'}</Text>
        {!isEmpty && (
          <Text style={styles.subtitle}>
            {roster.length} candidate{roster.length !== 1 ? 's' : ''} selected
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
            <Text style={styles.emptyTitle}>Build your voting list</Text>
            <Text style={styles.emptySubtitle}>
              Add candidates from Match{features.mvpMode ? '' : ' or Discover'}. Your roster syncs when you sign in—handy at the polls.
            </Text>
            <Button
              title={features.mvpMode ? 'Browse candidates' : 'Discover Candidates'}
              onPress={() => navigation.navigate('DiscoverList' as never)}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <>
            {Object.entries(groupedRoster).map(([office, candidates]) => (
              <View key={office} style={styles.section}>
                <Text style={styles.sectionTitle}>{office}</Text>
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
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
    ...shadows.small,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
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
  },
  reminderCard: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '30',
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
