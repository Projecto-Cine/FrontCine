import { api } from './api';

export const salesService = {
  // Primitivas de compra
  createPurchase:  (data) => api.post('/purchases', data),
  confirmPurchase: (id)   => api.post(`/purchases/${id}/confirm`, {}),
  cancelPurchase:  (id)   => api.post(`/purchases/${id}/cancel`, {}),
  createMerchandiseSale: (data) => api.post('/merchandisesales', data),

  // Taquilla: crea la compra y confirma de inmediato (tarjeta/efectivo).
  // Para pagos QR deja la compra en PENDING hasta que la pasarela confirme.
  createTicketSale: async (data) => {
    const purchase = await api.post('/purchases', {
      userId:        data.userId ?? data.cashierId ?? null,
      screeningId:   data.screeningId,
      tickets:       data.seats.map(seatId => ({ seatId, ticketType: data.ticketType })),
      paymentMethod: data.paymentMethod,
    });
    if (data.paymentMethod !== 'QR') {
      try {
        const confirmed = await api.post(`/purchases/${purchase.id}/confirm`, {});
        return { ...purchase, ...(confirmed ?? {}) };
      } catch {
        return purchase;
      }
    }
    return purchase;
  },

  // Caja: el backend actual guarda una venta por producto.
  createConcessionSale: async (data) => {
    if (!Array.isArray(data.items)) return api.post('/merchandisesales', data);
    if (data.payment_method === 'QR') return api.post('/merchandisesales', data);

    const sales = await Promise.all(data.items.map(item =>
      api.post('/merchandisesales', {
        userId:        data.userId ?? data.cashier_id ?? data.cashierId ?? null,
        merchandiseId: item.merchandiseId ?? item.product_id ?? item.productId,
        quantity:      item.quantity ?? item.qty,
      })
    ));

    return {
      id: sales[0]?.id,
      sales,
      total: sales.reduce((sum, sale) => sum + Number(sale?.total ?? 0), 0),
    };
  },

  createPaymentIntent: async (purchaseId, amount, currency = 'EUR') => {
    const body = { purchaseId, amount, currency };
    try {
      return await api.post('/payments/create-intent', body);
    } catch (err) {
      if (err.status !== 404) throw err;
      return api.post('/payments/intent', body);
    }
  },

  confirmPurchaseAfterStripe: (purchaseId) =>
    api.post(`/purchases/${purchaseId}/confirm`, {}),

  refundPurchase: (purchaseId, reason = 'CUSTOMER_REQUEST') =>
    api.post('/payments/refund', { purchaseId, reason }),

  getPaymentHistory: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/payments/history${q ? '?' + q : ''}`);
  },
};
