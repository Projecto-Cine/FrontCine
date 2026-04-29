import axiosClient from './axiosClient'

export const productosApi = {
  getAll: () => axiosClient.get('/productos'),
  getById: (id) => axiosClient.get(`/productos/${id}`),
  create: (data) => axiosClient.post('/productos', data),
  update: (id, data) => axiosClient.put(`/productos/${id}`, data),
  delete: (id) => axiosClient.delete(`/productos/${id}`),
}
