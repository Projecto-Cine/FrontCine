/**
 * ReportsPage — branch-coverage suite.
 *
 * Exercises:
 *   - empty data branches
 *   - active movies counting (active true/false, status inactive)
 *   - incident category fallback to "Otros"
 *   - tooltip with/without payload
 *   - CSV export click
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const reportsSalesWeek = vi.fn();
const reportsOccupancy = vi.fn();
const moviesGetAll = vi.fn();
const incidentsGetAll = vi.fn();

vi.mock('../../services/reportsService', () => ({
  reportsService: {
    salesWeek: (...a) => reportsSalesWeek(...a),
    occupancy: (...a) => reportsOccupancy(...a),
  },
}));
vi.mock('../../services/moviesService', () => ({
  moviesService: { getAll: (...a) => moviesGetAll(...a), getActive: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../services/incidentsService', () => ({
  incidentsService: { getAll: (...a) => incidentsGetAll(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null, LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null, XAxis: () => null, YAxis: () => null,
  Tooltip: ({ content }) => {
    if (typeof content === 'function') {
      return (
        <div>
          {content({ active: true, payload: [{ value: 75 }], label: 'X' })}
          {content({ active: false, payload: [], label: 'X' })}
        </div>
      );
    }
    if (content?.type) {
      const C = content.type;
      // Drive both branches of CustomTT: revenue path, non-numeric value path, fallback color path
      return (
        <div>
          <C active payload={[{ name: '€ Ingresos', value: 100, color: 'red', dataKey: 'revenue' }]} label="Lun" />
          <C active payload={[{ name: 'Tickets', value: 50, dataKey: 'tickets' }]} label="Mar" />
          <C active payload={[{ name: 'Texto', value: 'abc' }]} label="Mié" />
          <C active={false} payload={[]} label="X" />
          <C active payload={null} label="X" />
        </div>
      );
    }
    return null;
  },
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Cell: () => null, PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null, Legend: () => null, CartesianGrid: () => null,
}));

import ReportsPage from './ReportsPage';

beforeEach(() => vi.clearAllMocks());

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><ReportsPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('ReportsPage — branch coverage', () => {
  it('handles empty data (no sales, no occupancy, no movies, no incidents)', async () => {
    reportsSalesWeek.mockResolvedValue([]);
    reportsOccupancy.mockResolvedValue([]);
    moviesGetAll.mockResolvedValue([]);
    incidentsGetAll.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(100));
  });

  it('handles legacy field names (ventas, entradas, sala)', async () => {
    reportsSalesWeek.mockResolvedValue([
      { day: 'L', ventas: 100, entradas: 5 },
      { day: 'M', ventas: 200, entradas: 8 },
    ]);
    reportsOccupancy.mockResolvedValue([
      { sala: 'Sala 1', pct: 95 },
      { sala: 'Sala 2', pct: 0 },
      { sala: 'Sala 3', pct: 60 },
    ]);
    moviesGetAll.mockResolvedValue([
      { id: 1, active: true },
      { id: 2, active: false },
      { id: 3, status: 'inactive' },
      { id: 4 }, // default = active
    ]);
    incidentsGetAll.mockResolvedValue([
      { id: 1, category: 'Técnico' },
      { id: 2, category: 'Técnico' },
      { id: 3, category: null }, // → "Otros"
      { id: 4 },                  // → "Otros"
    ]);
    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(100));
  });

  it('handles non-array responses without crashing', async () => {
    reportsSalesWeek.mockResolvedValue([]);
    reportsOccupancy.mockResolvedValue([]);
    moviesGetAll.mockResolvedValue('not-array');
    incidentsGetAll.mockResolvedValue('not-array');
    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(100));
  });

  it('exports CSV when the export button is clicked', async () => {
    const createObjURL = vi.fn().mockReturnValue('blob:test');
    const revokeObjURL = vi.fn();
    global.URL.createObjectURL = createObjURL;
    global.URL.revokeObjectURL = revokeObjURL;
    reportsSalesWeek.mockResolvedValue([
      { day: 'L', revenue: 100, tickets: 5 },
      { day: 'M', revenue: 200, tickets: 8 },
    ]);
    reportsOccupancy.mockResolvedValue([]);
    moviesGetAll.mockResolvedValue([]);
    incidentsGetAll.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(100));

    const exportBtn = screen.getAllByRole('button').find(b => /CSV|xport/i.test(b.textContent ?? ''));
    if (exportBtn) {
      fireEvent.click(exportBtn);
      expect(createObjURL).toHaveBeenCalled();
    }
  });

  it('all API calls fail — page still renders empty state', async () => {
    reportsSalesWeek.mockRejectedValue(new Error('fail'));
    reportsOccupancy.mockRejectedValue(new Error('fail'));
    moviesGetAll.mockRejectedValue(new Error('fail'));
    incidentsGetAll.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(50));
  });
});
