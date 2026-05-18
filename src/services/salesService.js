import { api } from './api';

export const salesService = {
  // Crear compra (taquilla u online) — body: { userId, screeningId, tickets:[{ seatId, ticketType }] }
  // → PurchaseResponseDTO con status: PENDING
  createPurchase: (data) => api.post('/purchases', data),

  // PENDING → PAID
  confirmPurchase: (id) => api.post(`/purchases/${id}/confirm`, {}),

  // → CANCELLED
  cancelPurchase: (id) => api.post(`/purchases/${id}/cancel`, {}),

  // Venta de merchandise — body: { userId, merchandiseId, quantity }
  createMerchandiseSale: (data) => api.post('/merchandisesales', data),
};
