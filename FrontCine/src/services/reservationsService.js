import { api } from './api';

// Purchase create body: { userId, screeningId, tickets: [{ seatId, ticketType: "ADULT"|"CHILD"|"SENIOR" }] }
export const reservationsService = {
  getById:        (id)          => api.get(`/purchases/${id}`),
  getByUser:      (userId)      => api.get(`/purchases/user/${userId}`),
  getByScreening: (screeningId) => api.get(`/purchases/screening/${screeningId}`),
  create:         (data)        => api.post('/purchases/create', data),
  confirm:        (id)          => api.post(`/purchases/${id}/confirm`),
  cancel:         (id)          => api.post(`/purchases/${id}/cancel`),
};
