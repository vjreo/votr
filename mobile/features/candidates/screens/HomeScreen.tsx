import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SwipeableCard from '../components/SwipeableCard';
import { useUser } from '../../../features/auth/context/UserContext';
import { candidateApi } from '../services/candidateApi';
import { userApi } from '../../../features/auth/services/userApi';
import { Candidate } from '../../../../shared/types';
import { colors } from '../../../../shared/theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, refreshGamification } = useUser();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    if (candidates.length > 0 && user) {
      loadMatchScores();
    }
  }, [candidates, user]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const state = user?.location?.state || 'NC';
      const response = await candidateApi.getAll({ state });
      setCandidates(response.data);
    } catch (error) {
      console.error('Error loading candidates:', error);
      Alert.alert('Error', 'Failed to load candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMatchScores = async () => {
    if (!user) return;

    try {
      const scores: Record<string, number> = {};
      for (const candidate of candidates.slice(0, 5)) {
        // Load match scores for first 5 candidates
        try {
          const response = await candidateApi.getMatchScore(candidate.id, user.id);
          scores[candidate.id] = response.data.score;
        } catch (error) {
          console.error(`Error loading match score for ${candidate.id}:`, error);
        }
      }
      setMatchScores(scores);
    } catch (error) {
      console.error('Error loading match scores:', error);
    }
  };

  const handleSwipeLeft = async (candidate: Candidate) => {
    if (!user) return;
    try {
      await userApi.recordSwipe(user.id, candidate.id, 'left');
      await refreshGamification();
      moveToNext();
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
  };

  const handleSwipeRight = async (candidate: Candidate) => {
    if (!user) return;
    try {
      await userApi.recordSwipe(user.id, candidate.id, 'right');
      await refreshGamification();
      moveToNext();
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
  };

  const handleSwipeUp = (candidate: Candidate) => {
    navigation.navigate('CandidateDetail' as never, { candidateId: candidate.id } as never);
  };

  const moveToNext = () => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= candidates.length) {
        // Load more candidates if available
        loadCandidates();
        return 0;
      }
      return next;
    });
  };

  if (loading && candidates.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading candidates...</Text>
      </View>
    );
  }

  if (candidates.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No candidates found</Text>
        <Text style={styles.emptySubtext}>
          Check back later or update your location settings.
        </Text>
      </View>
    );
  }

  const visibleCandidates = candidates.slice(currentIndex, currentIndex + 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Candidates</Text>
        <Text style={styles.headerSubtitle}>
          Swipe right if aligned, left if not, up to learn more
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        {visibleCandidates.map((candidate, index) => (
          <SwipeableCard
            key={candidate.id}
            candidate={candidate}
            matchScore={matchScores[candidate.id]}
            onSwipeLeft={() => handleSwipeLeft(candidate)}
            onSwipeRight={() => handleSwipeRight(candidate)}
            onSwipeUp={() => handleSwipeUp(candidate)}
            index={index}
          />
        ))}
      </View>
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
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
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
});

export default HomeScreen;

