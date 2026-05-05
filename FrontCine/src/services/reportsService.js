import { api } from './api';

export const reportsService = {
  salesWeek: () => api.get('/reports/sales-week'),
  occupancy: () => api.get('/reports/occupancy'),
};
