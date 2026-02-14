import api from '../../../shared/services/api';

// Auth endpoints
export const authApi = {
  createAnonymous: () =>
    api.post('/auth/anonymous', {}, { timeout: 10000 }),

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
