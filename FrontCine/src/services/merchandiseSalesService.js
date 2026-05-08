import { api } from './api';

export const merchandiseSalesService = {
  getAll:  ()           => api.get('/merchandisesales'),
  getById: (id)         => api.get(`/merchandisesales/${id}`),
  // body: { userId, merchandiseId, quantity }
  create:  (data)       => api.post('/merchandisesales', data),
  update:  (id, data)   => api.put(`/merchandisesales/${id}`, data),
  remove:  (id)         => api.delete(`/merchandisesales/${id}`),
};
