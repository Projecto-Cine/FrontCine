import { api } from './api';

export const seatsService = {
  getAll:      (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/seats${q ? '?' + q : ''}`);
  },
  getById:     (id)           => api.get(`/seats/${id}`),
  getByTheater:   (theaterId)   => api.get(`/theaters/${theaterId}/seats`),
  getByScreening: async (screeningId) => {
    const data = await api.get(`/screenings/${screeningId}/seats`);
    // Normaliza el shape del backend: { id, screeningId, seat:{ id, row, number, type }, occupied }
    // → formato que espera RealSeatMap: { id, row, number, type, status }
    return (Array.isArray(data) ? data : []).map(s => ({
      id:     s.seat?.id   ?? s.id,
      row:    s.seat?.row  ?? s.row,
      number: s.seat?.number ?? s.number,
      type:   s.seat?.type ?? s.type,
      status: s.occupied ? 'occupied' : 'available',
    }));
  },
  create:      (data)         => api.post('/seats', data),
  update:      (id, data)     => api.put(`/seats/${id}`, data),
  remove:      (id)           => api.delete(`/seats/${id}`),
};
