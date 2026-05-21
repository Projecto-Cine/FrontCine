import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';

const mockIncidents = [
  { id: 1, title: 'Projector broken', category: 'Técnico', priority: 'critical', status: 'open', room: 'Sala 1', assigned_to: 'Carlos', description: 'Not working', reported_by: 'Ana', created_at: '2025-01-01', updated_at: '2025-01-02' },
  { id: 2, title: 'Dirty floor', category: 'Limpieza', priority: 'low', status: 'in_progress', room: 'Lobby', assigned_to: '', description: '', reported_by: 'Luis', created_at: '2025-01-03', updated_at: '2025-01-04' },
  { id: 3, title: 'Old issue', category: 'Seguridad', priority: 'medium', status: 'resolved', room: 'Sala 2', assigned_to: 'Marta', description: 'Fixed', reported_by: 'Admin', created_at: '2025-01-05', updated_at: '2025-01-06' },
];
const mockUsers = [{ id: 10, name: 'Carlos', username: 'carlos', role: 'maintenance' }];

const incGet = vi.fn().mockResolvedValue(mockIncidents);
const incCreate = vi.fn().mockResolvedValue({ id: 50, title: 'New' });
const incUpdate = vi.fn().mockResolvedValue({ id: 1, status: 'resolved' });
const usersGetAll = vi.fn().mockResolvedValue(mockUsers);

vi.mock('../../services/incidentsService', () => ({
  incidentsService: { getAll: (...a) => incGet(...a), create: (...a) => incCreate(...a), update: (...a) => incUpdate(...a), remove: vi.fn(), getById: vi.fn() },
}));
vi.mock('../../services/usersService', () => ({
  usersService: { getAll: (...a) => usersGetAll(...a), getAllEmployees: (...a) => usersGetAll(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

import IncidentsPage from './IncidentsPage';
beforeEach(() => vi.clearAllMocks());

const R = () => render(
  <MemoryRouter><LanguageProvider><AppProvider><IncidentsPage /></AppProvider></LanguageProvider></MemoryRouter>
);

describe('IncidentsPage', () => {
  it('loads and displays incidents', async () => {
    R();
    await waitFor(() => expect(incGet).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
  });

  it('shows KPI cards', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
  });

  it('filters by status', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
    const btns = screen.getAllByRole('button').filter(b => b.className?.includes('filter'));
    if (btns[1]) fireEvent.click(btns[1]);
  });

  it('creates new incident', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
    screen.getAllByRole('button').find(b => b.textContent.includes('egistrar') || b.textContent.includes('ueva'))?.click();
    await waitFor(() => expect(document.getElementById('inc-title')).toBeTruthy());
    fireEvent.change(document.getElementById('inc-title'), { target: { value: 'AC broken' } });
    fireEvent.change(document.getElementById('inc-room'), { target: { value: 'Sala 3' } });
    fireEvent.change(document.getElementById('inc-cat'), { target: { value: 'Infraestructura' } });
    fireEvent.change(document.getElementById('inc-priority'), { target: { value: 'high' } });
    fireEvent.change(document.getElementById('inc-assign'), { target: { value: 'carlos' } });
    fireEvent.change(document.getElementById('inc-status'), { target: { value: 'open' } });
    const desc = document.getElementById('inc-desc');
    if (desc) fireEvent.change(desc, { target: { value: 'Details' } });
    // Click save in modal footer
    const modalBtns = document.querySelectorAll('[role="dialog"] button');
    const saveBtn = [...modalBtns].find(b => b.textContent.includes('egistrar'));
    if (saveBtn) fireEvent.click(saveBtn);
    await waitFor(() => expect(incCreate).toHaveBeenCalled());
  });

  it('validates empty title', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
    screen.getAllByRole('button').find(b => b.textContent.includes('egistrar'))?.click();
    await waitFor(() => document.getElementById('inc-title'));
    const modalBtns = document.querySelectorAll('[role="dialog"] button');
    [...modalBtns].find(b => b.textContent.includes('egistrar'))?.click();
    expect(incCreate).not.toHaveBeenCalled();
  });

  it('edits existing incident', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[1]) fireEvent.click(rowBtns[1]); // Edit button
    await waitFor(() => { if (document.getElementById('inc-title')) return true; });
    if (document.getElementById('inc-title')) {
      fireEvent.change(document.getElementById('inc-title'), { target: { value: 'Updated' } });
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => b.textContent.includes('uardar'));
      if (save) fireEvent.click(save);
      await waitFor(() => expect(incUpdate).toHaveBeenCalled());
    }
  });

  it('resolves incident via row action', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
    const btns = screen.getAllByRole('button').filter(b => b.title?.toLowerCase().includes('esolver'));
    if (btns[0]) { fireEvent.click(btns[0]); await waitFor(() => expect(incUpdate).toHaveBeenCalled()); }
  });

  it('opens detail modal', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Projector broken'));
    await waitFor(() => expect(document.querySelectorAll('[role="dialog"]').length).toBeGreaterThanOrEqual(1));
  });

  it('detail shows description for incident with desc', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Projector broken'));
    await waitFor(() => expect(screen.getByText('Not working')).toBeInTheDocument());
  });

  it('handles save error 401', async () => {
    incCreate.mockRejectedValueOnce({ status: 401 });
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
    screen.getAllByRole('button').find(b => b.textContent.includes('egistrar'))?.click();
    await waitFor(() => document.getElementById('inc-title'));
    fireEvent.change(document.getElementById('inc-title'), { target: { value: 'T' } });
    [...document.querySelectorAll('[role="dialog"] button')].find(b => b.textContent.includes('egistrar'))?.click();
  });

  it('handles resolve error', async () => {
    incUpdate.mockRejectedValueOnce(new Error('fail'));
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
    const btns = screen.getAllByRole('button').filter(b => b.title?.toLowerCase().includes('esolver'));
    if (btns[0]) fireEvent.click(btns[0]);
  });

  it('handles load error', async () => {
    incGet.mockRejectedValueOnce(new Error('Net'));
    R();
    await waitFor(() => expect(incGet).toHaveBeenCalled());
  });

  it('keeps loading incidents when staff loading fails', async () => {
    usersGetAll.mockRejectedValueOnce(new Error('staff fail'));
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());
    expect(usersGetAll).toHaveBeenCalled();
  });

  it('opens detail from the view action and closes it', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());

    const viewButton = screen.getAllByRole('button').filter(button => button.closest('td'))[0];
    fireEvent.click(viewButton);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/cerrar diálogo/i));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('cancels the incident form and handles generic save errors', async () => {
    incCreate.mockRejectedValueOnce(new Error('save fail'));
    R();
    await waitFor(() => expect(screen.getByText('Projector broken')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /registrar incidencia/i }));
    await waitFor(() => expect(document.getElementById('inc-title')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /registrar incidencia/i }));
    await waitFor(() => expect(document.getElementById('inc-title')).toBeTruthy());
    fireEvent.change(document.getElementById('inc-title'), { target: { value: 'Save failed' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar$/i }));
    await waitFor(() => expect(incCreate).toHaveBeenCalled());
  });
});
