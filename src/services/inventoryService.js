import { api } from './api';

export const inventoryService = {
  getAll:  ()         => api.get('/merchandise'),
  getById: (id)       => api.get(`/merchandise/${id}`),
  create:  (data)     => api.post('/merchandise', data),
  update:  (id, data) => api.put(`/merchandise/${id}`, data),
  remove:  (id)       => api.delete(`/merchandise/${id}`),
};

export const merchandiseService = inventoryService;
