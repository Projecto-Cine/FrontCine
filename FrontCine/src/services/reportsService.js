import { api } from './api';

export const reportsService = {
  kpis:      () => api.get('/reports/kpis'),
  salesWeek: () => api.get('/reports/sales-week').catch(() => []),
  occupancy: () => api.get('/reports/occupancy').catch(() => []),
};
