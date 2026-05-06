import { api } from './api';

export const sessionsService = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/screenings${q ? '?' + q : ''}`);
  },
  getById: (id)       => api.get(`/screenings/${id}`),
  create:  (data)     => api.post('/screenings', data),
  update:  (id, data) => api.put(`/screenings/${id}`, data),
  remove:  (id)       => api.delete(`/screenings/${id}`),
};

export const screeningsService = sessionsService;
