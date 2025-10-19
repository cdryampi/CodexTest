import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/';
const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;

export const ACCESS_TOKEN_KEY = 'codextest.accessToken';
export const REFRESH_TOKEN_KEY = 'codextest.refreshToken';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false
});

let refreshPromise = null;

const isBrowser = typeof window !== 'undefined';

const emitEvent = (name, detail = null) => {
  if (!isBrowser) return;
  const event = typeof CustomEvent === 'function' ? new CustomEvent(name, { detail }) : new Event(name);
  window.dispatchEvent(event);
};

export const getStoredTokens = () => ({
  access: isBrowser ? window.localStorage.getItem(ACCESS_TOKEN_KEY) : null,
  refresh: isBrowser ? window.localStorage.getItem(REFRESH_TOKEN_KEY) : null
});

export const storeTokens = ({ access, refresh }) => {
  if (!isBrowser) {
    return;
  }

  if (access) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
  if (refresh) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  emitEvent('auth:tokens', { access, refresh });
};

export const clearStoredTokens = () => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  emitEvent('auth:tokens', { access: null, refresh: null });
};

export const requestTokenRefresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('No hay refresh token disponible');
  }

  const response = await refreshClient.post('auth/token/refresh/', { refresh: refreshToken });
  const { access, refresh } = response.data;
  storeTokens({ access, refresh: refresh ?? refreshToken });
  return { access, refresh: refresh ?? refreshToken };
};

api.interceptors.request.use((config) => {
  const tokens = getStoredTokens();
  if (!config.headers) {
    config.headers = {};
  }
  if (tokens.access && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (!response) {
      return Promise.reject(error);
    }

    if (response.status !== 401) {
      return Promise.reject(error);
    }

    const originalRequest = config ?? {};
    const isAuthRequest = typeof originalRequest.url === 'string' && (
      originalRequest.url.includes('auth/login') ||
      originalRequest.url.includes('auth/registration') ||
      originalRequest.url.includes('auth/token/refresh')
    );

    if (isAuthRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const { refresh } = getStoredTokens();

    if (!refresh) {
      clearStoredTokens();
      emitEvent('auth:logout');
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = requestTokenRefresh(refresh).finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;
      return api(originalRequest);
    } catch (refreshError) {
      clearStoredTokens();
      emitEvent('auth:logout');
      return Promise.reject(refreshError);
    }
  }
);

export default api;
