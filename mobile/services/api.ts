import axios from 'axios';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://api.votr.app/api'; // Update with production URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Token will be added by UserContext
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, will be handled by UserContext
    }
    return Promise.reject(error);
  }
);

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
};

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

// Election endpoints
export const electionApi = {
  getAll: (params?: { state?: string; district?: string }) =>
    api.get('/elections', { params }),
  
  getUpcoming: (userId: string) =>
    api.get('/elections/upcoming', { params: { userId } }),
};

// Auth endpoints
export const authApi = {
  createAnonymous: () =>
    api.post('/auth/anonymous'),

  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  oauth: (provider: 'google' | 'apple', providerId: string, email?: string, name?: string) =>
    api.post('/auth/oauth', { provider, providerId, email, name }),

  linkAnonymous: (anonymousUserId: string) =>
    api.post('/auth/link-anonymous', { anonymousUserId }),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
};

// Bias analysis endpoints
export const biasApi = {
  analyze: (url: string, content?: string, sourceType?: string) =>
    api.post('/bias/analyze', { url, content, sourceType }),

  quickCheck: (url: string) =>
    api.get('/bias/quick', { params: { url } }),

  batchAnalyze: (sources: Array<{ url: string; content?: string }>) =>
    api.post('/bias/batch', { sources }),

  getTiers: () =>
    api.get('/bias/tiers'),
};

export default api;

