import { api } from './api';

export const reservationsService = {
  getAll:  ()         => api.get('/reservations'),
  getById: (id)       => api.get(`/reservations/${id}`),
  create:  (data)     => api.post('/reservations', data),
  update:  (id, data) => api.put(`/reservations/${id}`, data),
  remove:  (id)       => api.delete(`/reservations/${id}`),
};
