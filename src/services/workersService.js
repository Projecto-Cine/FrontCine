import { api } from './api';

export const workersService = {
  getAll:   () => api.get('/employees'),
  getById:  (id) => api.get(`/employees/${id}`),
  create:   (data) => api.post('/employees', data),
  update:   (id, data) => api.put(`/employees/${id}`, data),
  remove:   (id) => api.delete(`/employees/${id}`),
  getByRole: (role) => api.get(`/employees/role/${role}`),
  getActive: () => api.get('/employees/active'),
};
