import { useState, useEffect, useCallback } from 'react';
import { candidateApi } from '../services/candidateApi';

interface CandidateData {
  id: string;
  name: string;
  party: string;
  photo?: string;
  office?: string;
  bio?: string;
  religion?: string;
  previousProfession?: string;
  currentPosition?: string;
  partyAffiliation?: string;
  topInitiatives?: string[];
  positions?: Array<{
    issueName: string;
    stance: string;
    source?: string;
  }>;
  career?: Array<{
    title: string;
    period: string;
    description?: string;
  }>;
  sources?: any[];
}

interface UseCandidateDetailOptions {
  candidateId: string;
  enabled?: boolean;
}

interface UseCandidateDetailResult {
  candidate: CandidateData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useCandidateDetail = (options: UseCandidateDetailOptions): UseCandidateDetailResult => {
  const { candidateId, enabled = true } = options;
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCandidate = useCallback(async () => {
    if (!enabled || !candidateId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await candidateApi.getById(candidateId);
      setCandidate(response.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load candidate details');
      setError(error);
      console.error('Error loading candidate:', err);
    } finally {
      setLoading(false);
    }
  }, [candidateId, enabled]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  return {
    candidate,
    loading,
    error,
    refetch: fetchCandidate,
  };
};
