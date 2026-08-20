import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TabBar, Button, Card, ScreenHeader } from '../../../shared/components/ui';
import { candidateApi } from '../services/candidateApi';
import { useUser } from '../../../features/auth/context/UserContext';
import { useGamification } from '../../../features/gamification/context/GamificationContext';
import { colors, shadows, borderRadius } from '../../../shared/theme/colors';
import { logEvent } from '../../../shared/services/analytics';

// Comparison categories
const COMPARE_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'issues', label: 'Issues' },
  { key: 'background', label: 'Background' },
];

// Key issues to compare
const KEY_ISSUES = [
  { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { id: 'economy', label: 'Economy', icon: '💼' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'environment', label: 'Climate', icon: '🌱' },
  { id: 'immigration', label: 'Immigration', icon: '🌎' },
  { id: 'criminal_justice', label: 'Criminal Justice', icon: '⚖️' },
];

interface CandidateData {
  id: string;
  name: string;
  party: string;
  photo?: string;
  office?: string;
  currentPosition?: string;
  religion?: string;
  previousProfession?: string;
  positions?: Array<{
    issueName: string;
    stance: string;
  }>;
  career?: Array<{
    title: string;
    period: string;
  }>;
}

function partyColor(party: string = ''): string {
  const p = party.toLowerCase();
  if (p.includes('democrat')) return colors.democrat;
  if (p.includes('republican')) return colors.republican;
  if (p.includes('independent')) return colors.independent;
  return colors.other;
}

function shortName(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

const CompareScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { addToRoster, isInRoster } = useUser();
  const { recordComparison, unlockAchievement } = useGamification();

  const { candidateIds } = route.params as { candidateIds: string[] };

  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, [candidateIds]);

  useEffect(() => {
    // Record comparison for gamification
    if (candidates.length === 2) {
      logEvent('compare_opened', {
        a: candidateIds[0],
        b: candidateIds[1],
      });
      recordComparison(candidateIds);
      unlockAchievement('first_compare');
    }
  }, [candidates]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const promises = candidateIds.map((id) => candidateApi.getById(id));
      const responses = await Promise.all(promises);
      setCandidates(responses.map((r) => r.data));
    } catch (error) {
      console.warn('Error loading candidates:', error);
      setCandidates([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToRoster = async (candidate: CandidateData) => {
    await addToRoster?.({
      id: candidate.id,
      name: candidate.name,
      party: candidate.party || '',
      office: candidate.office,
      photo: candidate.photo,
    });
    unlockAchievement('first_roster');
  };

  const handleViewCandidate = (candidateId: string) => {
    navigation.navigate('CandidateDetail' as never, { candidateId } as never);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Compare" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading comparison...</Text>
        </View>
      </View>
    );
  }

  if (candidates.length < 2) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Compare" />
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.errorText}>
            {loadError ? "Couldn't load comparison" : 'Need two candidates to compare'}
          </Text>
          <Text style={styles.errorSubtext}>
            {loadError ? 'Check your connection and try again.' : 'Select two from Browse.'}
          </Text>
          <Button
            title={loadError ? 'Try again' : 'Go back'}
            onPress={loadError ? loadCandidates : () => navigation.goBack()}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  const [candidate1, candidate2] = candidates;

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Key Info Comparison */}
      <CompareRow
        label="Current Position"
        value1={candidate1?.currentPosition || candidate1?.office}
        value2={candidate2?.currentPosition || candidate2?.office}
      />
      <CompareRow
        label="Party"
        value1={candidate1?.party}
        value2={candidate2?.party}
        color1={partyColor(candidate1?.party)}
        color2={partyColor(candidate2?.party)}
      />
      <CompareRow
        label="Religion"
        value1={candidate1?.religion}
        value2={candidate2?.religion}
      />
      <CompareRow
        label="Previous Career"
        value1={candidate1?.previousProfession}
        value2={candidate2?.previousProfession}
      />
    </View>
  );

  const renderIssues = () => (
    <View style={styles.tabContent}>
      {KEY_ISSUES.map((issue) => {
        const stance1 = candidate1?.positions?.find(
          (p) =>
            p.issueName.toLowerCase() === issue.label.toLowerCase() ||
            p.issueName.toLowerCase().includes(issue.id.replace(/_/g, ' '))
        );
        const stance2 = candidate2?.positions?.find(
          (p) =>
            p.issueName.toLowerCase() === issue.label.toLowerCase() ||
            p.issueName.toLowerCase().includes(issue.id.replace(/_/g, ' '))
        );

        return (
          <Card key={issue.id} variant="outlined" style={styles.issueCard}>
            <View style={styles.issueHeader}>
              <Text style={styles.issueIcon}>{issue.icon}</Text>
              <Text style={styles.issueLabel}>{issue.label}</Text>
            </View>
            <View style={styles.issueComparison}>
              <View style={styles.issueStance}>
                <Text style={[styles.stanceName, { color: partyColor(candidate1?.party) }]}>
                  {shortName(candidate1?.name)}
                </Text>
                <Text style={styles.stanceText}>
                  {stance1?.stance || 'No position available'}
                </Text>
              </View>
              <View style={styles.issueDivider} />
              <View style={styles.issueStance}>
                <Text style={[styles.stanceName, { color: partyColor(candidate2?.party) }]}>
                  {shortName(candidate2?.name)}
                </Text>
                <Text style={styles.stanceText}>
                  {stance2?.stance || 'No position available'}
                </Text>
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );

  const renderBackground = () => (
    <View style={styles.tabContent}>
      <View style={styles.backgroundComparison}>
        {/* Candidate 1 Timeline */}
        <View style={styles.backgroundColumn}>
          <Text style={[styles.backgroundName, { color: partyColor(candidate1?.party) }]}>
            {candidate1?.name}
          </Text>
          {candidate1?.career?.map((item, index) => (
            <View key={index} style={styles.careerItem}>
              <View style={[styles.careerDot, { backgroundColor: partyColor(candidate1?.party) }]} />
              <View>
                <Text style={styles.careerTitle}>{item.title}</Text>
                <Text style={styles.careerPeriod}>{item.period}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Candidate 2 Timeline */}
        <View style={styles.backgroundColumn}>
          <Text style={[styles.backgroundName, { color: partyColor(candidate2?.party) }]}>
            {candidate2?.name}
          </Text>
          {candidate2?.career?.map((item, index) => (
            <View key={index} style={styles.careerItem}>
              <View style={[styles.careerDot, { backgroundColor: partyColor(candidate2?.party) }]} />
              <View>
                <Text style={styles.careerTitle}>{item.title}</Text>
                <Text style={styles.careerPeriod}>{item.period}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Compare" />

      {/* Candidate Photos */}
      <View style={styles.candidatePhotos}>
        <TouchableOpacity
          style={styles.candidatePhotoContainer}
          onPress={() => handleViewCandidate(candidate1?.id)}
        >
          {candidate1?.photo ? (
            <Image source={{ uri: candidate1.photo }} style={styles.candidatePhoto} />
          ) : (
            <View style={[styles.photoPlaceholder, { borderColor: partyColor(candidate1?.party) }]}>
              <Ionicons name="person" size={32} color={colors.textTertiary} />
            </View>
          )}
          <Text style={styles.candidateName}>{candidate1?.name}</Text>
          <Text style={[styles.candidateParty, { color: partyColor(candidate1?.party) }]}>
            {candidate1?.party?.replace(' Party', '')}
          </Text>
          {!isInRoster?.(candidate1?.id) && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddToRoster(candidate1)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${candidate1.name} to shortlist`}
            >
              <Ionicons name="add" size={16} color={colors.white} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <TouchableOpacity
          style={styles.candidatePhotoContainer}
          onPress={() => handleViewCandidate(candidate2?.id)}
        >
          {candidate2?.photo ? (
            <Image source={{ uri: candidate2.photo }} style={styles.candidatePhoto} />
          ) : (
            <View style={[styles.photoPlaceholder, { borderColor: partyColor(candidate2?.party) }]}>
              <Ionicons name="person" size={32} color={colors.textTertiary} />
            </View>
          )}
          <Text style={styles.candidateName}>{candidate2?.name}</Text>
          <Text style={[styles.candidateParty, { color: partyColor(candidate2?.party) }]}>
            {candidate2?.party?.replace(' Party', '')}
          </Text>
          {!isInRoster?.(candidate2?.id) && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddToRoster(candidate2)}
            >
              <Ionicons name="add" size={16} color={colors.white} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBarContainer}>
        <TabBar
          tabs={COMPARE_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'issues' && renderIssues()}
        {activeTab === 'background' && renderBackground()}
      </ScrollView>
    </View>
  );
};

// Comparison row component
const CompareRow: React.FC<{
  label: string;
  value1?: string;
  value2?: string;
  color1?: string;
  color2?: string;
}> = ({ label, value1, value2, color1, color2 }) => (
  <View style={styles.compareRow}>
    <Text style={styles.compareLabel}>{label}</Text>
    <View style={styles.compareValues}>
      <Text style={[styles.compareValue, color1 && { color: color1 }]}>
        {value1 || 'N/A'}
      </Text>
      <View style={styles.compareDivider} />
      <Text style={[styles.compareValue, color2 && { color: color2 }]}>
        {value2 || 'N/A'}
      </Text>
    </View>
  </View>
);

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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
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
    minWidth: 160,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    ...shadows.small,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 44,
  },
  candidatePhotos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
  },
  candidatePhotoContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  candidatePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.border,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  candidateParty: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  addButton: {
    position: 'absolute',
    top: 60,
    right: '25%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabBarContainer: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  tabContent: {
    gap: 12,
  },
  compareRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 16,
    ...shadows.small,
  },
  compareLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  compareValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compareValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  compareDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  issueCard: {
    marginBottom: 0,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  issueIcon: {
    fontSize: 20,
  },
  issueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  issueComparison: {
    flexDirection: 'row',
  },
  issueStance: {
    flex: 1,
    paddingHorizontal: 4,
  },
  issueDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  stanceName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  stanceText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  backgroundComparison: {
    flexDirection: 'row',
    gap: 16,
  },
  backgroundColumn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 16,
    ...shadows.small,
  },
  backgroundName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  careerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  careerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  careerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  careerPeriod: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default CompareScreen;
