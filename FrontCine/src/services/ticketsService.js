import { api } from './api';

export const ticketsService = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/tickets${q ? '?' + q : ''}`);
  },
  // shortcut helpers
  getByPurchase:  (purchaseId)   => api.get(`/tickets?purchaseId=${purchaseId}`),
  getByScreening: (screeningId)  => api.get(`/tickets?screeningId=${screeningId}`),
  getById:        (id)           => api.get(`/tickets/${id}`),
};
