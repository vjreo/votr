import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CandidateCard from '../components/CandidateCard';
import { CategorySection, Button } from '../../../shared/components/ui';
import { useUser } from '../../../features/auth/context/UserContext';
import { candidateApi } from '../services/candidateApi';
import { Candidate } from '../../../shared/types';
import { colors, shadows, borderRadius } from '../../../shared/theme/colors';
import { DEFAULT_STATE } from '../../../shared/constants';

const OFFICE_LEVELS = [
  { key: 'federal', title: 'U.S. Senate', icon: '🏛️' },
  { key: 'state', title: 'Governor', icon: '🏛️' },
  { key: 'state_legislature', title: 'State Legislature', icon: '📜' },
  { key: 'local', title: 'Local Offices', icon: '🏘️' },
];

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const loadInProgressRef = React.useRef(false);

  const loadCandidates = useCallback(async () => {
    if (loadInProgressRef.current) return;
    loadInProgressRef.current = true;
    try {
      setLoading(true);
      const state = user?.location?.state || DEFAULT_STATE;
      const location = user?.location?.address;
      const response = await candidateApi.getAll({ state, location });

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
    } catch (error) {
      console.error('Error loading candidates:', error);
      Alert.alert('Error', 'Failed to load candidates. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadInProgressRef.current = false;
    }
  }, [user?.location?.state, user?.location?.address]);

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

  const handleToggleComparison = (candidateId: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(candidateId)) return prev.filter((id) => id !== candidateId);
      if (prev.length >= 2) return [prev[1], candidateId];
      return [...prev, candidateId];
    });
  };

  const handleCompare = () => {
    if (selectedForComparison.length === 2) {
      navigation.navigate('Compare' as never, { candidateIds: selectedForComparison } as never);
    }
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
        <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyText}>No candidates found</Text>
        <Text style={styles.emptySubtext}>
          Check back later or update your address in Profile.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Discover Candidates</Text>
        <Text style={styles.headerSubtitle}>
          Browse candidates by office. Tap to learn more or compare.
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
