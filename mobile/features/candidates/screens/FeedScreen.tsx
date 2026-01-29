import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar, TabBar, CategorySection, Button } from '../../../../shared/components/ui';
import { CandidateCard } from '../components/CandidateCard';
import { useUser } from '../../../features/auth/context/UserContext';
import { candidateApi } from '../services/candidateApi';
import { electionApi } from '../../../features/elections/services/electionApi';
import { colors, shadows, borderRadius } from '../../../../shared/theme/colors';

// Election level categories
const CATEGORIES = [
  { key: 'ballot', label: 'Ballot', icon: 'document-text-outline' },
  { key: 'administration', label: 'Administration', icon: 'business-outline' },
  { key: 'policy', label: 'Policy', icon: 'newspaper-outline' },
];

// Office levels
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
    description: 'State Governors are elected by the people. Governors are responsible for implementing state laws and overseeing the operation of the state executive branch.',
    icon: '🏛️',
  },
  {
    key: 'state_legislature',
    title: 'State Legislature',
    description: 'State legislators create and vote on state laws that affect your daily life.',
    icon: '📜',
  },
  {
    key: 'local',
    title: 'Local Offices',
    description: 'Local officials handle city and county governance, schools, and community services.',
    icon: '🏘️',
  },
];

interface Candidate {
  id: string;
  name: string;
  party: string;
  photo?: string;
  office?: string;
  officeLevel?: string;
}

const FeedScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState('ballot');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  const userState = user?.location?.state || 'NC';

  useEffect(() => {
    loadCandidates();
  }, [userState]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const response = await candidateApi.getAll({ state: userState });

      // Group candidates by office level
      const grouped: Record<string, Candidate[]> = {
        federal: [],
        state: [],
        state_legislature: [],
        local: [],
      };

      (response.data || []).forEach((candidate: any) => {
        const level = candidate.office_level || candidate.officeLevel || 'local';
        if (grouped[level]) {
          grouped[level].push(candidate);
        } else {
          grouped.local.push(candidate);
        }
      });

      setCandidates(grouped);
    } catch (error) {
      console.error('Error loading candidates:', error);
      // NC-specific mock data for demo
      setCandidates({
        federal: [
          { id: 'nc-sen-tillis', name: 'Thom Tillis', party: 'Republican Party', office: 'U.S. Senate', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Thom_Tillis_official_photo.jpg/440px-Thom_Tillis_official_photo.jpg' },
          { id: 'nc-sen-budd', name: 'Ted Budd', party: 'Republican Party', office: 'U.S. Senate', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Ted_Budd_117th_Congress_portrait.jpg/440px-Ted_Budd_117th_Congress_portrait.jpg' },
        ],
        state: [
          { id: 'nc-gov-stein', name: 'Josh Stein', party: 'Democratic Party', office: 'Governor of North Carolina', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Josh_Stein_official_photo.jpg/440px-Josh_Stein_official_photo.jpg' },
          { id: 'nc-gov-robinson', name: 'Mark Robinson', party: 'Republican Party', office: 'Governor of North Carolina', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Mark_Robinson_official_photo_%28cropped%29.jpg/440px-Mark_Robinson_official_photo_%28cropped%29.jpg' },
        ],
        state_legislature: [
          { id: 'nc-house-d92', name: 'Sample State Rep', party: 'Democratic Party', office: 'NC House District 92' },
        ],
        local: [
          { id: 'nc-clt-mayor', name: 'Vi Lyles', party: 'Democratic Party', office: 'Mayor of Charlotte' },
          { id: 'nc-meck-commission', name: 'Sample Commissioner', party: 'Democratic Party', office: 'Mecklenburg County Commission' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCandidates();
    setRefreshing(false);
  };

  const handleCandidatePress = (candidateId: string) => {
    navigation.navigate('CandidateDetail' as never, { candidateId } as never);
  };

  const handleToggleComparison = (candidateId: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      }
      if (prev.length >= 2) {
        // Replace the first one
        return [prev[1], candidateId];
      }
      return [...prev, candidateId];
    });
  };

  const handleCompare = () => {
    if (selectedForComparison.length === 2) {
      navigation.navigate('Compare' as never, {
        candidateIds: selectedForComparison,
      } as never);
    }
  };

  const renderOfficeSection = (level: typeof OFFICE_LEVELS[0]) => {
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
        defaultExpanded={level.key === 'state'}
      >
        {levelCandidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            id={candidate.id}
            name={candidate.name}
            party={candidate.party}
            photo={candidate.photo}
            office={candidate.office}
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.locationText}>{userState || 'North Carolina'}</Text>
          </View>
          <View style={styles.headerIcons}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="What are you looking for?"
          />
        </View>

        {/* Category Tabs */}
        <TabBar
          tabs={CATEGORIES.map((cat) => ({
            key: cat.key,
            label: cat.label,
          }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      {/* Content */}
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
            <Text style={styles.loadingText}>Loading your ballot...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'ballot' && (
              <>
                {OFFICE_LEVELS.map(renderOfficeSection)}

                {Object.values(candidates).every((arr) => arr.length === 0) && (
                  <View style={styles.emptyState}>
                    <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No candidates found</Text>
                    <Text style={styles.emptySubtitle}>
                      We couldn't find candidates for your location. Try updating your address.
                    </Text>
                  </View>
                )}
              </>
            )}

            {activeTab === 'administration' && (
              <View style={styles.comingSoon}>
                <Ionicons name="business-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.comingSoonText}>Administration info coming soon</Text>
              </View>
            )}

            {activeTab === 'policy' && (
              <View style={styles.comingSoon}>
                <Ionicons name="newspaper-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.comingSoonText}>Policy comparisons coming soon</Text>
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
    backgroundColor: colors.white,
    paddingBottom: 12,
    ...shadows.small,
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
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
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
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  comingSoonText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default FeedScreen;
