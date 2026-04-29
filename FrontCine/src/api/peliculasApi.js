import axiosClient from './axiosClient'

export const peliculasApi = {
  getAll: () => axiosClient.get('/peliculas'),
  getById: (id) => axiosClient.get(`/peliculas/${id}`),
  create: (data) => axiosClient.post('/peliculas', data),
  update: (id, data) => axiosClient.put(`/peliculas/${id}`, data),
  delete: (id) => axiosClient.delete(`/peliculas/${id}`),
}
