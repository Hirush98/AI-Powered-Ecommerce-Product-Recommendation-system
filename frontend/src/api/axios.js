import axios from 'axios';

// ─── Base instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,   // send HttpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor — attach access token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── In-memory access token ────────────────────────────────────────────────────
// Stored in memory (not localStorage) — safer against XSS
let _accessToken = null;

export const setAccessToken = (token) => { _accessToken = token; };
export const getAccessToken = ()       => _accessToken;
export const clearAccessToken = ()     => { _accessToken = null; };

// ─── Response interceptor — auto refresh on 401 TOKEN_EXPIRED ─────────────────
let _isRefreshing = false;
let _failedQueue  = [];

const processQueue = (error, token = null) => {
  _failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  _failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry;

    if (!isTokenExpired) {
      return Promise.reject(error);
    }

    // Already refreshing — queue this request
    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        _failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry   = true;
    _isRefreshing     = true;

    try {
      // Refresh token is in HttpOnly cookie — just call the endpoint
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = data.accessToken;
      setAccessToken(newToken);
      processQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed — force logout
      clearAccessToken();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      _isRefreshing = false;
    }
  }
);

export default api;
