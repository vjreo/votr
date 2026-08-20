import api from '../../../shared/services/api';

export const candidateApi = {
  getAll: (params?: {
    office?: string;
    location?: string;
    state?: string;
    lat?: number;
    lng?: number;
    /** Requires Authorization; attaches matchScore per candidate */
    includeMatch?: boolean;
    /** When includeMatch, sort by match score (highest first) */
    sortMatch?: boolean;
  }) => {
    const { includeMatch, sortMatch, ...rest } = params || {};
    const query: Record<string, string | number | undefined> = { ...rest };
    if (includeMatch) {
      query.includeMatch = '1';
      if (sortMatch) query.sortMatch = '1';
    }
    return api.get('/candidates', { params: query });
  },
  
  getById: (id: string) =>
    api.get(`/candidates/${id}`),
};
