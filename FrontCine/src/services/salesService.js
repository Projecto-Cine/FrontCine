import { api } from './api';

// Endpoints /tickets y /merchandisesales no disponibles en el backend actual
export const salesService = {
  createTicketSale:     (data) => api.post('/tickets', data),
  createConcessionSale: (data) => api.post('/merchandisesales', data),
};
