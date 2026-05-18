import { api } from './api';

export const salesService = {
  createPurchase:       (data) => api.post('/purchases', data),
  getById:              (id)   => api.get(`/purchases/${id}`),
  confirmPurchase:      (id)   => api.post(`/purchases/${id}/confirm`, {}),
  cancelPurchase:       (id)   => api.post(`/purchases/${id}/cancel`, {}),
  createMerchandiseSale:(data) => api.post('/merchandisesales', data),
};
