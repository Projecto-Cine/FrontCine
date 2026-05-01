import { api } from './api';

export const auditService = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/audit-logs${q ? '?' + q : ''}`);
  },
};
