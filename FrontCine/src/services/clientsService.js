import { api } from './api';

export const clientsService = {
  search:  (q)        => api.get(`/clients/search?q=${encodeURIComponent(q)}`),
  getById: (id)       => api.get(`/clients/${id}`),
  create:  (data)     => api.post('/auth/register', data),
  update:  (id, data) => api.put(`/clients/${id}`, data),
  remove:  (id)       => api.delete(`/clients/${id}`),
};
