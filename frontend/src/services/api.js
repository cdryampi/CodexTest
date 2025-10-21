import axios from 'axios';
import slugify from 'slugify';
import { API_BASE_URL } from '../utils/apiBase.js';
import postsMock from '../data/posts.json';
import commentsMock from '../data/comments.json';

export const ACCESS_TOKEN_KEY = 'codextest.accessToken';
export const REFRESH_TOKEN_KEY = 'codextest.refreshToken';

const api = axios.create({
  baseURL: API_BASE_URL
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL
});

const enforceExplicitCredentials = (config) => {
  if (typeof config.withCredentials === 'boolean') {
    return config.withCredentials;
  }

  return false;
};

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
  config.withCredentials = enforceExplicitCredentials(config);
  if (tokens.access && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

refreshClient.interceptors.request.use((config) => {
  config.withCredentials = enforceExplicitCredentials(config);
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

const toApiError = (error) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const data = error.response?.data ?? null;
    const detail =
      (data && typeof data === 'object' && data.detail && typeof data.detail === 'string'
        ? data.detail
        : null) ?? error.message ?? 'Se produjo un error inesperado.';
    const normalizedError = new Error(detail);
    normalizedError.status = status;
    normalizedError.data = data;
    normalizedError.original = error;
    return normalizedError;
  }

  const normalizedError = new Error(error?.message ?? 'Se produjo un error inesperado.');
  normalizedError.status = null;
  normalizedError.data = null;
  normalizedError.original = error;
  return normalizedError;
};

const paramsSerializer = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value
        .map((item) => (typeof item === 'string' ? item.trim() : item))
        .filter((item) => item !== undefined && item !== null && item !== '')
        .forEach((item) => searchParams.append(key, item));
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        searchParams.append(key, trimmed);
      }
      return;
    }

    searchParams.append(key, value);
  });

  return searchParams.toString();
};

const sanitizeSearch = (value) => (value || '').toString().trim();

const sanitizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }
  const unique = new Set();
  tags.forEach((tag) => {
    if (typeof tag !== 'string') return;
    const normalized = tag.trim();
    if (normalized) {
      unique.add(normalized);
    }
  });
  return Array.from(unique);
};

const computeStatusFromDate = (dateValue) => {
  if (!dateValue) {
    return 'published';
  }
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return 'published';
  }
  const today = new Date();
  if (parsed.getTime() > today.getTime()) {
    return 'scheduled';
  }
  return 'published';
};

const normalizePostResult = (post) => {
  if (!post) {
    return null;
  }

  const categories = Array.isArray(post.categories) ? post.categories : [];
  const categoriesDetail = Array.isArray(post.categories_detail) ? post.categories_detail : [];
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const createdAt = post.created_at ?? post.date ?? null;
  const status = computeStatusFromDate(createdAt);

  return {
    ...post,
    categories,
    categories_detail: categoriesDetail,
    tags,
    created_at: createdAt,
    status,
    publishedAt: createdAt
  };
};

const filterPostsByStatus = (posts, status) => {
  if (status === 'all') {
    return posts;
  }
  return posts.filter((item) => item.status === status);
};

const paginateResults = (items, page, pageSize) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const buildMockPostsResponse = ({
  page,
  pageSize,
  search,
  ordering,
  category,
  tags,
  status
}) => {
  const normalizedSearch = sanitizeSearch(search).toLowerCase();
  const normalizedTags = sanitizeTags(tags).map((tag) => tag.toLowerCase());
  const categoryFilter = typeof category === 'string' ? category.trim().toLowerCase() : '';

  let results = postsMock.map((post) => normalizePostResult({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    tags: post.tags ?? [],
    categories: post.categories ?? [],
    categories_detail: post.categories_detail ?? [],
    created_at: post.date,
    image: post.image,
    thumb: post.thumb,
    imageAlt: post.imageAlt,
    author: post.author
  }));

  if (normalizedSearch) {
    results = results.filter((item) => {
      const haystack = `${item.title} ${item.excerpt}`.toLowerCase();
      const tagMatch = (item.tags ?? []).some((tag) => tag.toLowerCase().includes(normalizedSearch));
      const categoryMatch = (item.categories ?? []).some((cat) => cat.toLowerCase().includes(normalizedSearch));
      return haystack.includes(normalizedSearch) || tagMatch || categoryMatch;
    });
  }

  if (categoryFilter) {
    results = results.filter((item) =>
      (item.categories ?? []).some((cat) => cat.toLowerCase() === categoryFilter)
    );
  }

  if (normalizedTags.length > 0) {
    results = results.filter((item) => {
      const itemTags = (item.tags ?? []).map((tag) => tag.toLowerCase());
      return normalizedTags.every((tag) => itemTags.includes(tag));
    });
  }

  if (ordering === 'title') {
    results.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  } else if (ordering === '-title') {
    results.sort((a, b) => b.title.localeCompare(a.title, 'es'));
  } else if (ordering === 'date' || ordering === 'created_at') {
    results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else {
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  results = filterPostsByStatus(results, status);

  const total = results.length;
  const paginated = paginateResults(results, page, pageSize);

  return {
    count: total,
    results: paginated,
    next: null,
    previous: null
  };
};

const buildMockCommentsResponse = (slug, { page, pageSize, ordering }) => {
  const normalizedSlug = (slug || '').toString().trim();
  let results = commentsMock
    .filter((comment) => comment.post === normalizedSlug)
    .map((comment) => ({
      ...comment,
      created_at: comment.created_at ?? comment.date ?? new Date().toISOString()
    }));

  if (ordering === 'created_at') {
    results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else {
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const total = results.length;
  const paginated = paginateResults(results, page, pageSize);

  return {
    count: total,
    results: paginated,
    next: null,
    previous: null
  };
};

const TAG_STORAGE_KEY = 'dashboard:tags';
const memoryTagStore = { value: [] };

const readStoredTags = () => {
  try {
    if (isBrowser) {
      const raw = window.localStorage.getItem(TAG_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('No fue posible leer las etiquetas almacenadas.', error);
  }
  return memoryTagStore.value ?? [];
};

const persistStoredTags = (tags) => {
  const payload = Array.isArray(tags) ? tags : [];
  memoryTagStore.value = payload;
  if (!isBrowser) {
    return;
  }
  try {
    window.localStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('No fue posible persistir las etiquetas en localStorage.', error);
  }
};

const slugifyTag = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const mergeTags = (base, extra) => {
  const map = new Map();
  base.forEach((tag) => {
    if (!tag || !tag.name) return;
    const key = tag.name.toLowerCase();
    map.set(key, { ...tag });
  });
  extra.forEach((tag) => {
    if (!tag || !tag.name) return;
    const key = tag.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { ...tag });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
};

const buildTagCollectionFromPosts = (posts) => {
  const lookup = new Map();
  posts.forEach((post) => {
    const tags = Array.isArray(post.tags) ? post.tags : [];
    tags.forEach((tag) => {
      const name = typeof tag === 'string' ? tag : tag?.name;
      if (!name) {
        return;
      }
      const key = name.toLowerCase();
      if (!lookup.has(key)) {
        lookup.set(key, {
          id: key,
          name,
          slug: slugifyTag(name),
          usage: 1
        });
      } else {
        const item = lookup.get(key);
        item.usage = (item.usage ?? 0) + 1;
      }
    });
  });
  return Array.from(lookup.values());
};

const extractCategoriesFromMocks = () => {
  const categories = new Map();
  postsMock.forEach((post) => {
    const details = Array.isArray(post.categories_detail) ? post.categories_detail : [];
    details.forEach((category) => {
      if (!category?.slug) return;
      if (!categories.has(category.slug)) {
        categories.set(category.slug, {
          name: category.name ?? category.slug,
          slug: category.slug,
          description: category.description ?? '',
          is_active: category.is_active ?? true,
          post_count: 1
        });
      } else {
        const stored = categories.get(category.slug);
        stored.post_count = (stored.post_count ?? 0) + 1;
      }
    });
  });
  return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
};

export async function listPosts(params = {}) {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    ordering = '-date',
    category,
    tags = [],
    status = 'all'
  } = params;

  const requestParams = {
    page,
    page_size: pageSize,
    search: sanitizeSearch(search) || undefined,
    ordering: ordering || undefined,
    category: category || undefined
  };

  const normalizedTags = sanitizeTags(tags);
  if (normalizedTags.length > 0) {
    requestParams['tags__name'] = normalizedTags;
  }

  try {
    const response = await api.get('posts/', {
      params: requestParams,
      paramsSerializer
    });
    const payload = response.data ?? {};
    const results = Array.isArray(payload.results) ? payload.results.map(normalizePostResult) : [];
    const filteredResults = filterPostsByStatus(results, status);
    if (status !== 'all') {
      const adjusted = {
        count: filteredResults.length,
        results: paginateResults(filteredResults, page, pageSize),
        next: null,
        previous: null
      };
      return adjusted;
    }
    return {
      ...payload,
      results
    };
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.info('Fallo al listar posts desde la API, usando datos mock.', error);
    }
    return buildMockPostsResponse({
      page,
      pageSize,
      search,
      ordering,
      category,
      tags,
      status
    });
  }
}


export async function listLatestPosts(params = {}) {
  const { limit = 6 } = params ?? {};
  const parsedLimit = Number.parseInt(limit, 10);
  const pageSize = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 12) : 6;

  const requestParams = {
    page: 1,
    page_size: pageSize,
    ordering: '-date'
  };

  try {
    const response = await api.get('posts/', {
      params: requestParams,
      paramsSerializer
    });
    const payload = response.data ?? {};
    const results = Array.isArray(payload.results) ? payload.results.map(normalizePostResult) : [];
    return results.slice(0, pageSize);
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.info('Fallo al listar posts recientes desde la API, usando datos mock.', error);
    }
    const fallback = buildMockPostsResponse({
      page: 1,
      pageSize,
      search: '',
      ordering: '-date',
      category: undefined,
      tags: [],
      status: 'all'
    });
    return Array.isArray(fallback.results) ? fallback.results.slice(0, pageSize) : [];
  }
}

export async function getPost(slug) {
  if (!slug) {
    throw new Error('Debes indicar el slug del post.');
  }
  try {
    const response = await api.get(`posts/${slug}/`);
    return normalizePostResult(response.data);
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.info(`Fallo al obtener el post ${slug}, buscando en datos mock.`, error);
    }
    const fallback = postsMock.find((post) => post.slug === slug);
    if (!fallback) {
      throw toApiError(error);
    }
    return normalizePostResult({
      id: fallback.id,
      slug: fallback.slug,
      title: fallback.title,
      excerpt: fallback.excerpt,
      content: fallback.content,
      tags: fallback.tags ?? [],
      categories: fallback.categories ?? [],
      categories_detail: fallback.categories_detail ?? [],
      created_at: fallback.date,
      image: fallback.image,
      thumb: fallback.thumb,
      imageAlt: fallback.imageAlt,
      author: fallback.author
    });
  }
}

export async function createPost(data) {
  try {
    const response = await api.post('posts/', data);
    return normalizePostResult(response.data);
  } catch (error) {
    const normalized = toApiError(error);
    if (normalized.status === 405) {
      normalized.message =
        normalized.message ?? 'La API no permite eliminar comentarios por ahora.';
    }
    throw normalized;
  }
}

export async function updatePost(slug, data) {
  if (!slug) {
    throw new Error('Debes indicar el slug del post a editar.');
  }
  try {
    const response = await api.put(`posts/${slug}/`, data);
    return normalizePostResult(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deletePost(slug) {
  if (!slug) {
    throw new Error('Debes indicar el slug del post a eliminar.');
  }
  try {
    await api.delete(`posts/${slug}/`);
    return { success: true };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function listCategories(params = {}) {
  const searchParams = {
    q: sanitizeSearch(params.search),
    is_active:
      typeof params.isActive === 'boolean'
        ? params.isActive
          ? 'true'
          : 'false'
        : undefined,
    with_counts: params.withCounts ? 'true' : undefined
  };

  try {
    const response = await api.get('categories/', {
      params: searchParams,
      paramsSerializer
    });
    const payload = response.data ?? {};
    if (Array.isArray(payload.results)) {
      return payload;
    }
    if (Array.isArray(payload)) {
      return payload;
    }
    return [];
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.info('Fallo al listar categorías desde la API, usando datos mock.', error);
    }
    return extractCategoriesFromMocks();
  }
}

export async function createCategory(data) {
  try {
    const response = await api.post('categories/', data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateCategory(slug, data) {
  if (!slug) {
    throw new Error('Debes indicar el slug de la categoría a actualizar.');
  }
  try {
    const response = await api.put(`categories/${slug}/`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteCategory(slug) {
  if (!slug) {
    throw new Error('Debes indicar el slug de la categoría a eliminar.');
  }
  try {
    await api.delete(`categories/${slug}/`);
    return { success: true };
  } catch (error) {
    throw toApiError(error);
  }
}

const ensureTagId = (tag) => {
  if (tag.id) {
    return tag.id;
  }
  return `tag-${slugifyTag(tag.name)}-${Date.now()}`;
};

export async function listTags() {
  const stored = readStoredTags();

  try {
    const response = await api.get('tags/');
    const data = response.data;
    if (Array.isArray(data?.results)) {
      return mergeTags(data.results, stored);
    }
    if (Array.isArray(data)) {
      return mergeTags(data, stored);
    }
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.info('Fallo al listar etiquetas desde la API, usando datos mock.', error);
    }
  }

  const posts = postsMock.map((post) => normalizePostResult(post));
  const fromPosts = buildTagCollectionFromPosts(posts);
  return mergeTags(fromPosts, stored);
}

export async function createTag(payload) {
  const normalizedName = sanitizeSearch(payload?.name);
  if (!normalizedName) {
    throw new Error('Debes indicar un nombre para la etiqueta.');
  }

  try {
    const response = await api.post('tags/', { name: normalizedName });
    return response.data;
  } catch (error) {
    if (error?.response?.status && error.response.status !== 404) {
      throw toApiError(error);
    }
    if (import.meta.env?.DEV) {
      console.info('Creando etiqueta en modo local al no existir endpoint dedicado.', error);
    }
    const stored = readStoredTags();
    const slug = slugifyTag(normalizedName);
    const newTag = {
      id: ensureTagId({ name: normalizedName }),
      name: normalizedName,
      slug,
      usage: 0
    };
    persistStoredTags([...stored, newTag]);
    return newTag;
  }
}

export async function updateTag(tagId, payload) {
  const normalizedName = sanitizeSearch(payload?.name);
  if (!normalizedName) {
    throw new Error('Debes indicar un nombre para la etiqueta.');
  }

  try {
    const response = await api.put(`tags/${tagId}/`, { name: normalizedName });
    return response.data;
  } catch (error) {
    if (error?.response?.status && ![404, 405].includes(error.response.status)) {
      throw toApiError(error);
    }
    if (import.meta.env?.DEV) {
      console.info('Actualizando etiqueta de manera local al no existir endpoint dedicado.', error);
    }
    const stored = readStoredTags();
    const slug = slugifyTag(normalizedName);
    const next = stored.map((tag) =>
      tag.id === tagId
        ? {
            ...tag,
            name: normalizedName,
            slug
          }
        : tag
    );
    persistStoredTags(next);
    return next.find((tag) => tag.id === tagId);
  }
}

export async function deleteTag(tagId) {
  if (!tagId) {
    throw new Error('Debes indicar la etiqueta a eliminar.');
  }

  try {
    await api.delete(`tags/${tagId}/`);
    return { success: true };
  } catch (error) {
    if (error?.response?.status && ![404, 405].includes(error.response.status)) {
      throw toApiError(error);
    }
    if (import.meta.env?.DEV) {
      console.info('Eliminando etiqueta localmente al no existir endpoint dedicado.', error);
    }
    const stored = readStoredTags();
    persistStoredTags(stored.filter((tag) => tag.id !== tagId));
    return { success: true, simulated: true };
  }
}

const normalizeReactionSummary = (payload = {}) => {
  const baseCounts = {
    like: 0,
    love: 0,
    clap: 0,
    wow: 0,
    laugh: 0,
    insight: 0
  };
  const incomingCounts =
    payload && typeof payload === 'object' && payload.counts && typeof payload.counts === 'object'
      ? payload.counts
      : {};

  const counts = Object.entries(baseCounts).reduce((acc, [type, defaultValue]) => {
    const rawValue = incomingCounts?.[type];
    const parsed = typeof rawValue === 'number' ? rawValue : parseInt(rawValue, 10);
    acc[type] = Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultValue;
    return acc;
  }, {});

  const total = typeof payload.total === 'number' && payload.total >= 0
    ? payload.total
    : Object.values(counts).reduce((sum, value) => sum + value, 0);

  const myReaction = typeof payload.my_reaction === 'string' ? payload.my_reaction : null;

  return { counts, total, my_reaction: myReaction };
};

export async function getPostReactions(slug, options = {}) {
  if (!slug) {
    throw new Error('Debes indicar el slug del post para consultar reacciones.');
  }

  const config = {};
  if (options.signal) {
    config.signal = options.signal;
  }

  try {
    const response = await api.get(`posts/${slug}/reactions/`, config);
    return normalizeReactionSummary(response.data ?? {});
  } catch (error) {
    throw toApiError(error);
  }
}

export async function togglePostReaction(slug, type) {
  if (!slug) {
    throw new Error('Debes indicar el slug del post para registrar la reacción.');
  }
  if (!type) {
    throw new Error('Debes indicar el tipo de reacción.');
  }

  try {
    const response = await api.post(`posts/${slug}/react/`, { type });
    return normalizeReactionSummary(response.data ?? {});
  } catch (error) {
    throw toApiError(error);
  }
}

export async function listComments(slug, params = {}) {
  if (!slug) {
    throw new Error('Debes indicar el slug del post para listar comentarios.');
  }
  const {
    page = 1,
    pageSize = 10,
    ordering = '-created_at'
  } = params;

  const requestParams = {
    page,
    page_size: pageSize,
    ordering
  };

  try {
    const response = await api.get(`posts/${slug}/comments/`, {
      params: requestParams,
      paramsSerializer
    });
    return response.data;
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.info('Fallo al listar comentarios desde la API, usando datos mock.', error);
    }
    return buildMockCommentsResponse(slug, { page, pageSize, ordering });
  }
}

export async function createComment(slug, data) {
  if (!slug) {
    throw new Error('Debes indicar el slug del post.');
  }
  try {
    const response = await api.post(`posts/${slug}/comments/`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateComment(commentId, data) {
  if (!commentId) {
    throw new Error('Debes indicar el comentario a actualizar.');
  }
  try {
    const response = await api.put(`comments/${commentId}/`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteComment(commentId) {
  if (!commentId) {
    throw new Error('Debes indicar el comentario a eliminar.');
  }
  try {
    await api.delete(`comments/${commentId}/`);
    return { success: true };
  } catch (error) {
    const normalized = toApiError(error);
    if (normalized.status === 405) {
      normalized.message =
        normalized.message ?? 'La API no permite eliminar comentarios por ahora.';
    }
    throw normalized;
  }
}

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


export const generateLocalizedSlug = (title, options = {}) => {
  const base = typeof title === 'string' ? title : '';
  return slugify(base, {
    lower: true,
    strict: true,
    trim: true,
    ...options
  });
};

const normalizeLangParam = (lang) => (lang ?? '').toString().trim().toLowerCase();

const filterTranslatablePayload = (payload, allowedKeys) => {
  const source = payload && typeof payload === 'object' ? payload : {};
  return allowedKeys.reduce((accumulator, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];
      if (value !== undefined) {
        accumulator[key] = value;
      }
    }
    return accumulator;
  }, {});
};

export async function updatePostTranslation(slug, lang, payload = {}) {
  const normalizedSlug = (slug ?? '').toString().trim();
  if (!normalizedSlug) {
    throw new Error('Debes indicar el slug del post a traducir.');
  }
  const normalizedLang = normalizeLangParam(lang);
  if (!normalizedLang) {
    throw new Error('Selecciona un idioma válido para la traducción.');
  }
  const body = filterTranslatablePayload(payload, ['title', 'excerpt', 'content', 'slug', 'categories', 'tags']);
  try {
    const response = await api.patch(`posts/${normalizedSlug}/`, body, {
      params: { lang: normalizedLang }
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateCategoryTranslation(id, lang, payload = {}) {
  const normalizedId = (id ?? '').toString().trim();
  if (!normalizedId) {
    throw new Error('Debes indicar la categoría a traducir.');
  }
  const normalizedLang = normalizeLangParam(lang);
  if (!normalizedLang) {
    throw new Error('Selecciona un idioma válido para la traducción.');
  }
  const body = filterTranslatablePayload(payload, ['name', 'description', 'slug']);
  try {
    const response = await api.put(`categories/${normalizedId}/`, body, {
      params: { lang: normalizedLang }
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateTagTranslation(id, lang, payload = {}) {
  const normalizedId = (id ?? '').toString().trim();
  if (!normalizedId) {
    throw new Error('Debes indicar la etiqueta a traducir.');
  }
  const normalizedLang = normalizeLangParam(lang);
  if (!normalizedLang) {
    throw new Error('Selecciona un idioma válido para la traducción.');
  }
  const body = filterTranslatablePayload(payload, ['name', 'slug']);
  try {
    const response = await api.put(`tags/${normalizedId}/`, body, {
      params: { lang: normalizedLang }
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}


export default api;
