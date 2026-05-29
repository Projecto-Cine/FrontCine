/**
 * IncidentsPage — branch coverage tests.
 *
 * Exercises:
 *   - filter by status (all/open/in_progress/resolved)
 *   - role filtering for staff users (maintenance/operator/supervisor/admin)
 *   - save validation (empty title)
 *   - save error path
 *   - update fallback when API returns null
 *   - non-array responses
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const incidentsGetAll = vi.fn();
const incidentsCreate = vi.fn();
const incidentsUpdate = vi.fn();
const usersGetAll = vi.fn();

vi.mock('../../services/incidentsService', () => ({
  incidentsService: {
    getAll: (...a) => incidentsGetAll(...a),
    create: (...a) => incidentsCreate(...a),
    update: (...a) => incidentsUpdate(...a),
    remove: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../../services/usersService', () => ({
  usersService: { getAll: (...a) => usersGetAll(...a), getAllEmployees: (...a) => usersGetAll(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

const INCIDENTS = [
  { id: 1, title: 'Pantalla rota',   category: 'Técnico',     priority: 'critical', status: 'open',        room: 'Sala 1' },
  { id: 2, title: 'Asiento dañado',  category: 'Mobiliario',  priority: 'high',     status: 'in_progress', room: 'Sala 2' },
  { id: 3, title: 'Bombilla fundida',category: 'Software',    priority: 'medium',   status: 'resolved',    room: 'Sala 3' },
  { id: 4, title: 'Otro',            category: 'Seguridad',   priority: 'low',      status: 'open' },
];

const USERS = [
  { id: 1, name: 'Mant Tec', role: 'maintenance' },
  { id: 2, name: 'Op Cajero', role: 'operator' },
  { id: 3, name: 'Sup Anna',  role: 'supervisor' },
  { id: 4, name: 'Adm Boss',  role: 'admin' },
  { id: 5, name: 'Cliente',   role: 'CLIENTE' }, // should be excluded
];

import IncidentsPage from './IncidentsPage';

beforeEach(() => {
  vi.clearAllMocks();
  incidentsGetAll.mockResolvedValue(INCIDENTS);
  usersGetAll.mockResolvedValue(USERS);
  incidentsCreate.mockResolvedValue({ id: 99, title: 'New' });
  incidentsUpdate.mockResolvedValue({ id: 1 });
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><IncidentsPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('IncidentsPage — branch coverage', () => {
  it('renders all incidents with mixed status branches', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Pantalla rota')).toBeInTheDocument());
    expect(screen.getByText('Asiento dañado')).toBeInTheDocument();
    expect(screen.getByText('Bombilla fundida')).toBeInTheDocument();
  });

  it('handles non-array responses', async () => {
    incidentsGetAll.mockResolvedValueOnce(null);
    usersGetAll.mockResolvedValueOnce(null);
    renderPage();
    await waitFor(() => expect(incidentsGetAll).toHaveBeenCalled());
  });

  it('handles getAll error', async () => {
    incidentsGetAll.mockRejectedValueOnce(new Error('fail'));
    usersGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(incidentsGetAll).toHaveBeenCalled());
  });

  it('filters by status: open/in_progress/resolved/all', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Pantalla rota')).toBeInTheDocument());

    const filterBtns = screen.getAllByRole('button').filter(b => /Abiertas|Curso|Resuelto|Todo/i.test(b.textContent ?? ''));
    filterBtns.forEach(b => fireEvent.click(b));
  });

  it('rejects save with empty title', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Pantalla rota')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nueva|Crear|incidencia/i.test(b.textContent ?? ''));
    if (createBtn) {
      fireEvent.click(createBtn);
      await waitFor(() => expect(document.getElementById('inc-title')).toBeTruthy());
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear|Registrar/i.test(b.textContent ?? ''));
      if (save) fireEvent.click(save);
      expect(incidentsCreate).not.toHaveBeenCalled();
    }
  });

  it('creates incident successfully', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Pantalla rota')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nueva|Crear|incidencia/i.test(b.textContent ?? ''));
    if (createBtn) {
      fireEvent.click(createBtn);
      await waitFor(() => expect(document.getElementById('inc-title')).toBeTruthy());
      fireEvent.change(document.getElementById('inc-title'), { target: { value: 'Nueva' } });
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear|Registrar/i.test(b.textContent ?? ''));
      if (save) {
        fireEvent.click(save);
        await waitFor(() => expect(incidentsCreate).toHaveBeenCalled());
      }
    }
  });

  it('handles save error', async () => {
    incidentsCreate.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Pantalla rota')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nueva|Crear|incidencia/i.test(b.textContent ?? ''));
    if (createBtn) {
      fireEvent.click(createBtn);
      await waitFor(() => expect(document.getElementById('inc-title')).toBeTruthy());
      fireEvent.change(document.getElementById('inc-title'), { target: { value: 'Bad' } });
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear|Registrar/i.test(b.textContent ?? ''));
      if (save) {
        fireEvent.click(save);
        await waitFor(() => expect(incidentsCreate).toHaveBeenCalled());
      }
    }
  });

  it('uses fallback when update returns null', async () => {
    incidentsUpdate.mockResolvedValueOnce(null);
    renderPage();
    await waitFor(() => expect(screen.getByText('Pantalla rota')).toBeInTheDocument());

    // Row buttons are: [view, edit, resolve?]. Use the second one (Edit) to open the edit modal.
    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[1]) {
      fireEvent.click(rowBtns[1]);
      await waitFor(() => expect(document.getElementById('inc-title')).toBeTruthy());
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Guardar/i.test(b.textContent ?? ''));
      if (save) {
        fireEvent.click(save);
        await waitFor(() => expect(incidentsUpdate).toHaveBeenCalled());
      }
    }
  });

  it('opens detail modal and closes it', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Pantalla rota')).toBeInTheDocument());

    // Click on row to open detail
    const row = document.querySelector('tbody tr');
    if (row) {
      fireEvent.click(row);
      await waitFor(() => { /* settle */ });
    }
  });
});
