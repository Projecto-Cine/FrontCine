import { api } from './api';

export const reservationsService = {
  getAll:         ()              => api.get('/purchases'),
  getById:        (id)            => api.get(`/purchases/${id}`),
  getByUser:      (userId)        => api.get(`/purchases/user/${userId}`),
  getByScreening: (screeningId)   => api.get(`/purchases/screening/${screeningId}`),
  // body: { userId, screeningId, total, status }
  create:         (data)          => api.post('/purchases', data),
  update:         (id, data)      => api.put(`/purchases/${id}`, data),
  // PENDING → PAID/CONFIRMED — accepts { paymentMethod }
  pay:            (id, data)      => api.post(`/purchases/${id}/confirm`, data ?? {}),
  confirm:        (id)            => api.post(`/purchases/${id}/confirm`, {}),
  // PENDING/PAID → CANCELLED
  cancel:         (id)            => api.post(`/purchases/${id}/cancel`, {}),
  remove:         (id)            => api.delete(`/purchases/${id}`),
};

export const purchasesService = reservationsService;
