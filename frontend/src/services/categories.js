import api from './api.js';

export async function listarCategorias(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.withCounts) {
    searchParams.set('with_counts', params.withCounts ? 'true' : 'false');
  }

  const query = searchParams.toString();
  const response = await api.get(`categories/${query ? `?${query}` : ''}`);
  return response.data;
}

export async function crearCategoria(data) {
  return api.post('categories/', data);
}

export async function obtenerCategoria(id) {
  const response = await api.get(`categories/${id}/`);
  return response.data;
}

export async function actualizarCategoria(id, data) {
  return api.put(`categories/${id}/`, data);
}

export async function eliminarCategoria(id) {
  return api.delete(`categories/${id}/`);
}

