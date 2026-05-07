import { api } from './api';

export const shiftsService = {
  getAll:  ()         => api.get('/shifts'),
  getById: (id)       => api.get(`/shifts/${id}`),
  create:  (data)     => api.post('/shifts', data),
  update:  (id, data) => api.put(`/shifts/${id}`, data),
  remove:  (id)       => api.delete(`/shifts/${id}`),
};
