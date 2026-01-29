import { useState, useEffect, useCallback } from 'react';
import { candidateApi } from '../services/candidateApi';

interface UseMatchScoreOptions {
  candidateId: string;
  userId: string;
  enabled?: boolean;
}

interface UseMatchScoreResult {
  score: number | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useMatchScore = (options: UseMatchScoreOptions): UseMatchScoreResult => {
  const { candidateId, userId, enabled = true } = options;
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatchScore = useCallback(async () => {
    if (!enabled || !candidateId || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await candidateApi.getMatchScore(candidateId, userId);
      setScore(response.data.score);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load match score');
      setError(error);
      console.error('Error loading match score:', err);
    } finally {
      setLoading(false);
    }
  }, [candidateId, userId, enabled]);

  useEffect(() => {
    fetchMatchScore();
  }, [fetchMatchScore]);

  return {
    score,
    loading,
    error,
    refetch: fetchMatchScore,
  };
};
