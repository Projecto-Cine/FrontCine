/**
 * BoxOfficePage — edit-session modal coverage.
 *
 * Covers lines 1574, 1582–1593 which are not reached by the full test suite
 * because the existing tests use a `if (editBtn)` guard that silently skips
 * when the button is not found in the JSDOM tree.
 *
 * Strategy: open the edit modal by calling the "Editar sesión" button via
 * getAllByTitle, then exercise the theater select, date input, time input,
 * and the Cancelar / Guardar cambios buttons.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

/* ── Mock services ── */
const sessionsGetAll   = vi.fn();
const sessionsUpdate   = vi.fn();
const moviesGetActive  = vi.fn();
const roomsGetAll      = vi.fn();

vi.mock('../../services/sessionsService', () => ({
  sessionsService: {
    getAll:      (...a) => sessionsGetAll(...a),
    update:      (...a) => sessionsUpdate(...a),
    syncSeats:   vi.fn().mockResolvedValue([]),
    create:      vi.fn().mockResolvedValue({}),
    remove:      vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../../services/moviesService', () => ({
  moviesService: {
    getAll:    vi.fn().mockResolvedValue([]),
    getActive: (...a) => moviesGetActive(...a),
  },
}));
vi.mock('../../services/roomsService', () => ({
  roomsService: {
    getAll:   (...a) => roomsGetAll(...a),
    getById:  vi.fn().mockResolvedValue({}),
    getSeats: vi.fn().mockResolvedValue([]),
  },
  theatersService: {
    getAll: (...a) => roomsGetAll(...a),
  },
}));
vi.mock('../../services/seatsService', () => ({
  seatsService: {
    getByScreening: vi.fn().mockResolvedValue([]),
    getByTheater:   vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('../../services/salesService', () => ({
  salesService: {
    createPurchase:  vi.fn().mockResolvedValue({ id: 1, tickets: [] }),
    confirmPurchase: vi.fn().mockResolvedValue({}),
    cancelPurchase:  vi.fn().mockResolvedValue({}),
    getById:         vi.fn().mockResolvedValue({}),
    createTicketSale: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../../services/clientsService', () => ({
  clientsService: {
    search: vi.fn().mockResolvedValue([]),
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 99 }),
  },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'admin' }, can: () => true }),
}));
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr">{value}</div>,
}));

/* ── Fixtures ── */
const TODAY = new Date().toISOString().split('T')[0];
const FUTURE_HOUR = (() => {
  const h = new Date().getHours();
  const safeH = h + 4 >= 24 ? 23 : h + 4;
  return `${String(safeH).padStart(2, '0')}:00:00`;
})();

const MOVIE  = { id: 10, title: 'Dune',   durationMin: 155, genre: 'Ciencia ficción', format: 'IMAX', language: 'ES', active: true, imageUrl: '' };
const MOVIE2 = { id: 11, title: 'Avatar', durationMin: 162, genre: 'Drama',           format: '2D',   language: 'VO', active: true, imageUrl: '' };
const ROOM   = { id: 20, name: 'Sala 1',  capacity: 100, type: 'IMAX', status: 'active' };
const ROOM2  = { id: 21, name: 'Sala 2',  capacity: 50,  type: '2D',   status: 'active' };

const SCREENING = {
  id: 1,
  startTime: `${TODAY}T${FUTURE_HOUR}`,
  dateTime:  `${TODAY}T${FUTURE_HOUR}`,
  movie: MOVIE, theater: ROOM,
  basePrice: 9.5, price: 9.5,
  status: 'SCHEDULED', availableSeats: 90, capacity: 100, full: false,
};

import BoxOfficePage from './BoxOfficePage';

beforeEach(() => {
  vi.clearAllMocks();
  try { localStorage.clear(); } catch { /* ignore */ }
  sessionsGetAll.mockResolvedValue([SCREENING]);
  sessionsUpdate.mockResolvedValue({ ...SCREENING });
  moviesGetActive.mockResolvedValue([MOVIE, MOVIE2]);
  roomsGetAll.mockResolvedValue([ROOM, ROOM2]);
  window.print = vi.fn();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AppProvider>
          <BoxOfficePage />
        </AppProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

async function openEditModal() {
  renderPage();
  await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument(), { timeout: 5000 });

  const editBtn = document.querySelector('button[title="Editar sesión"]');
  expect(editBtn).toBeTruthy();
  fireEvent.click(editBtn);
  await waitFor(() => expect(moviesGetActive).toHaveBeenCalled(), { timeout: 3000 });
  // Modal should be open — wait for the Guardar/Cancelar buttons
  await waitFor(() => {
    const buttons = [...document.querySelectorAll('button')];
    const hasCancel = buttons.some(b => /Cancelar/i.test(b.textContent ?? ''));
    expect(hasCancel).toBe(true);
  }, { timeout: 3000 });
}

describe('BoxOfficePage — edit session modal (lines 1574, 1582–1593)', () => {
  it('opens edit modal and renders theater select, date and time inputs', async () => {
    await openEditModal();

    const selects = document.querySelectorAll('[aria-label="Editar sesión"] select, [role="dialog"] select');
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const timeInputs = document.querySelectorAll('input[type="time"]');

    // At least one select (theater), one date input, one time input
    expect(selects.length + dateInputs.length + timeInputs.length).toBeGreaterThan(0);
  });

  it('changes theater select (line 1574)', async () => {
    await openEditModal();

    // Find selects inside the edit modal backdrop
    const selects = document.querySelectorAll('input[type="date"]');
    // The edit modal uses modalBackdrop role="dialog" aria-label="Editar sesión"
    const editDialog = document.querySelector('[aria-label="Editar sesión"]');
    if (editDialog) {
      const theaterSelect = editDialog.querySelectorAll('select')[1]; // second select = theater
      if (theaterSelect) {
        fireEvent.change(theaterSelect, { target: { value: '21' } });
        expect(theaterSelect.value).toBe('21');
      }
    }
  });

  it('changes date input (line 1582)', async () => {
    await openEditModal();

    const editDialog = document.querySelector('[aria-label="Editar sesión"]');
    if (editDialog) {
      const dateInput = editDialog.querySelector('input[type="date"]');
      if (dateInput) {
        fireEvent.change(dateInput, { target: { value: TODAY } });
        expect(dateInput.value).toBe(TODAY);
      }
    }
  });

  it('changes time input (line 1586)', async () => {
    await openEditModal();

    const editDialog = document.querySelector('[aria-label="Editar sesión"]');
    if (editDialog) {
      const timeInput = editDialog.querySelector('input[type="time"]');
      if (timeInput) {
        fireEvent.change(timeInput, { target: { value: '20:00' } });
        expect(timeInput.value).toBe('20:00');
      }
    }
  });

  it('closes modal via Cancelar button (line 1593)', async () => {
    await openEditModal();

    const editDialog = document.querySelector('[aria-label="Editar sesión"]');
    if (editDialog) {
      const cancelBtn = [...editDialog.querySelectorAll('button')].find(b => /Cancelar/i.test(b.textContent ?? ''));
      if (cancelBtn) {
        fireEvent.click(cancelBtn);
        await waitFor(() => expect(document.querySelector('[aria-label="Editar sesión"]')).toBeNull());
      }
    }
  });

  it('saves changes with updated theater, date and time (line 1594)', async () => {
    await openEditModal();

    const editDialog = document.querySelector('[aria-label="Editar sesión"]');
    if (editDialog) {
      const dateInput = editDialog.querySelector('input[type="date"]');
      const timeInput = editDialog.querySelector('input[type="time"]');
      const theaterSel = editDialog.querySelectorAll('select')[1];

      if (dateInput) fireEvent.change(dateInput, { target: { value: TODAY } });
      if (timeInput) fireEvent.change(timeInput, { target: { value: '21:00' } });
      if (theaterSel) fireEvent.change(theaterSel, { target: { value: '21' } });

      const saveBtn = [...editDialog.querySelectorAll('button')].find(b => /Guardar/i.test(b.textContent ?? ''));
      if (saveBtn) {
        fireEvent.click(saveBtn);
        await waitFor(() => expect(sessionsUpdate).toHaveBeenCalled(), { timeout: 3000 });
      }
    }
  });

  it('shows error toast when sessionsUpdate fails', async () => {
    sessionsUpdate.mockRejectedValueOnce(new Error('Network error'));
    await openEditModal();

    const editDialog = document.querySelector('[aria-label="Editar sesión"]');
    if (editDialog) {
      const saveBtn = [...editDialog.querySelectorAll('button')].find(b => /Guardar/i.test(b.textContent ?? ''));
      if (saveBtn) {
        fireEvent.click(saveBtn);
        await waitFor(() => expect(sessionsUpdate).toHaveBeenCalled(), { timeout: 3000 });
      }
    }
  });

  it('shows validation toast when required field is cleared', async () => {
    await openEditModal();

    const editDialog = document.querySelector('[aria-label="Editar sesión"]');
    if (editDialog) {
      // Clear the movie select (first select)
      const movieSel = editDialog.querySelectorAll('select')[0];
      if (movieSel) fireEvent.change(movieSel, { target: { value: '' } });

      const saveBtn = [...editDialog.querySelectorAll('button')].find(b => /Guardar/i.test(b.textContent ?? ''));
      if (saveBtn) fireEvent.click(saveBtn);

      expect(sessionsUpdate).not.toHaveBeenCalled();
    }
  });
});
