import { api } from './api';

export const clientsService = {
  getAll:  ()          => api.get('/clients'),
  search:  (q)         => api.get(`/clients/search?q=${encodeURIComponent(q)}`),
  getById: (id)        => api.get(`/clients/${id}`),
  create:  (data)      => api.post('/clients', data),
  update:  (id, data)  => api.put(`/clients/${id}`, data),
  remove:  (id)        => api.delete(`/clients/${id}`),
};
