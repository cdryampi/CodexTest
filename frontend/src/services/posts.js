import api from './api.js';

const buildQueryString = (filters = {}) => {
  const searchParams = new URLSearchParams();

  const {
    page,
    pageSize,
    search,
    ordering,
    category,
    tags,
    published
  } = filters;

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

  if (typeof published === 'boolean') {
    searchParams.set('published', published ? 'true' : 'false');
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const ensureFormData = (payload) => {
  if (payload instanceof FormData) {
    return payload;
  }

  const formData = new FormData();
  if (!payload || typeof payload !== 'object') {
    return formData;
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (key === 'tags' && Array.isArray(value)) {
      value.forEach((tagId) => {
        if (tagId !== undefined && tagId !== null && tagId !== '') {
          formData.append('tags[]', tagId);
        }
      });
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          formData.append(`${key}[]`, item);
        }
      });
      return;
    }

    formData.append(key, value);
  });

  return formData;
};

const createMultipartConfig = () => ({
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export async function listarPosts(filters = {}) {
  const query = buildQueryString(filters);
  const response = await api.get(`posts/${query}`);
  return response.data;
}

export async function obtenerPost(idOrSlug) {
  const response = await api.get(`posts/${idOrSlug}/`);
  return response.data;
}

export async function crearPost(payload) {
  const formData = ensureFormData(payload);
  return api.post('posts/', formData, createMultipartConfig());
}

export async function actualizarPost(id, payload) {
  const formData = ensureFormData(payload);
  if (formData instanceof FormData && !formData.has('image')) {
    formData.delete('image');
  }
  return api.put(`posts/${id}/`, formData, createMultipartConfig());
}

export async function eliminarPost(id) {
  return api.delete(`posts/${id}/`);
}

