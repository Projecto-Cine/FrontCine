import { api } from './api';

export const workersService = {
  getAll:   () => api.get('/workers'),
  getById:  (id) => api.get(`/workers/${id}`),
  create:   (data) => api.post('/workers', data),
  update:   (id, data) => api.put(`/workers/${id}`, data),
  remove:   (id) => api.delete(`/workers/${id}`),
  getByRole: (role) => api.get(`/workers/role/${role}`),
  getActive: () => api.get('/workers/active'),
};
