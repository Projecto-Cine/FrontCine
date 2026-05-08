import { api } from './api';

export const reportsService = {
  // → [{ date, totalPurchases, revenue }]
  salesWeek: () => api.get('/reports/sales-week'),

  // → [{ screeningId, movieTitle, theaterName, dateTime, totalSeats, occupiedSeats, occupancyPercentage }]
  occupancy: () => api.get('/reports/occupancy'),
};
