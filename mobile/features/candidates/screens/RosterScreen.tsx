import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../../shared/components/ui';
import { useUser } from '../../../features/auth/context/UserContext';
import { colors, shadows, borderRadius } from '../../../shared/theme/colors';
import { features } from '../../../shared/config/features';

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
  const { roster, removeFromRoster } = useUser();

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

  const isEmpty = !roster || roster.length === 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Build Your Voting List</Text>
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

            {/* Share/Export section */}
            <View style={styles.actionsSection}>
              <Text style={styles.actionsSectionTitle}>Share Your Choices</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-outline" size={24} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="print-outline" size={24} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Print</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="download-outline" size={24} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Election day reminder */}
            <Card variant="outlined" style={styles.reminderCard}>
              <View style={styles.reminderContent}>
                <Ionicons name="calendar-outline" size={32} color={colors.primary} />
                <View style={styles.reminderText}>
                  <Text style={styles.reminderTitle}>Election Day</Text>
                  <Text style={styles.reminderSubtitle}>
                    Don't forget to bring this list on election day!
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
  actionsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 16,
    ...shadows.small,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
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
