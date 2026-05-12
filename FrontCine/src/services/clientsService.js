import { api } from './api';

const toArray = (data) => Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
const isClient = (u) => ['CLIENT', 'CLIENTE'].includes(String(u?.role ?? '').toUpperCase());

// Los clientes son usuarios con role CLIENT/CLIENTE — se gestiona desde /api/users
export const clientsService = {
  getAll:  async ()   => toArray(await api.get('/users')).filter(isClient),
  getById: (id)       => api.get(`/users/${id}`),
  search:  async (query) => toArray(await api.get(`/users/search?q=${encodeURIComponent(query)}`)).filter(isClient),
  create:  (data)     => api.post('/users', data),
  update:  (id, data) => api.put(`/users/${id}`, data),
  remove:  (id)       => api.delete(`/users/${id}`),
};
