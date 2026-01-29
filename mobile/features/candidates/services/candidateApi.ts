import api from '../../../shared/services/api';

// Candidate endpoints
export const candidateApi = {
  getAll: (params?: { office?: string; location?: string; state?: string }) =>
    api.get('/candidates', { params }),
  
  getById: (id: string) =>
    api.get(`/candidates/${id}`),
  
  getMatchScore: (id: string, userId: string) =>
    api.get(`/candidates/${id}/match-score`, { params: { userId } }),
  
  addSource: (id: string, source: { url: string; sourceType: string; title?: string }) =>
    api.post(`/candidates/${id}/sources`, source),
};
