import { api } from './api';

export const sessionsService = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/screenings${q ? '?' + q : ''}`);
  },
  getUpcoming:  ()                     => api.get('/screenings/upcoming'),
  getById:      (id)                   => api.get(`/screenings/${id}`),
  create:       (data)                 => api.post('/screenings', data),
  update:       (id, data)             => api.put(`/screenings/${id}`, data),
  remove:       (id)                   => api.delete(`/screenings/${id}`),
  reserveSeat:  (screeningId, seatId)  => api.post(`/screenings/${screeningId}/seats/${seatId}/reserve`),
  releaseSeat:  (screeningId, seatId)  => api.post(`/screenings/${screeningId}/seats/${seatId}/release`),
  getPurchases: (screeningId)          => api.get(`/screenings/${screeningId}/purchases`),
};
