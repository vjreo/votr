import { useState, useEffect, useCallback } from 'react';
import { electionApi } from '../services/electionApi';

interface Election {
  id: string;
  name: string;
  date: string;
  type: string;
  state?: string;
  district?: string;
}

interface UseUpcomingElectionsOptions {
  userId: string;
  enabled?: boolean;
}

interface UseUpcomingElectionsResult {
  elections: Election[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useUpcomingElections = (options: UseUpcomingElectionsOptions): UseUpcomingElectionsResult => {
  const { userId, enabled = true } = options;
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUpcomingElections = useCallback(async () => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await electionApi.getUpcoming(userId);
      setElections(response.data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load upcoming elections');
      setError(error);
      console.error('Error loading upcoming elections:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, enabled]);

  useEffect(() => {
    fetchUpcomingElections();
  }, [fetchUpcomingElections]);

  return {
    elections,
    loading,
    error,
    refetch: fetchUpcomingElections,
  };
};
