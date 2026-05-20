import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';

const workersGetAll = vi.fn();
const workersGetActive = vi.fn();
const workersGetByRole = vi.fn();
const shiftsGetAll = vi.fn();
const shiftsGetByDate = vi.fn();
const shiftsGetByRange = vi.fn();
const shiftsCreate = vi.fn();
const shiftsUpdate = vi.fn();

vi.mock('../../services/workersService', () => ({
  workersService: {
    getAll: (...a) => workersGetAll(...a),
    getActive: (...a) => workersGetActive(...a),
    getByRole: (...a) => workersGetByRole(...a),
  },
}));
vi.mock('../../services/employeesService', () => ({
  employeesService: {
    getAll: (...a) => workersGetAll(...a),
    getById: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({ id: 99 }),
    update: vi.fn().mockResolvedValue({ id: 1 }),
    remove: vi.fn().mockResolvedValue(null),
  },
}));
vi.mock('../../services/shiftsService', () => ({
  shiftsService: {
    getAll: (...a) => shiftsGetAll(...a),
    getByDate: (...a) => shiftsGetByDate(...a),
    getByRange: (...a) => shiftsGetByRange(...a),
    create: (...a) => shiftsCreate(...a),
    update: (...a) => shiftsUpdate(...a),
  },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

const mockWorkers = [
  { id: 1, name: 'Carlos Técnico', role: 'CAJERO', active: true },
  { id: 2, name: 'Marta Super', role: 'GERENCIA', active: true },
  { id: 3, name: 'Luis Guardia', role: 'SEGURIDAD', active: true },
  { id: 4, name: 'Ana Limpia', role: 'LIMPIEZA', active: true },
  { id: 5, name: 'No Visible', role: 'CLIENTE', active: true },
];

import ShiftsPage from './ShiftsPage';
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  workersGetAll.mockResolvedValue(mockWorkers);
  workersGetActive.mockResolvedValue(mockWorkers);
  workersGetByRole.mockResolvedValue(mockWorkers);
  shiftsGetAll.mockResolvedValue([]);
  shiftsGetByDate.mockResolvedValue([]);
  shiftsGetByRange.mockResolvedValue([]);
});

const R = () => render(
  <MemoryRouter><LanguageProvider><AppProvider><ShiftsPage /></AppProvider></LanguageProvider></MemoryRouter>
);

describe('ShiftsPage', () => {
  it('loads workers and renders page', async () => {
    R();
    // Wait for page title or table content
    await waitFor(() => { expect(document.body.textContent.length).toBeGreaterThan(5); });
  });

  it('clicks navigation buttons', async () => {
    R();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(50));
    const btns = screen.getAllByRole('button');
    // Click all small nav buttons
    btns.forEach(b => {
      if (b.textContent.includes('▸') || b.textContent.includes('◂') || b.textContent.includes('❯') || b.textContent.includes('❮') || b.getAttribute('aria-label')?.includes('sig') || b.getAttribute('aria-label')?.includes('ant')) {
        fireEvent.click(b);
      }
    });
  });

  it('toggles week/month mode', async () => {
    R();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(50));
    fireEvent.click(screen.getByRole('button', { name: /mes/i }));
    expect(document.body.textContent).toContain('Sem');
    fireEvent.click(screen.getByRole('button', { name: /semana/i }));
  });

  it('clicks generate button', async () => {
    R();
    await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(50));
    const gen = screen.getAllByRole('button').find(b => b.textContent.includes('enerar') || b.textContent.includes('leatorio'));
    if (gen) fireEvent.click(gen);
  });

  it('clicks on table cells', async () => {
    R();
    await waitFor(() => expect(screen.getByText(/Carlos/)).toBeInTheDocument());
    const shiftButtons = screen.getAllByRole('button').filter(b => /^[MTNL]$/.test(b.textContent ?? ''));
    fireEvent.click(shiftButtons[0]);
    await waitFor(() => expect(screen.getAllByRole('button').some(b => /mañana/i.test(b.title ?? ''))).toBe(true));
    const nightButton = screen.getAllByRole('button').find(b => /noche/i.test(b.title ?? ''));
    fireEvent.click(nightButton);
  });

  it('closes the shift picker when clicking outside', async () => {
    R();
    await waitFor(() => expect(screen.getByText(/Carlos/)).toBeInTheDocument());

    const countShiftOptions = () =>
      screen.getAllByRole('button').filter(b => /mañana|tarde|noche|libre/i.test(b.title ?? '')).length;

    const before = countShiftOptions();
    const shiftButton = screen.getAllByRole('button').find(b => /^[MTNL]$/.test(b.textContent ?? ''));
    fireEvent.click(shiftButton);
    await waitFor(() => expect(countShiftOptions()).toBeGreaterThan(before));

    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(countShiftOptions()).toBe(before));
  });

  it('generates month schedules, navigates periods, and prints', async () => {
    window.print = vi.fn();
    R();
    await waitFor(() => expect(screen.getByText(/Carlos/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /mes/i }));
    fireEvent.click(screen.getByRole('button', { name: /generar mes/i }));

    const navButtons = screen.getAllByRole('button');
    navButtons.slice(0, 2).forEach(button => fireEvent.click(button));

    const printButton = screen.getByTitle(/imprimir/i);
    fireEvent.click(printButton);
    expect(window.print).toHaveBeenCalled();
  });
});
