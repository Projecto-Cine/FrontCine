import { api } from './api';

export const roomsService = {
  getAll:    ()           => api.get('/theaters'),
  getById:   (id)         => api.get(`/theaters/${id}`),
  getSeats:  (id)         => api.get(`/theaters/${id}/seats`),
  create:    (data)       => api.post('/theaters', data),
  update:    (id, data)   => api.put(`/theaters/${id}`, data),
  remove:    (id)         => api.delete(`/theaters/${id}`),
};

export const theatersService = roomsService;
