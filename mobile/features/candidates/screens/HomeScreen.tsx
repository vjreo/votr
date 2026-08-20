import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CandidateCard from '../components/CandidateCard';
import { CategorySection, Button, SearchBar } from '../../../shared/components/ui';
import { useUser } from '../../../features/auth/context/UserContext';
import { candidateApi } from '../services/candidateApi';
import { Candidate } from '../../../shared/types';
import { colors, typography } from '../../../shared/theme/colors';
import { DEFAULT_STATE } from '../../../shared/constants';
import { features } from '../../../shared/config/features';
import { groupCandidatesByOffice, toSwipeCandidate } from '../utils/candidateGrouping';
import { useCandidatePairCompare } from '../hooks/useCandidatePairCompare';
import { logEvent } from '../../../shared/services/analytics';

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, accessToken } = useUser();
  const isStackBrowse = route.name === 'DiscoverList';
  const [rows, setRows] = useState<Candidate[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { selectedForComparison, handleToggleComparison, handleCompare } =
    useCandidatePairCompare();
  const loadInProgressRef = React.useRef(false);
  const useMatch = Boolean(accessToken && (user?.preferences?.length ?? 0) > 0);

  const loadCandidates = useCallback(async () => {
    if (loadInProgressRef.current) return;
    loadInProgressRef.current = true;
    try {
      setLoading(true);
      setLoadError(false);
      const state = user?.location?.state || DEFAULT_STATE;
      const location = user?.location?.address;
      const response = await candidateApi.getAll({
        state,
        location,
        lat: user?.location?.latitude,
        lng: user?.location?.longitude,
        includeMatch: useMatch,
        sortMatch: useMatch,
      });

      const list = ((response.data || []) as Record<string, unknown>[]).map((r) =>
        toSwipeCandidate(r, state)
      );
      setRows(list);
      logEvent('discover_list_loaded', {
        count: list.length,
        includeMatch: useMatch,
        stack: isStackBrowse,
      });
    } catch (error) {
      console.error('Error loading candidates:', error);
      setLoadError(true);
      setRows([]);
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
    isStackBrowse,
    useMatch,
  ]);

  React.useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCandidates();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => {
      const hay = `${c.name} ${c.office} ${c.party || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const groups = useMemo(
    () => groupCandidatesByOffice(filtered, useMatch),
    [filtered, useMatch]
  );

  const handleCandidatePress = (candidateId: string) => {
    navigation.navigate('CandidateDetail' as never, { candidateId } as never);
  };

  const selectedCount = selectedForComparison.length;

  if (loading && rows.length === 0) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading candidates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          {features.mvpMode ? 'Browse candidates' : 'Discover'}
        </Text>
        <Text style={styles.headerSubtitle}>
          Search by name or office. Check Compare on two candidates, then use the bar below.
        </Text>
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, office, or party"
          />
        </View>
      </View>

      {rows.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name={loadError ? 'cloud-offline-outline' : 'people-outline'}
            size={56}
            color={colors.textTertiary}
          />
          <Text style={styles.emptyText}>
            {loadError ? "Couldn't load candidates" : 'No candidates found'}
          </Text>
          <Text style={styles.emptySubtext}>
            {loadError
              ? 'Check your connection and try again.'
              : 'Add your address in Profile to see races in your area, or check back closer to election day.'}
          </Text>
          <Button
            title="Try again"
            onPress={loadCandidates}
            style={styles.retryButton}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: selectedCount > 0 ? 140 : 100 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          keyboardShouldPersistTaps="handled"
        >
          {groups.length === 0 ? (
            <Text style={styles.noResults}>No matches for “{query}”</Text>
          ) : (
            groups.map((group) => (
              <CategorySection
                key={group.office}
                title={group.office}
                defaultExpanded
              >
                {group.candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      name={candidate.name}
                      party={candidate.party || ''}
                      photo={candidate.photo}
                      office={candidate.office}
                      matchScore={candidate.matchScore}
                      onPress={() => handleCandidatePress(candidate.id)}
                      onCompare={() => handleToggleComparison(candidate.id)}
                      selected={selectedForComparison.includes(candidate.id)}
                    />
                ))}
              </CategorySection>
            ))
          )}
        </ScrollView>
      )}

      {selectedCount > 0 && (
        <View style={[styles.compareBar, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.compareBarText}>
            {selectedCount === 1
              ? 'Select one more to compare'
              : '2 selected'}
          </Text>
          <Button
            title="Compare"
            onPress={handleCompare}
            disabled={selectedCount !== 2}
            size="small"
          />
        </View>
      )}
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
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 160,
  },
  noResults: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...typography.title1,
    color: colors.textPrimary,
    marginBottom: 4,
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
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  searchWrap: {
    marginBottom: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  compareBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  compareBarText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default HomeScreen;
