import api from './api';

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
