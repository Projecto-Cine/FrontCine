import { api } from './api';

// Endpoint /dashboard no disponible en el backend actual
export const auditService = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/dashboard${q ? '?' + q : ''}`).catch(() => []);
  },
};
