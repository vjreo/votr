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

interface UseElectionsOptions {
  state?: string;
  district?: string;
  enabled?: boolean;
}

interface UseElectionsResult {
  elections: Election[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useElections = (options: UseElectionsOptions = {}): UseElectionsResult => {
  const { state, district, enabled = true } = options;
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchElections = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const response = await electionApi.getAll({ state, district });
      setElections(response.data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load elections');
      setError(error);
      console.error('Error loading elections:', err);
    } finally {
      setLoading(false);
    }
  }, [state, district, enabled]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  return {
    elections,
    loading,
    error,
    refetch: fetchElections,
  };
};
