import api from './api.js';

export async function listarCategorias(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set('q', params.search);
  }

  if (typeof params.isActive === 'boolean') {
    searchParams.set('is_active', params.isActive ? 'true' : 'false');
  }

  if (params.withCounts) {
    searchParams.set('with_counts', 'true');
  }

  const query = searchParams.toString();
  const response = await api.get(`categories/${query ? `?${query}` : ''}`);
  return response.data;
}

export async function crearCategoria(data) {
  return api.post('categories/', data);
}

export async function obtenerCategoria(slug) {
  const response = await api.get(`categories/${slug}/`);
  return response.data;
}

export async function actualizarCategoria(slug, data) {
  return api.put(`categories/${slug}/`, data);
}

export async function eliminarCategoria(slug) {
  return api.delete(`categories/${slug}/`);
}

