import api from '../../../shared/services/api';

// User endpoints
export const userApi = {
  create: (data: { preferences?: any[]; location?: any }) =>
    api.post('/users', data),
  
  get: (id: string) =>
    api.get(`/users/${id}`),
  
  updatePreferences: (id: string, preferences: any[]) =>
    api.post(`/users/${id}/preferences`, { preferences }),
  
  updateLocation: (id: string, location: any) =>
    api.post(`/users/${id}/location`, location),
  
  getGamification: (id: string) =>
    api.get(`/users/${id}/gamification`),
  
  recordSwipe: (id: string, candidateId: string, direction: 'left' | 'right' | 'up') =>
    api.post(`/users/${id}/swipes`, { candidateId, direction }),

  // Roster (requires auth)
  getRoster: () => api.get('/roster'),
  addToRoster: (candidateId: string) => api.post('/roster', { candidateId }),
  removeFromRoster: (candidateId: string) => api.delete(`/roster/${candidateId}`),
  syncRoster: (roster: Array<{ id: string; name: string; party: string; office?: string; photo?: string }>) =>
    api.post('/roster/sync', { roster }),
};
