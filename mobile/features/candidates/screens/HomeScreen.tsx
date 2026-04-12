import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CandidateCard from '../components/CandidateCard';
import { CategorySection, Button } from '../../../shared/components/ui';
import { useUser } from '../../../features/auth/context/UserContext';
import { candidateApi } from '../services/candidateApi';
import { Candidate } from '../../../shared/types';
import { colors, borderRadius } from '../../../shared/theme/colors';
import { DEFAULT_STATE } from '../../../shared/constants';
import { features } from '../../../shared/config/features';
import { groupCandidatesByOfficeLevel, type OfficeBucket } from '../utils/candidateGrouping';
import { useCandidatePairCompare } from '../hooks/useCandidatePairCompare';
import { logEvent } from '../../../shared/services/analytics';

const OFFICE_LEVELS = [
  { key: 'federal', title: 'U.S. Senate', icon: '🏛️' },
  { key: 'state', title: 'Governor', icon: '🏛️' },
  { key: 'state_legislature', title: 'State Legislature', icon: '📜' },
  { key: 'local', title: 'Local Offices', icon: '🏘️' },
];

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, accessToken } = useUser();
  const isStackBrowse = route.name === 'DiscoverList';
  const [candidates, setCandidates] = useState<Record<OfficeBucket, Candidate[]>>(() =>
    groupCandidatesByOfficeLevel([], false) as Record<OfficeBucket, Candidate[]>
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { selectedForComparison, handleToggleComparison, handleCompare } =
    useCandidatePairCompare();
  const loadInProgressRef = React.useRef(false);

  const loadCandidates = useCallback(async () => {
    if (loadInProgressRef.current) return;
    loadInProgressRef.current = true;
    try {
      setLoading(true);
      const state = user?.location?.state || DEFAULT_STATE;
      const location = user?.location?.address;
      const prefCount = user?.preferences?.length ?? 0;
      const useMatch = Boolean(accessToken && prefCount > 0);
      const response = await candidateApi.getAll({
        state,
        location,
        lat: user?.location?.latitude,
        lng: user?.location?.longitude,
        includeMatch: useMatch,
        sortMatch: useMatch,
      });

      const grouped = groupCandidatesByOfficeLevel(
        (response.data || []) as unknown[],
        useMatch
      ) as Record<OfficeBucket, Candidate[]>;
      setCandidates(grouped);
      const listCount = Object.values(grouped).reduce((n, arr) => n + arr.length, 0);
      logEvent('discover_list_loaded', {
        count: listCount,
        includeMatch: useMatch,
        stack: isStackBrowse,
      });
    } catch (error) {
      console.error('Error loading candidates:', error);
      Alert.alert('Error', 'Failed to load candidates. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadInProgressRef.current = false;
    }
  }, [
    user?.location?.state,
    user?.location?.address,
    user?.location?.latitude,
    user?.location?.longitude,
    accessToken,
    user?.preferences?.length,
    isStackBrowse,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadCandidates();
    }, [loadCandidates])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCandidates();
  };

  const handleCandidatePress = (candidateId: string) => {
    navigation.navigate('CandidateDetail' as never, { candidateId } as never);
  };

  if (loading && !Object.values(candidates).some((arr) => arr.length > 0)) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading candidates...</Text>
      </View>
    );
  }

  const hasCandidates = Object.values(candidates).some((arr) => arr.length > 0);

  if (!hasCandidates) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="people-outline" size={56} color={colors.textTertiary} />
        <Text style={styles.emptyText}>No candidates found</Text>
        <Text style={styles.emptySubtext}>
          Add your address in Profile to see races in your area, or check back closer to election day.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {isStackBrowse && (
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {features.mvpMode ? 'Browse candidates' : 'Discover Candidates'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {user?.location?.state === 'NC'
            ? 'North Carolina: browse by office. Tap for details or compare two.'
            : 'Browse candidates by office. Tap to learn more or compare.'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {OFFICE_LEVELS.map((level) => {
          const levelCandidates = candidates[level.key] || [];
          if (levelCandidates.length === 0) return null;

          return (
            <CategorySection
              key={level.key}
              title={level.title}
              icon={<Text style={styles.categoryIcon}>{level.icon}</Text>}
              actionLabel="Tap to compare"
              defaultExpanded
            >
              {levelCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  name={candidate.name}
                  party={candidate.party}
                  photo={candidate.photo}
                  office={candidate.office}
                  matchScore={candidate.matchScore}
                  onPress={() => handleCandidatePress(candidate.id)}
                  onCompare={() => handleToggleComparison(candidate.id)}
                  selected={selectedForComparison.includes(candidate.id)}
                />
              ))}
              {levelCandidates.length >= 2 && (
                <Button
                  title="Compare selected"
                  onPress={handleCompare}
                  disabled={selectedForComparison.length !== 2}
                  fullWidth
                  variant={selectedForComparison.length === 2 ? 'primary' : 'secondary'}
                />
              )}
            </CategorySection>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  categoryIcon: {
    fontSize: 24,
  },
});

export default HomeScreen;
