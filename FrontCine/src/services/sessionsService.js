import { api } from './api';

export const sessionsService = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/sessions${q ? '?' + q : ''}`);
  },
  getById: (id)       => api.get(`/sessions/${id}`),
  create:  (data)     => api.post('/sessions', data),
  update:  (id, data) => api.put(`/sessions/${id}`, data),
  remove:  (id)       => api.delete(`/sessions/${id}`),
};
