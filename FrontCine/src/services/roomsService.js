import { api } from './api';

export const roomsService = {
  getAll:  ()         => api.get('/rooms'),
  getById: (id)       => api.get(`/rooms/${id}`),
  create:  (data)     => api.post('/rooms', data),
  update:  (id, data) => api.put(`/rooms/${id}`, data),
  remove:  (id)       => api.delete(`/rooms/${id}`),
};
