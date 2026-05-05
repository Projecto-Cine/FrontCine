import { api } from './api';

// Endpoint /merchandises no disponible en el backend actual
export const inventoryService = {
  getAll:  ()         => api.get('/merchandises').catch(() => []),
  getById: (id)       => api.get(`/merchandises/${id}`),
  create:  (data)     => api.post('/merchandises', data),
  update:  (id, data) => api.put(`/merchandises/${id}`, data),
  remove:  (id)       => api.delete(`/merchandises/${id}`),
};
