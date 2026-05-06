import { api } from './api';

export const reservationsService = {
  getAll:  (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/purchases${q ? '?' + q : ''}`);
  },
  getById: (id)       => api.get(`/purchases/${id}`),
  // Admin create — auto-crea cliente si el email no existe en BD
  create:  (data)     => api.post('/purchases', data),
  // Admin edit
  update:  (id, data) => api.put(`/purchases/${id}`, data),
  // Pagar una reserva pendiente → devuelve { status:"CONFIRMED", tickets[{qrCode}] }
  pay:     (id, data) => api.post(`/purchases/${id}/pay`, data),
  // Cancelar usando el endpoint dedicado
  cancel:    (id)     => api.post(`/purchases/${id}/cancel`, {}),
  // Enviar email con ticket al cliente
  sendEmail: (id)     => api.post(`/purchases/${id}/email`, {}),
  remove:    (id)     => api.delete(`/purchases/${id}`),
};

export const purchasesService = reservationsService;
