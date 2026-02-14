import axios from 'axios';

// Dev: localhost (simulator). Set EXPO_PUBLIC_API_URL in .env when testing on a physical device.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://localhost:3000/api' : 'https://api.votr.app/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

export default api;
export { API_BASE_URL };
