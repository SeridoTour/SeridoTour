import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { api } from '../services/api';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'GUIA';
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('access_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
  let refreshTimer: number | undefined;

  const parseJwt = (token: string): UserPayload | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      if (!payload.sub || (payload.exp && payload.exp * 1000 <= Date.now())) return null;
      return { id: payload.sub, name: payload.name, email: payload.email ?? '', role: payload.role };
    } catch (e) {
      return null;
    }
  };

  const user = computed<UserPayload | null>(() => {
    return accessToken.value ? parseJwt(accessToken.value) : null;
  });

  const isAuthenticated = computed(() => !!user.value);
  const isGuia = computed(() => user.value?.role === 'GUIA');

  const clearSession = () => {
    if (refreshTimer) window.clearTimeout(refreshTimer);
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const getExpiration = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  const refreshSession = async () => {
    if (!refreshToken.value) return false;

    try {
      const { data } = await axios.put(`${api.defaults.baseURL}/token/refresh`, {
        tokenAnterior: refreshToken.value,
      });
      if (!data.access_token || !data.refresh_token) throw new Error('Resposta de token inválida.');
      setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      clearSession();
      return false;
    }
  };

  const scheduleRefresh = (access: string) => {
    if (refreshTimer) window.clearTimeout(refreshTimer);
    const expiresAt = getExpiration(access);
    if (!expiresAt) return;

    const delay = Math.max(0, expiresAt - Date.now() - 30_000);
    refreshTimer = window.setTimeout(() => void refreshSession(), delay);
  };

  const setTokens = (access: string, refresh: string) => {
    accessToken.value = access;
    refreshToken.value = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    scheduleRefresh(access);
  };

  const logout = () => {
    clearSession();
  };

  const login = async (credentials: { email: string; password: string }) => {
    const { data } = await api.post('/auth/login', credentials);
    setTokens(data.access_token, data.refresh_token);
  };

  const register = async (payload: { name: string; email: string; password: string; codigoguia?: string }) => {
    await api.post('/users/cadastrar', payload);
    await login({ email: payload.email, password: payload.password });
  };

  if (accessToken.value) scheduleRefresh(accessToken.value);

  return { accessToken, refreshToken, user, isAuthenticated, isGuia, setTokens, logout, login, register, refreshSession };
});
