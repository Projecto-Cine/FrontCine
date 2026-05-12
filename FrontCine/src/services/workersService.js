import { api } from './api';

const toArray = (data) => Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);

export const workersService = {
  getAll:  async ()     => toArray(await api.get('/employees')),
  getById: (id)         => api.get(`/employees/${id}`),
  create:  (data)       => api.post('/employees', data),
  update:  (id, data)   => api.put(`/employees/${id}`, data),
  remove:  (id)         => api.delete(`/employees/${id}`),
};
