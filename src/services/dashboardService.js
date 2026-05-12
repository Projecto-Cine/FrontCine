import { api } from './api';

export const dashboardService = {
  // → { totalRevenue, weeklyRevenue, totalPurchases, paidPurchases,
  //     activeScreenings, confirmedRoomBookings, totalUsers,
  //     activeMovies, unresolvedIncidents }
  get:          () => api.get('/dashboard'),
  getPurchases: () => api.get('/purchases'),
};
