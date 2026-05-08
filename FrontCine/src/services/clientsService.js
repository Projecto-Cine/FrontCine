import { api } from './api';

// Los clientes son usuarios con role CLIENTE — se gestiona desde /api/users
export const clientsService = {
  getAll:  ()         => api.get('/users'),
  getById: (id)       => api.get(`/users/${id}`),
  create:  (data)     => api.post('/users', data),
  update:  (id, data) => api.put(`/users/${id}`, data),
  remove:  (id)       => api.delete(`/users/${id}`),
};
