import { api } from './api';

// Los clientes son usuarios con role CLIENTE — se gestiona desde /api/users
export const clientsService = {
  getAll:  ()         => api.get('/clients'),
  getById: (id)       => api.get(`/clients/${id}`),
  create:  (data)     => api.post('/users', data),
  update:  (id, data) => api.put(`/clients/${id}`, data),
  remove:  (id)       => api.delete(`/clients/${id}`),
  search:  (q)        => api.get(`/clients/search?q=${encodeURIComponent(q)}`),
};
