import axiosClient from './axiosClient'

export const sesionesApi = {
  getAll: () => axiosClient.get('/sesiones'),
  getByPelicula: (peliculaId) => axiosClient.get(`/sesiones?peliculaId=${peliculaId}`),
  create: (data) => axiosClient.post('/sesiones', data),
  update: (id, data) => axiosClient.put(`/sesiones/${id}`, data),
  delete: (id) => axiosClient.delete(`/sesiones/${id}`),
}
