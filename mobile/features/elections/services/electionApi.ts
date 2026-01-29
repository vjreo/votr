import api from '../../../shared/services/api';

// Election endpoints
export const electionApi = {
  getAll: (params?: { state?: string; district?: string }) =>
    api.get('/elections', { params }),
  
  getUpcoming: (userId: string) =>
    api.get('/elections/upcoming', { params: { userId } }),
};
