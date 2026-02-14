import { useState, useEffect, useCallback } from 'react';
import { Candidate } from '../../../shared/types';
import { candidateApi } from '../services/candidateApi';

interface UseCandidatesOptions {
  state?: string;
  office?: string;
  location?: string;
  enabled?: boolean;
}

interface UseCandidatesResult {
  candidates: Candidate[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useCandidates = (options: UseCandidatesOptions = {}): UseCandidatesResult => {
  const { state, office, location, enabled = true } = options;
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCandidates = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const response = await candidateApi.getAll({ state, office, location });
      setCandidates(response.data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load candidates');
      setError(error);
      console.error('Error loading candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [state, office, location, enabled]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return {
    candidates,
    loading,
    error,
    refetch: fetchCandidates,
  };
};
