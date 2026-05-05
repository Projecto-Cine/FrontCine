import { api } from './api';

export const reservationsService = {
  getAll:  (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/purchases${q ? '?' + q : ''}`);
  },
  getById: (id)       => api.get(`/purchases/${id}`),
  create:  (data)     => api.post('/purchases', data),
  update:  (id, data) => api.put(`/purchases/${id}`, data),
  remove:  (id)       => api.delete(`/purchases/${id}`),
};

export const purchasesService = reservationsService;
