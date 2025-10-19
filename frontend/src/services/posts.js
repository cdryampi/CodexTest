import api from './api.js';

const buildQueryString = (filters = {}) => {
  const searchParams = new URLSearchParams();

  const { page, pageSize, search, ordering, category, tags } = filters;

  if (page) {
    searchParams.set('page', page);
  }

  if (pageSize) {
    searchParams.set('page_size', pageSize);
  }

  if (search) {
    searchParams.set('search', search);
  }

  if (ordering) {
    searchParams.set('ordering', ordering);
  }

  if (category) {
    searchParams.set('category', category);
  }

  if (Array.isArray(tags)) {
    tags
      .filter((tag) => tag !== null && tag !== undefined && tag !== '')
      .forEach((tag) => {
        searchParams.append('tags', tag);
      });
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const normalizePostPayload = (payload = {}) => {
  const normalized = { ...payload };

  if (Array.isArray(normalized.categories)) {
    normalized.categories = normalized.categories.filter(Boolean);
  }

  if (Array.isArray(normalized.tags)) {
    normalized.tags = normalized.tags
      .map((tag) => (typeof tag === 'string' ? tag.trim() : tag))
      .filter((tag) => Boolean(tag));
  }

  return normalized;
};

export async function listarPosts(filters = {}) {
  const query = buildQueryString(filters);
  const response = await api.get(`posts/${query}`);
  return response.data;
}

export async function obtenerPost(slug) {
  const response = await api.get(`posts/${slug}/`);
  return response.data;
}

export async function crearPost(payload) {
  return api.post('posts/', normalizePostPayload(payload));
}

export async function actualizarPost(slug, payload) {
  return api.put(`posts/${slug}/`, normalizePostPayload(payload));
}

export async function eliminarPost(slug) {
  return api.delete(`posts/${slug}/`);
}

