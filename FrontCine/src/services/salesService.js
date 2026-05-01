import { api } from './api';

export const salesService = {
  createTicketSale: (data) => api.post('/sales/tickets', data),
  // body: { session_id, seats[], ticket_type, format_extra, unit_price,
  //         surcharge, total, payment_method, cashier_id }
  // → { sale_id, qr_codes[] }

  createConcessionSale: (data) => api.post('/sales/concession', data),
  // body: { items[{ product_id, name, qty, unit_price }], total,
  //         payment_method, cash_given, change, cashier_id }
  // → { sale_id }
};
