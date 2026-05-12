import { api } from './api';

export const seatsService = {
  getAll:        (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/seats${q ? '?' + q : ''}`);
  },
  getById:       (id)           => api.get(`/seats/${id}`),
  getByTheater:  (theaterId)    => api.get(`/theaters/${theaterId}/seats`),
  getByScreening: (screeningId) => api.get(`/screenings/${screeningId}/seats`),
  create:        (data)         => api.post('/seats', data),
  update:        (id, data)     => api.put(`/seats/${id}`, data),
  remove:        (id)           => api.delete(`/seats/${id}`),
};
