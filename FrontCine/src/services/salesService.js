import { api } from './api';

export const salesService = {
  // Taquilla (POS) — un solo paso
  // body: { screeningId, seats["A5","A6"], ticketType:"ADULT|CHILD|SENIOR|STUDENT",
  //         unitPrice, surcharge, total, paymentMethod:"CARD|CASH|QR", cashierId, userId? }
  // → { saleId, qrCodes[] }
  createTicketSale: (data) => api.post('/purchases/ticket-office', data),

  // Compra online con selección de asientos
  // body: { userId, screeningId, tickets[{ seatId, ticketType }], paymentMethod:"CARD|ONLINE" }
  // → { id, status:"PENDING", totalAmount, tickets[], ... }
  createOnlinePurchase: (data) => api.post('/purchases/online', data),

  // Crear reserva desde admin (crea cliente automáticamente si el email no existe)
  // body: { clientName, clientEmail, screeningId, paymentMethod, status, totalAmount }
  createAdminPurchase: (data) => api.post('/purchases', data),

  // Pagar una compra pendiente
  // body: { paymentMethod:"CARD|CASH|QR|ONLINE", cardLastFour? }
  // → { purchaseId, status:"CONFIRMED", tickets[{ qrCode, ... }], paymentQrCode? }
  payPurchase: (id, data) => api.post(`/purchases/${id}/pay`, data),

  // Cancelar compra (solo si la proyección no ha comenzado)
  cancelPurchase: (id) => api.post(`/purchases/${id}/cancel`, {}),

  createConcessionSale: (data) => api.post('/merchandise/sales', data),
  // body: { items[{ product_id, name, qty, unit_price }], total,
  //         payment_method, cash_given, change, cashier_id }
};
