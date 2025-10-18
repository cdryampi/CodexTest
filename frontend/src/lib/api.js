import { apiGet, apiPost } from './apiClient';

const sanitizeSearchTerm = (value = '') => value.toString().trim().toLowerCase();

const sanitizeTags = (tags = []) => {
  const unique = new Set();
  tags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .forEach((tag) => unique.add(tag));
  return Array.from(unique);
};

export const listPosts = async ({
  page = 1,
  search = '',
  ordering = '-created_at',
  tags = [],
  signal
} = {}) => {
  const params = {
    page,
    ordering,
    search: sanitizeSearchTerm(search),
    tags: sanitizeTags(tags).join(',')
  };

  const { data } = await apiGet('/api/posts/', { params, signal });
  return {
    results: Array.isArray(data?.results) ? data.results : [],
    count: typeof data?.count === 'number' ? data.count : 0,
    next: data?.next ?? null,
    previous: data?.previous ?? null
  };
};

export const getPost = async (slug, { signal } = {}) => {
  if (!slug) {
    throw new Error('Slug de publicación requerido');
  }

  const { data } = await apiGet(`/api/posts/${slug}/`, { signal });
  return data;
};

export const listComments = async (slug, { signal } = {}) => {
  if (!slug) {
    return [];
  }

  try {
    const { data } = await apiGet(`/api/posts/${slug}/comments/`, { signal });
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.results)) {
      return data.results;
    }
    return [];
  } catch (error) {
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
};

export const createComment = async (slug, payload, { signal } = {}) => {
  if (!slug) {
    throw new Error('Slug de publicación requerido');
  }

  const authorName = payload?.author_name?.toString().trim();
  const content = payload?.content?.toString().trim();

  if (!authorName) {
    throw new Error('El nombre del autor es obligatorio.');
  }

  if (!content) {
    throw new Error('El contenido del comentario es obligatorio.');
  }

  if (content.length > 2000) {
    throw new Error('El comentario no puede superar los 2000 caracteres.');
  }

  const body = {
    author_name: authorName,
    content
  };

  const { data } = await apiPost(`/api/posts/${slug}/comments/`, { body, signal });
  return data;
};
