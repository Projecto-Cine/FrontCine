import { api } from './api';

export const reportsService = {
  salesWeek: () => api.get('/reports/sales-week'),
  // → [{ day: string, ventas: number, entradas: number }]

  occupancy: () => api.get('/reports/occupancy'),
  // → [{ sala: string, pct: number }]

  kpis: () => api.get('/reports/kpis'),
  // → { revenue_today, tickets_today, occupancy_avg, incidents_open }
};
