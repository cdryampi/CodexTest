import api from './api.js';

export async function listarTags(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set('search', params.search);
  }

  const query = searchParams.toString();
  const response = await api.get(`tags/${query ? `?${query}` : ''}`);
  return response.data;
}

export async function crearTag(data) {
  return api.post('tags/', data);
}

export async function obtenerTag(id) {
  const response = await api.get(`tags/${id}/`);
  return response.data;
}

export async function actualizarTag(id, data) {
  return api.put(`tags/${id}/`, data);
}

export async function eliminarTag(id) {
  return api.delete(`tags/${id}/`);
}

