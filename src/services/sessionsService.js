import { api } from './api';

export const sessionsService = {
  getAll:        (params = {})   => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/screenings${q ? '?' + q : ''}`);
  },
  getUpcoming:   ()              => api.get('/screenings/upcoming'),
  getById:       (id)            => api.get(`/screenings/${id}`),
  getByMovie:    (movieId)       => api.get(`/screenings/movie/${movieId}`),
  getPurchases:  (id)            => api.get(`/screenings/${id}/purchases`),
  create:        (data)          => api.post('/screenings', data),
  update:        (id, data)      => api.put(`/screenings/${id}`, data),
  remove:        (id)            => api.delete(`/screenings/${id}`),
  reserveSeat:   (id, seatId)    => api.post(`/screenings/${id}/seats/${seatId}/reserve`, {}),
  releaseSeat:   (id, seatId)    => api.post(`/screenings/${id}/seats/${seatId}/release`, {}),
  syncSeats:     (id)            => api.post(`/screenings/${id}/sync-seats`, {}),
};

export const screeningsService = sessionsService;
