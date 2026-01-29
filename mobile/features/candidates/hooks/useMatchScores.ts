import { useState, useEffect, useCallback } from 'react';
import { candidateApi } from '../services/candidateApi';
import { Candidate } from '../../../../shared/types';

interface UseMatchScoresOptions {
  candidates: Candidate[];
  userId: string;
  enabled?: boolean;
  limit?: number; // Limit number of scores to fetch
}

interface UseMatchScoresResult {
  scores: Record<string, number>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useMatchScores = (options: UseMatchScoresOptions): UseMatchScoresResult => {
  const { candidates, userId, enabled = true, limit } = options;
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatchScores = useCallback(async () => {
    if (!enabled || !userId || candidates.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const candidatesToFetch = limit ? candidates.slice(0, limit) : candidates;
      const scoresMap: Record<string, number> = {};

      // Fetch scores in parallel
      const promises = candidatesToFetch.map(async (candidate) => {
        try {
          const response = await candidateApi.getMatchScore(candidate.id, userId);
          scoresMap[candidate.id] = response.data.score;
        } catch (err) {
          console.error(`Error loading match score for ${candidate.id}:`, err);
        }
      });

      await Promise.all(promises);
      setScores(scoresMap);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load match scores');
      setError(error);
      console.error('Error loading match scores:', err);
    } finally {
      setLoading(false);
    }
  }, [candidates, userId, enabled, limit]);

  useEffect(() => {
    fetchMatchScores();
  }, [fetchMatchScores]);

  return {
    scores,
    loading,
    error,
    refetch: fetchMatchScores,
  };
};
