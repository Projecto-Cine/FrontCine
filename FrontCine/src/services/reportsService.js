import { api } from './api';

export const reportsService = {
  salesWeek: () => api.get('/reports/sales-week').catch(() => []),
  occupancy: () => api.get('/reports/occupancy').catch(() => []),
};
