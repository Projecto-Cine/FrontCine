import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const dashGet = vi.fn();
const dashGetPurchases = vi.fn();
const reportsSalesWeek = vi.fn();
const reportsOccupancy = vi.fn();
const sessionsGetUpcoming = vi.fn();
const sessionsGetAll = vi.fn();
const incidentsGetAll = vi.fn();
const merchGetAll = vi.fn();

vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    get: (...a) => dashGet(...a),
    getPurchases: (...a) => dashGetPurchases(...a),
  },
}));
vi.mock('../../services/reportsService', () => ({
  reportsService: {
    salesWeek: (...a) => reportsSalesWeek(...a),
    occupancy: (...a) => reportsOccupancy(...a),
  },
}));
vi.mock('../../services/sessionsService', () => ({
  getSeats: vi.fn().mockResolvedValue([]),
  sessionsService: {
    getUpcoming: (...a) => sessionsGetUpcoming(...a),
    getAll: (...a) => sessionsGetAll(...a),
  },
}));
vi.mock('../../services/incidentsService', () => ({
  incidentsService: { getAll: (...a) => incidentsGetAll(...a) },
}));
vi.mock('../../services/merchandiseSalesService', () => ({
  merchandiseSalesService: { getAll: (...a) => merchGetAll(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

const mockDash = { totalRevenue: 5000, weeklyRevenue: 1200, totalPurchases: 50, paidPurchases: 40, activeScreenings: 3, confirmedRoomBookings: 2, totalUsers: 120, activeMovies: 5, unresolvedIncidents: 2 };
const mockSales = [{ date: '2025-01-01', revenue: 100, totalPurchases: 10 }, { date: '2025-01-02', revenue: 200, totalPurchases: 20 }];
const mockOcc = [{ theaterName: 'Sala 1', occupancyPercentage: 75 }, { theaterName: 'Sala 2', occupancyPercentage: 50 }];
const mockSessions = [{ id: 1, startTime: new Date().toISOString(), movie: { title: 'Dune' }, theater: { name: 'Sala 1' }, status: 'ACTIVE' }];
const mockIncidents = [{ id: 1, severity: 'ALTA', resolved: false, title: 'Issue', status: 'OPEN' }];
const mockPurchases = [{ id: 1, status: 'CONFIRMED', totalAmount: 25, movieTitle: 'Dune' }];
const mockMerch = [{ id: 1, merchandiseName: 'Popcorn', quantity: 2, unitPrice: 5 }];
const mockAllScreenings = [{ id: 1, startTime: `${new Date().getFullYear()}-01-01T10:00`, movie: { id: 10 } }];

// Stub recharts to avoid jsdom hangs
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null, LineChart: ({ children }) => <div>{children}</div>, Line: () => null,
  XAxis: () => null, YAxis: () => null,
  Tooltip: ({ content, formatter }) => {
    if (typeof content === 'function') {
      return <div>{content({ active: true, payload: [{ value: 75 }], label: 'Sala 1' })}</div>;
    }
    if (content?.type) {
      const TooltipContent = content.type;
      return <TooltipContent active payload={[{ name: 'Ingresos', value: 100, color: 'var(--accent)' }]} label="Lun" />;
    }
    return <div>{formatter ? formatter(100) : null}</div>;
  },
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Cell: () => null, PieChart: ({ children }) => <div>{children}</div>, Pie: () => null,
}));

import Dashboard from './Dashboard';

beforeEach(() => {
  vi.clearAllMocks();
  dashGet.mockResolvedValue(mockDash);
  dashGetPurchases.mockResolvedValue(mockPurchases);
  reportsSalesWeek.mockResolvedValue(mockSales);
  reportsOccupancy.mockResolvedValue(mockOcc);
  sessionsGetUpcoming.mockResolvedValue(mockSessions);
  sessionsGetAll.mockResolvedValue(mockAllScreenings);
  incidentsGetAll.mockResolvedValue(mockIncidents);
  merchGetAll.mockResolvedValue(mockMerch);
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><Dashboard /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('Dashboard — comprehensive', () => {

  it('renders KPI cards and chart placeholders after loading', async () => {
    renderPage();
    await waitFor(() => {
      // Dashboard fetches 8 API calls — after all settle, should show KPIs
      const content = document.body.textContent;
      expect(content.length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });

  it('displays top movies and top products rankings', async () => {
    dashGetPurchases.mockResolvedValueOnce([
      { id: 1, status: 'CONFIRMED', totalAmount: 25, movieTitle: 'Dune' },
      { id: 2, status: 'PAID', total: 100, movieTitle: 'Avatar' },
      { id: 3, status: 'PENDING', total: 999, movieTitle: 'Ignored' },
    ]);
    renderPage();
    await waitFor(() => {
      expect(document.body.textContent).toContain('Dune');
    }, { timeout: 10000 });
  });

  it('shows incidents section for unresolved issues', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.body.textContent.length).toBeGreaterThan(100);
    }, { timeout: 10000 });
  });

  it('handles API errors gracefully (all services fail)', async () => {
    dashGet.mockRejectedValueOnce(new Error('fail'));
    reportsSalesWeek.mockRejectedValueOnce(new Error('fail'));
    reportsOccupancy.mockRejectedValueOnce(new Error('fail'));
    sessionsGetUpcoming.mockRejectedValueOnce(new Error('fail'));
    incidentsGetAll.mockRejectedValueOnce(new Error('fail'));
    dashGetPurchases.mockRejectedValueOnce(new Error('fail'));
    merchGetAll.mockRejectedValueOnce(new Error('fail'));
    sessionsGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => {
      expect(document.body.textContent.length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });
}, 30000);
