import { api } from './api';

// Los clientes son usuarios con role CLIENTE — se gestiona desde /api/users
export const clientsService = {
  getAll:  (membersOnly = false) => api.get(membersOnly ? '/clients?member=true' : '/clients'),
  getById: (id)       => api.get(`/clients/${id}`),
  create:  (data)     => api.post('/users', data),
  update:  (id, data) => api.put(`/clients/${id}`, data),
  remove:  (id)       => api.delete(`/clients/${id}`),
  search:  (q)        => api.get(`/clients/search?q=${encodeURIComponent(q)}`),
  checkByEmail: (email) => api.get(`/users/by-email?email=${encodeURIComponent(email)}`),
  quickRegister: (data) => api.post('/users/quick-register', data),
};
