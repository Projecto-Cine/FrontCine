import { api, BASE } from './api';

export const salesService = {
  createPurchase:       (data) => api.post('/purchases', data),
  getById:              (id)   => api.get(`/purchases/${id}`),
  confirmPurchase:      (id)   => api.post(`/purchases/${id}/confirm`, {}),
  cancelPurchase:       (id)   => api.post(`/purchases/${id}/cancel`, {}),

  createMerchandiseSale: async (data) => {
    const token = localStorage.getItem('lumen_token');
    if (!token) {
      const err = new Error('Sesión expirada.');
      err.status = 401;
      throw err;
    }
    const res = await fetch(`${BASE}/merchandisesales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (res.status === 204) return null;
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`API ${res.status} /merchandisesales: ${text}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },
};
