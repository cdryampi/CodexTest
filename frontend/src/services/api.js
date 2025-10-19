import axios from 'axios';
import postsMock from '../data/posts.json';
import commentsMock from '../data/comments.json';
import { API_BASE_URL } from '../utils/apiBase.js';

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

const MOCK_STATUS_SEQUENCE = ['published', 'published', 'draft', 'published', 'scheduled'];

const getMockPosts = (() => {
  let cache = null;
  return () => {
    if (cache) {
      return cache;
    }
    cache = postsMock.map((post, index) => {
      const status = MOCK_STATUS_SEQUENCE[index % MOCK_STATUS_SEQUENCE.length];
      const baseViews = 1250 - index * 37;
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        summary: post.excerpt,
        status,
        tags: post.tags ?? [],
        publishedAt: post.date,
        views: Math.max(320, baseViews + (post.featured ? 240 : 0)),
        featured: post.featured ?? false
      };
    });
    return cache;
  };
})();

const getMockComments = () => commentsMock.map((comment) => ({ ...comment }));

const buildMonthLabel = (date) =>
  new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' })
    .format(date)
    .replace('.', '')
    .toUpperCase();

const buildMockStats = () => {
  const posts = getMockPosts();
  const comments = getMockComments();

  const totals = {
    posts: posts.length,
    comments: comments.length,
    visits: posts.reduce((acc, post) => acc + post.views, 0),
    publishedToday: (() => {
      if (posts.length === 0) return 0;
      const latestDate = posts.reduce((latest, post) =>
        post.publishedAt > latest ? post.publishedAt : latest,
      posts[0].publishedAt);
      return posts.filter((post) => post.publishedAt === latestDate && post.status === 'published').length;
    })()
  };

  const monthlyMap = new Map();
  posts.forEach((post) => {
    const date = new Date(post.publishedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        key,
        label: buildMonthLabel(date),
        published: 0,
        drafts: 0
      });
    }
    const bucket = monthlyMap.get(key);
    if (post.status === 'published') {
      bucket.published += 1;
    } else {
      bucket.drafts += 1;
    }
  });

  const postsByMonth = Array.from(monthlyMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-12);

  const latestCommentDate = comments.reduce((latest, comment) =>
    comment.date > latest ? comment.date : latest,
  comments[0]?.date ?? new Date().toISOString().slice(0, 10));
  const end = new Date(latestCommentDate);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);

  const commentsByDay = Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const dayKey = day.toISOString().slice(0, 10);
    const count = comments.filter((comment) => comment.date === dayKey).length;
    return {
      label: new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' })
        .format(day)
        .replace('.', ''),
      comments: count
    };
  });

  return {
    totals,
    charts: {
      postsByMonth,
      commentsByDay
    }
  };
};

export async function getDashboardStats() {
  try {
    const response = await api.get('dashboard/stats/');
    return response.data;
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.info('Usando métricas mock para el dashboard hasta conectar con DRF.', error?.message);
    }
    return buildMockStats();
  }
}

export async function getPosts(params = {}) {
  try {
    const response = await api.get('dashboard/posts/', { params });
    return response.data;
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.info('Usando posts mock para el dashboard hasta conectar con DRF.', error?.message);
    }
    const posts = getMockPosts();
    return {
      results: posts,
      total: posts.length
    };
  }
}

export async function deletePost(postId) {
  try {
    await api.delete(`dashboard/posts/${postId}/`);
    return { success: true };
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.info('Simulando eliminación de post hasta conectar con DRF.', error?.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 650));
    return { success: true, simulated: true };
  }
}
