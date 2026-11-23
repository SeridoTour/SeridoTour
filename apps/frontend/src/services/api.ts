import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

let isRefreshing = false;
let failedQueue: any[] = [];
let refreshPromise: Promise<string> | null = null;

export const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const tokenAnterior = localStorage.getItem('access_token');
    if (!tokenAnterior) throw new Error('Access token não encontrado.');

    const { data } = await axios.put(`${api.defaults.baseURL}/token/refresh`, {
      tokenAnterior,
    });

    if (!data.access_token) {
      throw new Error('Resposta de token inválida.');
    }

    localStorage.setItem('access_token', data.access_token);
    localStorage.removeItem('refresh_token');
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
    return data.access_token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/logout' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        const currentPath = `${window.location.pathname}${window.location.search}`;
        const loginUrl =
          window.location.pathname === '/login'
            ? '/login'
            : `/login?redirect=${encodeURIComponent(currentPath)}`;
        window.location.href = loginUrl;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
