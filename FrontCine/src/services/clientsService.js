import { api } from './api';

export const clientsService = {
  getAll:  ()          => api.get('/clients'),
  search:  (q)         => api.get(`/clients/search?q=${encodeURIComponent(q)}`),
  getById: (id)        => api.get(`/clients/${id}`),
  create:  (data)      => api.post('/users', data),
  update:  (id, data)  => api.put(`/users/${id}`, data),
  remove:  (id)        => api.delete(`/users/${id}`),
};
