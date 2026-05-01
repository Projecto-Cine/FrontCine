import { api } from './api';

export const inventoryService = {
  getAll:  ()         => api.get('/inventory'),
  getById: (id)       => api.get(`/inventory/${id}`),
  create:  (data)     => api.post('/inventory', data),
  update:  (id, data) => api.put(`/inventory/${id}`, data),
  remove:  (id)       => api.delete(`/inventory/${id}`),
};
