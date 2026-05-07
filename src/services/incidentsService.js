import { api } from './api';

export const incidentsService = {
  getAll:  ()         => api.get('/incidents'),
  getById: (id)       => api.get(`/incidents/${id}`),
  create:  (data)     => api.post('/incidents', data),
  update:  (id, data) => api.put(`/incidents/${id}`, data),
  remove:  (id)       => api.delete(`/incidents/${id}`),
};
