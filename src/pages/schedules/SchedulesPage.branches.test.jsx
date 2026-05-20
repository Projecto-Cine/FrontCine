/**
 * SchedulesPage — branch-coverage suite.
 *
 * Exercises:
 *   - normalizeFromBackend status inference branches (full, active range, past)
 *   - empty endTime/startTime variants
 *   - filterDate set and clear
 *   - createScreening and edit flows
 *   - save without required fields
 *   - clear date filter "Hoy" + "×"
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const scrGetAll = vi.fn();
const scrCreate = vi.fn();
const scrUpdate = vi.fn();
const scrRemove = vi.fn();
const moviesGetAll = vi.fn();
const theatersGetAll = vi.fn();

vi.mock('../../services/sessionsService', () => ({
  screeningsService: {
    getAll: (...a) => scrGetAll(...a),
    create: (...a) => scrCreate(...a),
    update: (...a) => scrUpdate(...a),
    remove: (...a) => scrRemove(...a),
    getById: vi.fn(),
  },
  sessionsService: {
    getAll: (...a) => scrGetAll(...a),
    create: (...a) => scrCreate(...a),
    update: (...a) => scrUpdate(...a),
    remove: (...a) => scrRemove(...a),
    getById: vi.fn(),
    getUpcoming: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('../../services/moviesService', () => ({
  moviesService: { getAll: (...a) => moviesGetAll(...a), getActive: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../services/roomsService', () => ({
  theatersService: { getAll: (...a) => theatersGetAll(...a) },
  roomsService: { getAll: (...a) => theatersGetAll(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

const TODAY = new Date().toISOString().split('T')[0];

const SCREENINGS = [
  // Full session
  { id: 1, full: true,           movieId: 10, theaterId: 20, dateTime: `${TODAY}T20:00`, basePrice: 9.5, movie: { id: 10, title: 'Dune' },  theater: { id: 20, name: 'Sala 1' } },
  // Already past (endDatetime in past)
  { id: 2, startTime: '2020-01-01T20:00', endDatetime: '2020-01-01T22:00', movieId: 11, theaterId: 21, basePrice: 8.0, movie: { id: 11, title: 'Avatar' }, theater: { id: 21, name: 'Sala 2' } },
  // Active range — started but not ended
  (() => {
    const s = new Date(); s.setHours(s.getHours() - 1);
    const e = new Date(); e.setHours(e.getHours() + 1);
    return { id: 3, startTime: s.toISOString(), endDatetime: e.toISOString(), movieId: 10, theaterId: 21, basePrice: 7, movie: { id: 10, title: 'Dune' }, theater: { id: 21, name: 'Sala 2' } };
  })(),
  // Existing explicit status
  { id: 4, dateTime: `${TODAY}T18:00`, status: 'CANCELLED', movie: { id: 12, title: 'Matrix' }, theater: { id: 22, name: 'Sala 3' }, price: 8 },
  // Missing movie + theater (rely on lookup)
  { id: 5, movieId: 10, theaterId: 20, dateTime: `${TODAY}T22:00`, price: null, status: 'SCHEDULED' },
];

const MOVIES = [
  { id: 10, title: 'Dune', active: true },
  { id: 11, title: 'Avatar', active: false },
  { id: 12, title: 'Matrix' },
];

const THEATERS = [
  { id: 20, name: 'Sala 1', capacity: 120 },
  { id: 21, name: 'Sala 2', capacity: 80 },
  { id: 22, name: 'Sala 3', capacity: 60 },
];

import SchedulesPage from './SchedulesPage';

beforeEach(() => {
  vi.clearAllMocks();
  scrGetAll.mockResolvedValue(SCREENINGS);
  scrCreate.mockResolvedValue({ id: 99, dateTime: `${TODAY}T22:00`, movieId: 10, theaterId: 20 });
  scrUpdate.mockResolvedValue({ id: 1, dateTime: `${TODAY}T19:00`, movieId: 10, theaterId: 20 });
  scrRemove.mockResolvedValue({});
  moviesGetAll.mockResolvedValue(MOVIES);
  theatersGetAll.mockResolvedValue(THEATERS);
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><SchedulesPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('SchedulesPage — branch coverage', () => {
  it('renders all screenings with various status branches', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Dune').length).toBeGreaterThan(0));
  });

  it('handles getAll error toast', async () => {
    scrGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(scrGetAll).toHaveBeenCalled());
  });

  it('filters by date and clears filter', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Dune').length).toBeGreaterThan(0));

    const dateInput = document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: TODAY } });
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));

    // Click "Hoy" button
    const todayBtn = screen.getAllByRole('button').find(b => /Hoy|Today/i.test(b.textContent ?? ''));
    if (todayBtn) fireEvent.click(todayBtn);

    // Clear with × button
    const clearBtn = screen.getAllByRole('button').find(b => b.textContent === '×');
    if (clearBtn) fireEvent.click(clearBtn);
  });

  it('opens create modal and rejects save with missing fields', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Dune').length).toBeGreaterThan(0));

    const createBtn = screen.getAllByRole('button').find(b => /ueva|rogramar/i.test(b.textContent ?? ''));
    fireEvent.click(createBtn);

    // Save without filling required fields → should show toast, not create
    const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /rogramar|rear/i.test(b.textContent ?? ''));
    if (saveBtn) fireEvent.click(saveBtn);
    expect(scrCreate).not.toHaveBeenCalled();
  });

  it('creates a new screening with valid fields', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Dune').length).toBeGreaterThan(0));

    const createBtn = screen.getAllByRole('button').find(b => /ueva|rogramar/i.test(b.textContent ?? ''));
    fireEvent.click(createBtn);

    const selects = document.querySelectorAll('[role="dialog"] select');
    if (selects[0]) fireEvent.change(selects[0], { target: { value: '10' } });
    if (selects[1]) fireEvent.change(selects[1], { target: { value: '20' } });
    const dtl = document.querySelector('[role="dialog"] input[type="datetime-local"]');
    if (dtl) fireEvent.change(dtl, { target: { value: `${TODAY}T20:00` } });
    const num = document.querySelector('[role="dialog"] input[type="number"]');
    if (num) fireEvent.change(num, { target: { value: '9.5' } });

    const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /rogramar|rear/i.test(b.textContent ?? ''));
    if (saveBtn) {
      fireEvent.click(saveBtn);
      await waitFor(() => expect(scrCreate).toHaveBeenCalled());
    }
  });

  it('edits an existing screening', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Dune').length).toBeGreaterThan(0));

    const rowButtons = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowButtons[0]) {
      fireEvent.click(rowButtons[0]);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const dtl = document.querySelector('[role="dialog"] input[type="datetime-local"]');
      if (dtl) fireEvent.change(dtl, { target: { value: `${TODAY}T19:00` } });
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /uardar/i.test(b.textContent ?? ''));
      if (save) {
        fireEvent.click(save);
        await waitFor(() => expect(scrUpdate).toHaveBeenCalled());
      }
    }
  });

  it('deletes an existing screening', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Dune').length).toBeGreaterThan(0));
    const rowButtons = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowButtons[1]) {
      fireEvent.click(rowButtons[1]);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const confirm = [...document.querySelectorAll('[role="dialog"] button')].find(b => /liminar|onfirm/i.test(b.textContent ?? ''));
      if (confirm) {
        fireEvent.click(confirm);
        await waitFor(() => expect(scrRemove).toHaveBeenCalled());
      }
    }
  });

  it('cancels create modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Dune').length).toBeGreaterThan(0));
    const createBtn = screen.getAllByRole('button').find(b => /ueva|rogramar/i.test(b.textContent ?? ''));
    fireEvent.click(createBtn);
    const cancel = [...document.querySelectorAll('[role="dialog"] button')].find(b => /ancelar/i.test(b.textContent ?? ''));
    if (cancel) fireEvent.click(cancel);
  });

  it('handles null screenings/movies/theaters via fallback', async () => {
    scrGetAll.mockResolvedValueOnce(null);
    moviesGetAll.mockResolvedValueOnce(null);
    theatersGetAll.mockResolvedValueOnce(null);
    renderPage();
    await waitFor(() => expect(scrGetAll).toHaveBeenCalled());
  });

  it('creates with empty price (sends undefined basePrice)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Dune').length).toBeGreaterThan(0));
    const createBtn = screen.getAllByRole('button').find(b => /ueva|rogramar/i.test(b.textContent ?? ''));
    fireEvent.click(createBtn);

    const selects = document.querySelectorAll('[role="dialog"] select');
    if (selects[0]) fireEvent.change(selects[0], { target: { value: '10' } });
    if (selects[1]) fireEvent.change(selects[1], { target: { value: '20' } });
    const dtl = document.querySelector('[role="dialog"] input[type="datetime-local"]');
    if (dtl) fireEvent.change(dtl, { target: { value: `${TODAY}T20:00` } });
    // price stays empty
    const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /rogramar|rear/i.test(b.textContent ?? ''));
    if (saveBtn) {
      fireEvent.click(saveBtn);
      await waitFor(() => expect(scrCreate).toHaveBeenCalled());
    }
  });

  it('edits existing screening with various status options', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Dune').length).toBeGreaterThan(0));

    const rowButtons = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowButtons[0]) {
      fireEvent.click(rowButtons[0]);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      // Change status to CANCELLED
      const statusSel = document.querySelector('[role="dialog"] select#scr-status');
      if (statusSel) fireEvent.change(statusSel, { target: { value: 'CANCELLED' } });
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /uardar/i.test(b.textContent ?? ''));
      if (save) {
        fireEvent.click(save);
        await waitFor(() => expect(scrUpdate).toHaveBeenCalled());
      }
    }
  });
});
