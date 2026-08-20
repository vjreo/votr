import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TabBar, Button, Card } from '../../../shared/components/ui';
import SourceList from '../../../shared/components/SourceList';
import { candidateApi } from '../services/candidateApi';
import { useUser } from '../../../features/auth/context/UserContext';
import { useGamification } from '../../../features/gamification/context/GamificationContext';
import { colors, typography, borderRadius } from '../../../shared/theme/colors';
import { logEvent } from '../../../shared/services/analytics';
import { features } from '../../../shared/config/features';

const DETAIL_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'bio', label: 'Bio' },
  { key: 'values', label: 'Values' },
  { key: 'career', label: 'Political Career' },
];

interface CandidateData {
  id: string;
  name: string;
  party: string;
  photo?: string;
  office?: string;
  bio?: string;
  religion?: string;
  previousProfession?: string;
  currentPosition?: string;
  partyAffiliation?: string;
  topInitiatives?: string[];
  positions?: Array<{
    issueName: string;
    stance: string;
    source?: string;
  }>;
  career?: Array<{
    title: string;
    period: string;
    description?: string;
  }>;
  sources?: any[];
}

const CandidateDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, addToRoster, removeFromRoster, isInRoster } = useUser();
  const { recordCandidateView, unlockAchievement, updateStreak } = useGamification();

  const { candidateId } = route.params as { candidateId: string };
  const [tabsViewed, setTabsViewed] = useState<Set<string>>(new Set(['overview']));

  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [inRoster, setInRoster] = useState(false);

  useEffect(() => {
    loadCandidate();
  }, [candidateId]);

  useEffect(() => {
    if (candidate && isInRoster) {
      setInRoster(isInRoster(candidate.id));
    }
  }, [candidate, isInRoster]);

  // Track candidate view for gamification
  useEffect(() => {
    if (candidate) {
      recordCandidateView(candidate.id);
      updateStreak();
    }
  }, [candidate]);

  // Track tab views for "Deep Diver" achievement
  useEffect(() => {
    if (activeTab && !tabsViewed.has(activeTab)) {
      const newTabsViewed = new Set(tabsViewed);
      newTabsViewed.add(activeTab);
      setTabsViewed(newTabsViewed);

      if (newTabsViewed.size >= 4) {
        unlockAchievement('deep_diver');
      }
    }
  }, [activeTab]);

  const loadCandidate = async () => {
    try {
      setLoading(true);
      const response = await candidateApi.getById(candidateId);
      setCandidate(response.data);
      logEvent('candidate_detail_view', { candidateId });
    } catch (error) {
      console.warn('Error loading candidate:', error);
      setCandidate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRoster = async () => {
    if (!candidate) return;

    if (inRoster) {
      await removeFromRoster?.(candidate.id);
      setInRoster(false);
    } else {
      await addToRoster?.(candidate);
      setInRoster(true);
      // Unlock achievement for first roster addition
      unlockAchievement('first_roster');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!candidate) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.errorText}>Couldn&apos;t load this candidate</Text>
        <Text style={styles.errorSubtext}>Check your connection and try again</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <Card variant="outlined" style={styles.infoCard}>
        <InfoRow label="Current Position" value={candidate.currentPosition || candidate.office} />
        <InfoRow label="Party affiliation" value={candidate.partyAffiliation || candidate.party} />
        <InfoRow label="Religion" value={candidate.religion} />
        <InfoRow label="Previous Profession" value={candidate.previousProfession} />
      </Card>

      {candidate.topInitiatives && candidate.topInitiatives.length > 0 && (
        <Card variant="outlined" style={styles.infoCard}>
          <Text style={styles.cardTitle}>Top Initiatives</Text>
          {candidate.topInitiatives.map((initiative, index) => (
            <View key={index} style={styles.initiativeItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.initiativeText}>{initiative}</Text>
            </View>
          ))}
        </Card>
      )}
    </View>
  );

  const renderBio = () => (
    <View style={styles.tabContent}>
      <Text style={styles.bioText}>{candidate.bio || 'No biography available.'}</Text>
    </View>
  );

  const renderValues = () => (
    <View style={styles.tabContent}>
      {candidate.positions && candidate.positions.length > 0 ? (
        candidate.positions.map((position, index) => (
          <Card key={index} variant="outlined" style={styles.positionCard}>
            <Text style={styles.positionIssue}>{position.issueName}</Text>
            <Text style={styles.positionStance}>{position.stance}</Text>
            {position.source && (
              <Text style={styles.positionSource}>Source: {position.source}</Text>
            )}
          </Card>
        ))
      ) : (
        <Text style={styles.emptyText}>No position information available.</Text>
      )}
    </View>
  );

  const renderCareer = () => (
    <View style={styles.tabContent}>
      {candidate.career && candidate.career.length > 0 ? (
        <View style={styles.timeline}>
          {candidate.career.map((item, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              {index < candidate.career!.length - 1 && <View style={styles.timelineLine} />}
              <View style={styles.timelineContent}>
                <Text style={styles.careerTitle}>{item.title}</Text>
                <Text style={styles.careerPeriod}>{item.period}</Text>
                {item.description && (
                  <Text style={styles.careerDescription}>{item.description}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No career information available.</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#2C2A27', colors.background]}
          style={StyleSheet.absoluteFill}
        />

        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 8 }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.photoContainer}>
          {candidate.photo ? (
            <Image source={{ uri: candidate.photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={56} color={colors.textTertiary} />
            </View>
          )}
        </View>

        <Text style={styles.name}>{candidate.name}</Text>
        <Text style={styles.party}>{candidate.party}</Text>
      </View>

      <View style={styles.tabBarContainer}>
        <TabBar
          tabs={DETAIL_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
          scrollable={true}
        />
      </View>

      {(!candidate.positions || candidate.positions.length === 0) && (
        <View style={styles.limitedIssueBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.limitedIssueText}>
            We don&apos;t have detailed issue positions for this candidate yet. Match scores only
            show when we have overlapping issues—no score is missing data, not a rating.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'bio' && renderBio()}
        {activeTab === 'values' && renderValues()}
        {activeTab === 'career' && renderCareer()}

        {candidate.sources && candidate.sources.length > 0 && (
          <View style={styles.sourcesSection}>
            <SourceList sources={candidate.sources} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={
            inRoster
              ? features.mvpMode
                ? 'Remove from Shortlist'
                : 'Remove from Roster'
              : features.mvpMode
                ? 'Add to Shortlist'
                : 'Add Candidate'
          }
          onPress={handleToggleRoster}
          variant={inRoster ? 'outline' : 'primary'}
          fullWidth
          icon={
            <Ionicons
              name={inRoster ? 'remove-circle-outline' : 'add-circle-outline'}
              size={20}
              color={inRoster ? colors.primary : colors.white}
            />
          }
        />
      </View>
    </View>
  );
};

const InfoRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  header: {
    backgroundColor: colors.background,
    paddingBottom: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  photoContainer: {
    marginTop: 48,
    marginBottom: 14,
  },
  photo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  photoPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    ...typography.title1,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  party: {
    ...typography.callout,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tabBarContainer: {
    backgroundColor: colors.background,
  },
  limitedIssueBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.primaryMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  limitedIssueText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  tabContent: {
    gap: 16,
  },
  infoCard: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1.5,
    textAlign: 'right',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  initiativeItem: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  bullet: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  initiativeText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  bioText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  positionCard: {
    marginBottom: 12,
  },
  positionIssue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  positionStance: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  positionSource: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  timeline: {
    paddingLeft: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    position: 'absolute',
    left: -26,
    top: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: -21,
    top: 16,
    bottom: -24,
    width: 2,
    backgroundColor: colors.border,
  },
  timelineContent: {
    flex: 1,
  },
  careerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  careerPeriod: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  careerDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  sourcesSection: {
    marginTop: 24,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});

export default CandidateDetailScreen;
