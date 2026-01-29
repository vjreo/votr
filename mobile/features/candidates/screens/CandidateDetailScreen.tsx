import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TabBar, Button, Card } from '../../../../shared/components/ui';
import SourceList from '../../../../shared/components/SourceList';
import { candidateApi } from '../services/candidateApi';
import { useUser } from '../../../features/auth/context/UserContext';
import { useGamification } from '../../../features/gamification/context/GamificationContext';
import { colors, shadows, borderRadius } from '../../../../shared/theme/colors';

const { width } = Dimensions.get('window');

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

      // Check if all tabs have been viewed
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
    } catch (error) {
      console.error('Error loading candidate:', error);
      // NC-specific mock data based on candidateId
      const ncCandidates: Record<string, CandidateData> = {
        'nc-gov-stein': {
          id: 'nc-gov-stein',
          name: 'Josh Stein',
          party: 'Democratic Party',
          photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Josh_Stein_official_photo.jpg/440px-Josh_Stein_official_photo.jpg',
          office: 'Governor of North Carolina',
          currentPosition: 'NC Attorney General',
          partyAffiliation: 'Democrat',
          religion: 'Jewish',
          previousProfession: 'Attorney',
          bio: 'Josh Stein has served as North Carolina\'s Attorney General since 2017. Before that, he served in the NC State Senate from 2009 to 2016, representing Wake County. He has focused on consumer protection, fighting the opioid epidemic, and criminal justice reform.\n\nAs Attorney General, he has taken on pharmaceutical companies over the opioid crisis, protected consumers from fraud, and worked to keep communities safe.',
          topInitiatives: [
            'Expand Medicaid to cover 600,000 more North Carolinians',
            'Protect public education and increase teacher pay',
            'Defend reproductive rights',
            'Combat the opioid crisis',
          ],
          positions: [
            { issueName: 'Healthcare', stance: 'Supports Medicaid expansion, protecting coverage for pre-existing conditions, and lowering prescription drug costs' },
            { issueName: 'Education', stance: 'Advocates for increased public school funding, higher teacher pay, and opposing private school vouchers' },
            { issueName: 'Environment', stance: 'Supports clean energy transition, offshore wind development, and environmental protections' },
            { issueName: 'Economy', stance: 'Focus on workforce development, supporting small businesses, and bringing clean energy jobs to NC' },
            { issueName: 'Criminal Justice', stance: 'Supports criminal justice reform, addressing root causes of crime, and smart-on-crime policies' },
          ],
          career: [
            { title: 'NC Attorney General', period: '2017 - Present', description: 'Elected as the state\'s top law enforcement officer' },
            { title: 'NC State Senator', period: '2009 - 2016', description: 'Represented District 16 (Wake County)' },
            { title: 'Senior Deputy Attorney General', period: '2001 - 2008', description: 'Consumer Protection Division' },
          ],
        },
        'nc-gov-robinson': {
          id: 'nc-gov-robinson',
          name: 'Mark Robinson',
          party: 'Republican Party',
          photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Mark_Robinson_official_photo_%28cropped%29.jpg/440px-Mark_Robinson_official_photo_%28cropped%29.jpg',
          office: 'Governor of North Carolina',
          currentPosition: 'NC Lieutenant Governor',
          partyAffiliation: 'Republican',
          religion: 'Christian',
          previousProfession: 'Business Owner, Factory Worker',
          bio: 'Mark Robinson became North Carolina\'s first Black Lieutenant Governor in 2021. Before entering politics, he worked in furniture manufacturing and owned a business.\n\nHe gained national attention in 2018 after a speech at a Greensboro City Council meeting about gun rights went viral, launching his political career.',
          topInitiatives: [
            'Support law enforcement and public safety',
            'Promote school choice and parental rights in education',
            'Lower taxes and reduce government regulations',
            'Protect Second Amendment rights',
          ],
          positions: [
            { issueName: 'Healthcare', stance: 'Supports market-based healthcare solutions, opposes government-run healthcare' },
            { issueName: 'Education', stance: 'Strong advocate for school choice, parental rights, and curriculum transparency' },
            { issueName: 'Environment', stance: 'Supports balanced approach between environment and economic development' },
            { issueName: 'Economy', stance: 'Supports tax cuts, reducing regulations, and pro-business policies' },
            { issueName: 'Criminal Justice', stance: 'Strong support for law enforcement, tough-on-crime policies' },
          ],
          career: [
            { title: 'NC Lieutenant Governor', period: '2021 - Present', description: 'First Black Lt. Governor in NC history' },
            { title: 'Political Activist', period: '2018 - 2020', description: 'Rose to prominence after viral gun rights speech' },
            { title: 'Business Owner', period: '2000s - 2018', description: 'Various business ventures' },
          ],
        },
      };

      // Return NC candidate if matched, otherwise default
      setCandidate(ncCandidates[candidateId] || ncCandidates['nc-gov-stein']);
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

  const getPartyColor = () => {
    const partyLower = candidate?.party?.toLowerCase() || '';
    if (partyLower.includes('democrat')) return colors.democrat;
    if (partyLower.includes('republican')) return colors.republican;
    return colors.other;
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
        <Text style={styles.errorText}>Candidate not found</Text>
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
      {/* Header with photo */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* Background pattern */}
        <View style={styles.headerBackground}>
          <View style={[styles.stripe, styles.stripe1]} />
          <View style={[styles.stripe, styles.stripe2]} />
          <View style={[styles.stripe, styles.stripe3]} />
        </View>

        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.white} />
        </TouchableOpacity>

        {/* Photo */}
        <View style={styles.photoContainer}>
          {candidate.photo ? (
            <Image source={{ uri: candidate.photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={60} color={colors.textTertiary} />
            </View>
          )}
        </View>

        {/* Name and party */}
        <Text style={styles.name}>{candidate.name}</Text>
        <Text style={[styles.party, { color: getPartyColor() }]}>{candidate.party}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBarContainer}>
        <TabBar
          tabs={DETAIL_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
          scrollable={true}
        />
      </View>

      {/* Content */}
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

      {/* Bottom action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={inRoster ? 'Remove from Roster' : 'Add Candidate'}
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

// Info row component
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
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.secondary,
    paddingBottom: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 20,
  },
  stripe1: {
    top: '20%',
    backgroundColor: '#C41E3A',
  },
  stripe2: {
    top: '40%',
    backgroundColor: colors.white,
  },
  stripe3: {
    top: '60%',
    backgroundColor: '#002868',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.white,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
    borderWidth: 4,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  party: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  tabBarContainer: {
    backgroundColor: colors.white,
    ...shadows.small,
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
    backgroundColor: colors.white,
    padding: 16,
    ...shadows.medium,
  },
});

export default CandidateDetailScreen;
