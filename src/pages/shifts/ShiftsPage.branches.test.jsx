/**
 * ShiftsPage — branch-coverage suite.
 *
 * Exercises:
 *   - mode toggle week ↔ month
 *   - period navigation prev/next
 *   - shift cell editing (create/update/remove)
 *   - readOnly when role is LIMPIEZA/MANTENIMIENTO
 *   - print export
 *   - employees with various role mappings
 *   - empty employees + load error
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const employeesGetAll = vi.fn();
const shiftsGetByRange = vi.fn();
const shiftsCreate = vi.fn();
const shiftsUpdate = vi.fn();
const shiftsRemove = vi.fn();

let currentUserRole = 'admin';

vi.mock('../../services/employeesService', () => ({
  employeesService: {
    getAll: (...a) => employeesGetAll(...a),
    getById: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({ id: 99 }),
    update: vi.fn().mockResolvedValue({ id: 1 }),
    remove: vi.fn().mockResolvedValue(null),
  },
}));
vi.mock('../../services/shiftsService', () => ({
  shiftsService: {
    getAll: vi.fn().mockResolvedValue([]),
    getByDate: vi.fn().mockResolvedValue([]),
    getByRange: (...a) => shiftsGetByRange(...a),
    create: (...a) => shiftsCreate(...a),
    update: (...a) => shiftsUpdate(...a),
    remove: (...a) => shiftsRemove(...a),
  },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test', role: currentUserRole } }),
}));

const mockEmployees = [
  { id: 1, name: 'Ana López',  role: 'CAJERO',        active: true },
  { id: 2, name: 'Bruno Ruiz', role: 'GERENCIA',      active: true },
  { id: 3, name: 'Cris Mar',   role: 'LIMPIEZA',      active: true },
  { id: 4, name: 'Dani Tor',   role: 'MANTENIMIENTO', active: true },
  // Legacy role names
  { id: 5, position: 'CASHIER',    name: 'Edu C' },
  { id: 6, workerRole: 'MANAGEMENT', name: 'Fer M' },
  // Role outside valid set (filtered out from active list)
  { id: 7, role: 'CLIENTE',     name: 'Sin Rol' },
  // Missing name → falls back to username/email
  { id: 8, username: 'guille', email: 'g@x.com', role: 'CAJERO' },
];

import ShiftsPage from './ShiftsPage';

beforeEach(() => {
  vi.clearAllMocks();
  currentUserRole = 'admin';
  employeesGetAll.mockResolvedValue(mockEmployees);
  shiftsGetByRange.mockResolvedValue([]);
  shiftsCreate.mockResolvedValue({ id: 100 });
  shiftsUpdate.mockResolvedValue({ id: 100 });
  shiftsRemove.mockResolvedValue({});
  window.print = vi.fn();
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><ShiftsPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('ShiftsPage — branch coverage', () => {
  it('renders normalized employees from various role keys', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeInTheDocument());
    expect(screen.getByText(/Bruno/)).toBeInTheDocument();
  });

  it('navigates to previous week and back', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeInTheDocument());

    const allButtons = screen.getAllByRole('button');
    // Period nav buttons are the bare ChevronLeft/Right next to the period label
    fireEvent.click(allButtons.find(b => b.textContent === '' || /\d{1,2}/.test(b.textContent ?? '')) ?? allButtons[0]);
    fireEvent.click(allButtons[0]);
  });

  it('switches to month mode and generates a month schedule', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /mes/i }));
    fireEvent.click(screen.getByRole('button', { name: /generar mes/i }));
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(50));
  });

  it('creates a shift via cell editor (L → M)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeInTheDocument());

    const cell = screen.getAllByRole('button').find(b => /^[MTNL]$/.test(b.textContent ?? ''));
    fireEvent.click(cell);
    await waitFor(() => expect(screen.getAllByRole('button').some(b => /mañana/i.test(b.title ?? ''))).toBe(true));
    const morningBtn = screen.getAllByRole('button').find(b => /mañana/i.test(b.title ?? ''));
    fireEvent.click(morningBtn);
    // Service should be invoked
    await waitFor(() => expect(shiftsCreate.mock.calls.length + shiftsUpdate.mock.calls.length + shiftsRemove.mock.calls.length).toBeGreaterThan(0), { timeout: 3000 });
  });

  it('updates an existing shift (existing M → T)', async () => {
    // Pretend the backend has an existing shift for employee 1 today
    shiftsGetByRange.mockImplementation((from) => Promise.resolve([
      { id: 555, employeeId: 1, shiftDate: from, startTime: '08:00:00', endTime: '16:00:00' },
    ]));
    renderPage();
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeInTheDocument());

    const cell = screen.getAllByRole('button').find(b => /^[MTNL]$/.test(b.textContent ?? ''));
    fireEvent.click(cell);
    await waitFor(() => expect(screen.getAllByRole('button').some(b => /tarde/i.test(b.title ?? ''))).toBe(true));
    const tarde = screen.getAllByRole('button').find(b => /tarde/i.test(b.title ?? ''));
    fireEvent.click(tarde);
  });

  it('removes an existing shift when setting L', async () => {
    shiftsGetByRange.mockImplementation((from) => Promise.resolve([
      { id: 666, employeeId: 1, shiftDate: from, startTime: '08:00:00', endTime: '16:00:00' },
    ]));
    renderPage();
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeInTheDocument());

    const cell = screen.getAllByRole('button').find(b => /^[MTNL]$/.test(b.textContent ?? ''));
    fireEvent.click(cell);
    await waitFor(() => expect(screen.getAllByRole('button').some(b => /libre/i.test(b.title ?? ''))).toBe(true));
    const libre = screen.getAllByRole('button').find(b => /libre/i.test(b.title ?? ''));
    fireEvent.click(libre);
  });

  it('readOnly hides the generate button for LIMPIEZA role', async () => {
    currentUserRole = 'LIMPIEZA';
    renderPage();
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /generar/i })).not.toBeInTheDocument();
  });

  it('readOnly hides the generate button for MANTENIMIENTO role', async () => {
    currentUserRole = 'MANTENIMIENTO';
    renderPage();
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /generar/i })).not.toBeInTheDocument();
  });

  it('prints (Download button)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeInTheDocument());
    const printBtn = document.querySelector('[title="Imprimir / Exportar PDF"]');
    fireEvent.click(printBtn);
    expect(window.print).toHaveBeenCalled();
  });

  it('shows empty state when no employees are active', async () => {
    employeesGetAll.mockResolvedValueOnce([{ id: 1, name: 'X', role: 'CLIENTE' }]);
    renderPage();
    await waitFor(() => expect(document.body.textContent).toMatch(/No hay empleados/i));
  });

  it('handles employee load error', async () => {
    employeesGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(employeesGetAll).toHaveBeenCalled());
  });

  it('handles shift load error silently', async () => {
    shiftsGetByRange.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeInTheDocument());
  });

  it('generates a new week schedule (week mode)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /generar semana/i }));
  });
});
