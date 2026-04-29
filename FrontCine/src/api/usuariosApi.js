import axiosClient from './axiosClient'

export const usuariosApi = {
  getAll: () => axiosClient.get('/usuarios'),
  getById: (id) => axiosClient.get(`/usuarios/${id}`),
  create: (data) => axiosClient.post('/usuarios', data),
  update: (id, data) => axiosClient.put(`/usuarios/${id}`, data),
  delete: (id) => axiosClient.delete(`/usuarios/${id}`),
}
