import { api } from './api';

// Endpoint /dashboard no disponible en el backend actual (devuelve null)
export const auditService = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/dashboard${q ? '?' + q : ''}`).then(d => d ?? []).catch(() => []);
  },
};
