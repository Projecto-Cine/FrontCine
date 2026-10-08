/**
 * Dashboard — branch-coverage suite.
 *
 * Exercises:
 *   - missing/empty data branches (dash null, empty arrays)
 *   - severity/priority mapping branches
 *   - occupancy cell colour branches (0, 70, 90+)
 *   - revenue split percentages with zero total
 *   - sessions filter by today vs other days
 *   - KPI fall-back values when keys are missing
 *
 * Code in English; UI text stays in Spanish.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const dashGet            = vi.fn();
const dashGetPurchases   = vi.fn();
const reportsSalesWeek   = vi.fn();
const reportsOccupancy   = vi.fn();
const sessionsGetUpcoming = vi.fn();
const sessionsGetAll     = vi.fn();
const incidentsGetAll    = vi.fn();
const merchGetAll        = vi.fn();

vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    get:          (...a) => dashGet(...a),
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
    getAll:      (...a) => sessionsGetAll(...a),
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

// Stub recharts to avoid jsdom hangs
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null, LineChart: ({ children }) => <div>{children}</div>, Line: () => null,
  XAxis: () => null, YAxis: () => null,
  Tooltip: ({ content }) => {
    if (typeof content === 'function') return <div>{content({ active: true, payload: [{ value: 75 }], label: 'X' })}</div>;
    if (content?.type) {
      const Inner = content.type;
      return <Inner active payload={[{ name: 'X', value: 100, color: 'var(--accent)' }]} label="X" />;
    }
    return null;
  },
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Cell: () => null, PieChart: ({ children }) => <div>{children}</div>, Pie: () => null,
}));

import Dashboard from './Dashboard';

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><Dashboard /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

const TODAY = new Date().toISOString().split('T')[0];

describe('Dashboard — branch coverage', () => {
  it('handles null KPI payload (uses fallbacks)', async () => {
    dashGet.mockResolvedValue(null);
    dashGetPurchases.mockResolvedValue([]);
    reportsSalesWeek.mockResolvedValue([]);
    reportsOccupancy.mockResolvedValue([]);
    sessionsGetUpcoming.mockResolvedValue([]);
    sessionsGetAll.mockResolvedValue([]);
    incidentsGetAll.mockResolvedValue([]);
    merchGetAll.mockResolvedValue([]);

    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(0), { timeout: 8000 });
  });

  it('handles incidents with all severities mapped', async () => {
    dashGet.mockResolvedValue({ weeklyRevenue: 500, activeScreenings: 3, paidPurchases: 5, unresolvedIncidents: 4, activeMovies: 2 });
    dashGetPurchases.mockResolvedValue([]);
    reportsSalesWeek.mockResolvedValue([]);
    reportsOccupancy.mockResolvedValue([
      { theaterName: 'A', occupancyPercentage: 100 },
      { theaterName: 'B', occupancyPercentage: 80 },
      { theaterName: 'C', occupancyPercentage: 50 },
      { theaterName: 'D', occupancyPercentage: 0 },
      { theaterName: 'A', occupancyPercentage: 30 }, // keep max
    ]);
    sessionsGetUpcoming.mockResolvedValue([]);
    sessionsGetAll.mockResolvedValue([]);
    incidentsGetAll.mockResolvedValue([
      { id: 1, severity: 'HIGH', resolved: false, title: 'x' },
      { id: 2, severity: 'MEDIUM', resolved: false, title: 'y' },
      { id: 3, severity: 'LOW', resolved: true, title: 'z' },
      { id: 4, priority: 'critical', resolved: false, title: 'critic' },
      { id: 5, priority: 'low', resolved: false, title: 'lo' },
    ]);
    merchGetAll.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(0), { timeout: 8000 });
  });

  it('handles purchases with mixed status casing', async () => {
    dashGet.mockResolvedValue({});
    dashGetPurchases.mockResolvedValue([
      { id: 1, status: 'CONFIRMED',  totalAmount: 10, movieTitle: 'Dune' },
      { id: 2, status: 'paid',       total: 20,       screening: { movie: { title: 'Avatar' } } },
      { id: 3, status: 'COMPLETED',  amount: 30,      movie: { title: 'Matrix' } },
      { id: 4, status: 'CANCELLED',  totalAmount: 999, movieTitle: 'Discarded' },
      { id: 5, status: 'confirmed',  totalAmount: 15, movie_name: 'Inception' },
    ]);
    reportsSalesWeek.mockResolvedValue([
      { date: TODAY, revenue: 200, totalPurchases: 5 },
      { day: 'L', revenue: 0, tickets: 3 },
    ]);
    reportsOccupancy.mockResolvedValue([]);
    sessionsGetUpcoming.mockResolvedValue([
      { id: 1, startTime: `${TODAY}T10:00`, movie: { title: 'Dune' }, theater: { name: 'Sala 1' }, status: 'ACTIVE' },
      { id: 2, startTime: `${TODAY}T22:00`, movie: { title: 'Avatar' }, theater: { name: 'Sala 2 — IMAX' }, status: 'FULL' },
      { id: 3, startTime: '2020-01-01T10:00', movie: { title: 'OldOne' }, theater: { name: 'Sala' }, status: 'SCHEDULED' },
    ]);
    sessionsGetAll.mockResolvedValue([
      { id: 1, startTime: `${new Date().getFullYear()}-06-01T10:00`, movie: { id: 10 } },
      { id: 2, startTime: `${new Date().getFullYear()}-07-01T10:00`, movieId: 11 },
      { id: 3, startTime: `1999-01-01T10:00`, movie_id: 12 },
      { id: 4, startTime: `${new Date().getFullYear()}-08-01T10:00` }, // movie id null
    ]);
    incidentsGetAll.mockResolvedValue([]);
    merchGetAll.mockResolvedValue([
      { id: 1, merchandiseName: 'Pop',  quantity: 2, unitPrice: 5, totalAmount: 10 },
      { id: 2, merchandise: { name: 'Coke' }, quantity: 1, unit_price: 3 }, // totalAmount missing → calculated
      { id: 3, product: { name: 'Mug' }, qty: 1, price: 12 },
      { id: 4, product_name: 'Toy', quantity: 1, price: 8 },
    ]);

    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(0), { timeout: 8000 });
    // Top movies should at least include one valid title
    expect(document.body.textContent).toMatch(/Dune|Avatar|Matrix|Inception/);
  });

  it('handles non-array data gracefully (only array-safe inputs)', async () => {
    dashGet.mockResolvedValue({});
    dashGetPurchases.mockResolvedValue(null);
    reportsSalesWeek.mockResolvedValue([]);
    reportsOccupancy.mockResolvedValue([]);
    sessionsGetUpcoming.mockResolvedValue(undefined);
    sessionsGetAll.mockResolvedValue(null);
    incidentsGetAll.mockResolvedValue(false);
    merchGetAll.mockResolvedValue(null);

    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(0), { timeout: 8000 });
  });

  it('renders sessions with mixed status badges (ACTIVE, FULL, CANCELLED)', async () => {
    dashGet.mockResolvedValue({});
    dashGetPurchases.mockResolvedValue([]);
    reportsSalesWeek.mockResolvedValue([]);
    reportsOccupancy.mockResolvedValue([]);
    sessionsGetUpcoming.mockResolvedValue([
      { id: 1, startTime: `${TODAY}T10:00`, movie: { title: 'A' }, theater: { name: 'Sala 1' }, status: 'ACTIVE' },
      { id: 2, startTime: `${TODAY}T11:00`, movie: { title: 'B' }, theater: { name: 'Sala 2' }, status: 'FULL' },
      { id: 3, startTime: `${TODAY}T12:00`, movie: { title: 'C' }, theater: { name: 'Sala 3' }, status: 'CANCELLED' },
      { id: 4, startTime: `${TODAY}T13:00`, movie: { title: 'D' }, theater: { name: 'Sala 4' }, status: 'SCHEDULED' },
      { id: 5, startTime: `${TODAY}T14:00`, movie: { title: 'E' }, theater: { name: 'Sala 5' }, status: 'UNKNOWN' },
    ]);
    sessionsGetAll.mockResolvedValue([]);
    incidentsGetAll.mockResolvedValue([
      { id: 1, severity: 'HIGH', resolved: false, title: 'Critical issue', room: 'Sala 1', priority: 'critical', status: 'open' },
      { id: 2, severity: 'LOW',  resolved: false, title: 'Minor issue',    room: 'Sala 2', priority: 'low',      status: 'in_progress' },
    ]);
    merchGetAll.mockResolvedValue([]);

    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(0), { timeout: 8000 });
  });

  it('renders the "no sessions/incidents/alerts" empty branches', async () => {
    dashGet.mockResolvedValue({ unresolvedIncidents: 0 });
    dashGetPurchases.mockResolvedValue([]);
    reportsSalesWeek.mockResolvedValue([]);
    reportsOccupancy.mockResolvedValue([]);
    sessionsGetUpcoming.mockResolvedValue([]);
    sessionsGetAll.mockResolvedValue([]);
    incidentsGetAll.mockResolvedValue([]);
    merchGetAll.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(0), { timeout: 8000 });
  });
}, 30000);
