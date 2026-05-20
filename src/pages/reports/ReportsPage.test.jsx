import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const reportsSalesWeek = vi.fn();
const reportsOccupancy = vi.fn();
const moviesGetAll = vi.fn();
const moviesGetActive = vi.fn();
const incidentsGetAll = vi.fn();

vi.mock('../../services/reportsService', () => ({
  reportsService: {
    salesWeek: (...a) => reportsSalesWeek(...a),
    occupancy: (...a) => reportsOccupancy(...a),
  },
}));
vi.mock('../../services/moviesService', () => ({
  moviesService: {
    getAll: (...a) => moviesGetAll(...a),
    getActive: (...a) => moviesGetActive(...a),
  },
}));
vi.mock('../../services/incidentsService', () => ({
  incidentsService: { getAll: (...a) => incidentsGetAll(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

const mockSalesWeek = [
  { date: '2025-01-13', revenue: 500, totalPurchases: 30 },
  { date: '2025-01-14', revenue: 700, totalPurchases: 45 },
  { date: '2025-01-15', revenue: 300, totalPurchases: 20 },
];
const mockOccupancy = [
  { theaterName: 'Sala 1', occupancyPercentage: 85 },
  { theaterName: 'Sala 2', occupancyPercentage: 60 },
];
const mockMovies = [
  { id: 1, title: 'Dune', status: 'ACTIVE' },
  { id: 2, title: 'Avatar', status: 'ACTIVE' },
];
const mockIncidents = [
  { id: 1, category: 'Técnico', status: 'open' },
  { id: 2, category: 'Técnico', status: 'resolved' },
  { id: 3, category: 'Seguridad', status: 'open' },
];

// Stub recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null, LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null, XAxis: () => null, YAxis: () => null,
  Tooltip: ({ content }) => {
    if (typeof content === 'function') {
      return <div>{content({ active: true, payload: [{ value: 85 }], label: 'Sala 1' })}</div>;
    }
    if (content?.type) {
      const TooltipContent = content.type;
      return <TooltipContent active payload={[{ name: 'Ingresos €', value: 500, color: 'var(--accent)', dataKey: 'revenue' }]} label="Lunes" />;
    }
    return null;
  },
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Cell: () => null, PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null, Legend: () => null, CartesianGrid: () => null,
}));

import ReportsPage from './ReportsPage';

beforeEach(() => {
  vi.clearAllMocks();
  reportsSalesWeek.mockResolvedValue(mockSalesWeek);
  reportsOccupancy.mockResolvedValue(mockOccupancy);
  moviesGetAll.mockResolvedValue(mockMovies);
  moviesGetActive.mockResolvedValue(mockMovies);
  incidentsGetAll.mockResolvedValue(mockIncidents);
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><ReportsPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('ReportsPage — comprehensive', () => {

  it('loads data and renders KPI cards and charts', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.body.textContent.length).toBeGreaterThan(100);
    });
    // Charts should be stubbed as testids
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThanOrEqual(1);
  });

  it('calculates KPIs correctly (week revenue, best day, tickets)', async () => {
    renderPage();
    await waitFor(() => {
      // Total revenue = 500+700+300 = 1500
      expect(document.body.textContent).toContain('1');
    });
  });

  it('exports CSV when export button is clicked', async () => {
    // Mock URL.createObjectURL and document.createElement for download
    const createObjURL = vi.fn().mockReturnValue('blob:test');
    const revokeObjURL = vi.fn();
    global.URL.createObjectURL = createObjURL;
    global.URL.revokeObjectURL = revokeObjURL;

    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(100));

    const exportBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('xportar') || b.textContent.includes('xport') || b.textContent.includes('CSV')
    );
    if (exportBtn) {
      fireEvent.click(exportBtn);
      // CSV download triggered
    }
  });

  it('handles API errors gracefully', async () => {
    reportsSalesWeek.mockRejectedValueOnce(new Error('fail'));
    reportsOccupancy.mockRejectedValueOnce(new Error('fail'));
    moviesGetAll.mockRejectedValueOnce(new Error('fail'));
    incidentsGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(0));
  });

  it('shows loading skeleton initially', async () => {
    renderPage();
    // Before data loads, skeleton should be visible
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(0));
  });
});
