import { create } from 'zustand';
import api, { setAccessToken, clearAccessToken } from '@/api/axios';

const useAuthStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  user:          null,
  isAuthenticated: false,
  isLoading:     true,   // true on app boot while we check session

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Called on app boot — tries to restore session via refresh token cookie.
   * If the cookie is valid, we get a new access token silently.
   */
  initAuth: async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      setAccessToken(data.accessToken);

      const profileRes = await api.get('/auth/me');
      set({
        user:            profileRes.data.user,
        isAuthenticated: true,
        isLoading:       false,
      });
    } catch {
      // No valid session — that's fine, user just isn't logged in
      clearAccessToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  /**
   * Login with email + password.
   * Stores access token in memory, refresh token set as HttpOnly cookie by server.
   */
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    set({ user: data.user, isAuthenticated: true });
    return data.user;
  },

  /**
   * Register new account.
   */
  register: async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    setAccessToken(data.accessToken);
    set({ user: data.user, isAuthenticated: true });
    return data.user;
  },

  /**
   * Logout current device.
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      set({ user: null, isAuthenticated: false });
    }
  },

  /**
   * Logout all devices.
   */
  logoutAll: async () => {
    try {
      await api.post('/auth/logout-all');
    } finally {
      clearAccessToken();
      set({ user: null, isAuthenticated: false });
    }
  },

  /**
   * Update local user state after profile edits.
   */
  updateUser: (updatedUser) => {
    set({ user: updatedUser });
  },
}));

export default useAuthStore;
