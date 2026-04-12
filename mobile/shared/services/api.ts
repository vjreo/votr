import axios from 'axios';

// Dev: localhost (simulator). Set EXPO_PUBLIC_API_URL in .env when testing on a physical device.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://localhost:3000/api' : 'https://api.votr.app/api');

const REQUEST_TIMEOUT_MS = 20000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

/** User-friendly error message from API response */
export function getApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Something went wrong. Please try again.';
  const err = error as { response?: { status?: number; data?: { error?: string } }; message?: string; code?: string };
  const msg = err.response?.data?.error;
  if (typeof msg === 'string' && msg.length > 0) return msg;
  if (err.response?.status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (err.response?.status === 403) return 'Session expired. Please sign in again.';
  if (err.response?.status === 401) return 'Please sign in to continue.';
  if (err.response?.status && err.response.status >= 500) return "We're having trouble. Please try again later.";
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') return "Can't connect. Check your internet and try again.";
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) return 'Request timed out. Please try again.';
  return 'Something went wrong. Please try again.';
}

export default api;
export { API_BASE_URL };
