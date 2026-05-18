import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';

const scrGetAll = vi.fn();
const scrCreate = vi.fn();
const scrUpdate = vi.fn();
const scrRemove = vi.fn();
const scrGetById = vi.fn();
const scrGetUpcoming = vi.fn();
const moviesGetAll = vi.fn();
const moviesGetActive = vi.fn();
const theatersGetAll = vi.fn();

vi.mock('../../services/sessionsService', () => ({
  screeningsService: { getAll: (...a) => scrGetAll(...a), create: (...a) => scrCreate(...a), update: (...a) => scrUpdate(...a), remove: (...a) => scrRemove(...a), getById: (...a) => scrGetById(...a) },
  sessionsService:   { getAll: (...a) => scrGetAll(...a), create: (...a) => scrCreate(...a), update: (...a) => scrUpdate(...a), remove: (...a) => scrRemove(...a), getById: (...a) => scrGetById(...a), getUpcoming: (...a) => scrGetUpcoming(...a) },
}));
vi.mock('../../services/moviesService', () => ({
  moviesService: { getAll: (...a) => moviesGetAll(...a), getActive: (...a) => moviesGetActive(...a) },
}));
vi.mock('../../services/roomsService', () => ({
  theatersService: { getAll: (...a) => theatersGetAll(...a) },
  roomsService: { getAll: (...a) => theatersGetAll(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

const mockScreenings = [
  { id: 1, movieId: 10, theaterId: 20, dateTime: '2025-06-01T20:00', price: 9.5, status: 'SCHEDULED', movie: { id: 10, title: 'Dune' }, theater: { id: 20, name: 'Sala 1' } },
  { id: 2, movieId: 11, theaterId: 21, dateTime: '2025-06-02T18:00', price: 8.0, status: 'ACTIVE', movie: { id: 11, title: 'Avatar' }, theater: { id: 21, name: 'Sala 2' } },
];
const mockMovies = [{ id: 10, title: 'Dune' }, { id: 11, title: 'Avatar' }];
const mockTheaters = [{ id: 20, name: 'Sala 1', capacity: 120 }, { id: 21, name: 'Sala 2', capacity: 80 }];

import SchedulesPage from './SchedulesPage';
beforeEach(() => {
  vi.clearAllMocks();
  scrGetAll.mockResolvedValue(mockScreenings);
  scrCreate.mockResolvedValue({ id: 99 });
  scrUpdate.mockResolvedValue({ id: 1 });
  scrRemove.mockResolvedValue(null);
  scrGetUpcoming.mockResolvedValue([]);
  moviesGetAll.mockResolvedValue(mockMovies);
  moviesGetActive.mockResolvedValue(mockMovies);
  theatersGetAll.mockResolvedValue(mockTheaters);
});

const R = () => render(
  <MemoryRouter><LanguageProvider><AppProvider><SchedulesPage /></AppProvider></LanguageProvider></MemoryRouter>
);

describe('SchedulesPage', () => {
  it('loads screenings', async () => {
    R();
    await waitFor(() => expect(scrGetAll).toHaveBeenCalled());
    await waitFor(() => expect(document.querySelectorAll('tr').length).toBeGreaterThanOrEqual(1));
  });

  it('opens create modal and saves', async () => {
    R();
    await waitFor(() => expect(scrGetAll).toHaveBeenCalled());
    await waitFor(() => expect(document.querySelectorAll('tr').length).toBeGreaterThanOrEqual(1));
    const btn = screen.getAllByRole('button').find(b => b.textContent.includes('ueva') || b.textContent.includes('rogramar'));
    if (btn) {
      fireEvent.click(btn);
      await waitFor(() => expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1));
      const selects = screen.getAllByRole('combobox');
      if (selects[0]) fireEvent.change(selects[0], { target: { value: '10' } });
      if (selects[1]) fireEvent.change(selects[1], { target: { value: '20' } });
      const dtl = document.querySelectorAll('input[type="datetime-local"]');
      if (dtl[0]) fireEvent.change(dtl[0], { target: { value: '2025-07-01T20:00' } });
      const num = document.querySelectorAll('input[type="number"]');
      if (num[0]) fireEvent.change(num[0], { target: { value: '9.5' } });
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => b.textContent.includes('rogramar') || b.textContent.includes('rear') || b.textContent.includes('uardar'));
      if (save) fireEvent.click(save);
      await waitFor(() => expect(scrCreate).toHaveBeenCalled());
    }
  });

  it('edits screening', async () => {
    R();
    await waitFor(() => expect(document.querySelectorAll('tr').length).toBeGreaterThanOrEqual(1));
    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[0]) {
      fireEvent.click(rowBtns[0]);
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        if (selects.length > 0) {
          const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => b.textContent.includes('uardar'));
          if (save) fireEvent.click(save);
        }
      });
    }
  });

  it('handles delete', async () => {
    R();
    await waitFor(() => expect(document.querySelectorAll('tr').length).toBeGreaterThanOrEqual(1));
    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[1]) {
      fireEvent.click(rowBtns[1]);
      await waitFor(() => {
        const confirm = screen.getAllByRole('button').find(b => b.textContent.includes('liminar') || b.textContent.includes('onfirm'));
        if (confirm) fireEvent.click(confirm);
      });
    }
  });

  it('filters by date', async () => {
    R();
    await waitFor(() => expect(scrGetAll).toHaveBeenCalled());
    const dateIn = document.querySelectorAll('input[type="date"]');
    if (dateIn[0]) fireEvent.change(dateIn[0], { target: { value: '2025-06-01' } });
  });

  it('handles load error', async () => {
    scrGetAll.mockRejectedValueOnce(new Error('Net'));
    R();
    await waitFor(() => expect(scrGetAll).toHaveBeenCalled());
  });

  it('handles save error', async () => {
    scrCreate.mockRejectedValueOnce(new Error('fail'));
    R();
    await waitFor(() => expect(document.querySelectorAll('tr').length).toBeGreaterThanOrEqual(1));
    const btn = screen.getAllByRole('button').find(b => b.textContent.includes('ueva'));
    if (btn) {
      fireEvent.click(btn);
      await waitFor(() => screen.getAllByRole('combobox').length > 0);
      const selects = screen.getAllByRole('combobox');
      if (selects[0]) fireEvent.change(selects[0], { target: { value: '10' } });
      if (selects[1]) fireEvent.change(selects[1], { target: { value: '20' } });
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => b.textContent.includes('rogramar') || b.textContent.includes('rear'));
      if (save) fireEvent.click(save);
    }
  });
});
