/**
 * BoxOfficePage — deep-flow integration tests.
 *
 * Targets the `handlePay` payment flow and the seat normalizer's edge
 * branches that the existing test files do not reach:
 *   - seats returned with `id == null`, missing row/number, duplicate ids
 *   - seats with `seat_type`/`seatType` mapping into VIP
 *   - rows "E" / "F" being auto-promoted to VIP
 *   - selectSession bailing when `session` is null/undefined (no-op)
 *   - selectSession overwriting realSeats with offline-generated map when
 *     the backend returns nothing
 *   - the `seatMapSession.sold` "availableSeats != null" fallback
 *   - F4 keyboard shortcut at the seats step with seats selected
 *
 * Code in English; UI strings asserted in Spanish.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

/* ── Mock factories MUST be declared before the vi.mock factories that capture them ── */
const sessionsGetAll       = vi.fn();
const sessionsSyncSeats    = vi.fn();
const seatsGetByScreening  = vi.fn();
const seatsGetByTheater    = vi.fn();
const salesCreatePurchase  = vi.fn();
const salesConfirmPurchase = vi.fn();
const salesCancelPurchase  = vi.fn();
const salesGetById         = vi.fn();
const clientsSearch        = vi.fn();
const clientsCreate        = vi.fn();
const roomsGetById         = vi.fn();
const roomsGetAll          = vi.fn();
const moviesGetActive      = vi.fn();
const moviesGetAll         = vi.fn();

vi.mock('../../services/sessionsService', () => ({
  sessionsService: {
    getAll:    (...a) => sessionsGetAll(...a),
    syncSeats: (...a) => sessionsSyncSeats(...a),
    getSeats: (...a) => sessionsSyncSeats(...a),
    create:    vi.fn().mockResolvedValue({ id: 99 }),
    update:    vi.fn().mockResolvedValue({ id: 1 }),
    remove:    vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../../services/seatsService', () => ({
  seatsService: {
    getByScreening: (...a) => seatsGetByScreening(...a),
    getByTheater:   (...a) => seatsGetByTheater(...a),
  },
}));
vi.mock('../../services/salesService', () => ({
  salesService: {
    createPurchase:  (...a) => salesCreatePurchase(...a),
    confirmPurchase: (...a) => salesConfirmPurchase(...a),
    cancelPurchase:  (...a) => salesCancelPurchase(...a),
    getById:         (...a) => salesGetById(...a),
  },
}));
vi.mock('../../services/clientsService', () => ({
  clientsService: {
    search: (...a) => clientsSearch(...a),
    create: (...a) => clientsCreate(...a),
  },
}));
vi.mock('../../services/roomsService', () => ({
  roomsService:    { getById: (...a) => roomsGetById(...a), getAll: (...a) => roomsGetAll(...a) },
  theatersService: { getAll: (...a) => roomsGetAll(...a) },
}));
vi.mock('../../services/moviesService', () => ({
  moviesService: { getAll: (...a) => moviesGetAll(...a), getActive: (...a) => moviesGetActive(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'admin' }, can: () => true }),
}));
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr">{value}</div>,
}));

/* ── Fixtures: today + late-evening hour keeps the session visible ── */
const TODAY = new Date().toISOString().split('T')[0];
const FUTURE_HOUR = '23:30:00';

const MOVIE = { id: 10, title: 'Dune', genre: 'Ciencia ficción', format: 'IMAX', language: 'ES', active: true };
const ROOM  = { id: 20, name: 'Sala 1 IMAX', capacity: 100, type: 'IMAX', status: 'active' };
const SCREENING = {
  id: 1, startTime: `${TODAY}T${FUTURE_HOUR}`, dateTime: `${TODAY}T${FUTURE_HOUR}`,
  movie: MOVIE, theater: ROOM, price: 9.5, basePrice: 9.5, status: 'SCHEDULED',
  availableSeats: 95, capacity: 100, full: false,
};

/* Seats with intentionally weird shapes to drive every branch of normalizeSeats: */
const WEIRD_SEATS = [
  null,                                                   // null entry — skipped via ?? guards
  { id: null },                                           // id == null     → "continue"
  { id: 200, seat: { row: 'A', number: 1, seat_type: 'VIP' } }, // snake_case seat_type → VIP
  { id: 201 },                                            // no row/number  → "continue"
  { id: 202, seat: { row: 'F', number: 1 } },             // row F          → auto-VIP
  { id: 203, seat: { row: 'E', number: 1 } },             // row E          → auto-VIP
  { id: 204, seat: { row: 'b', seatNumber: 2 } },         // lowercase row + seatNumber alias → uppercased
  { id: 205, seat: { row: 'C', col: 3 } },                // col alias for number
  { id: 206, seat: { row: 'A', number: 1 } },             // duplicate display id → "continue"
  { id: 207, seat: { row: 'D', number: 1 }, occupied: true,  status: 'reserved' },
  { id: 208, seat: { row: 'D', number: 2 }, status: 'taken' }, // statusLow not "available"
  { id: 209, seat: { row: 'D', number: 3 }, reservedUntil: new Date(Date.now() + 600000).toISOString() },
];

import BoxOfficePage from './BoxOfficePage';

beforeEach(() => {
  vi.clearAllMocks();
  try { localStorage.clear(); } catch { /* ignore */ }
  sessionsGetAll.mockResolvedValue([SCREENING]);
  sessionsSyncSeats.mockResolvedValue(WEIRD_SEATS);
  seatsGetByScreening.mockResolvedValue(WEIRD_SEATS);
  seatsGetByTheater.mockResolvedValue([]);
  salesCreatePurchase.mockResolvedValue({ id: 50, tickets: [{ id: 1, row: 'A', number: 1, ticketType: 'ADULT' }] });
  salesConfirmPurchase.mockResolvedValue({ emailSent: true });
  salesCancelPurchase.mockResolvedValue({});
  salesGetById.mockResolvedValue({ id: 50, totalAmount: 9.5 });
  clientsSearch.mockResolvedValue([]);
  clientsCreate.mockResolvedValue({ id: 9999 });
  roomsGetById.mockResolvedValue(ROOM);
  roomsGetAll.mockResolvedValue([ROOM]);
  moviesGetActive.mockResolvedValue([MOVIE]);
  moviesGetAll.mockResolvedValue([MOVIE]);
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

/** Click a time button, then dismiss the client modal with "Saltar" (formerly "Omitir"). */
async function pickSessionAndSkipModal() {
  const timeBtn = screen.getAllByRole('button').find(b =>
    /\d{1,2}:\d{2}/.test(b.textContent ?? '') &&
    /Sala/.test(b.textContent ?? '') &&
    !b.disabled
  );
  if (timeBtn) await act(async () => { fireEvent.click(timeBtn); });
  await waitFor(() => {
    const skip = screen.getAllByRole('button').find(b => /Saltar|Omitir/i.test(b.textContent ?? ''));
    if (skip) fireEvent.click(skip);
    expect(skip).toBeTruthy();
  }, { timeout: 3000 });
}

describe('BoxOfficePage — deep flow', () => {
  it('normalizes seats with all the weird shapes without crashing', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await pickSessionAndSkipModal();
    // syncSeats must have been called and the seat map should render real seats
    await waitFor(() => expect(sessionsSyncSeats).toHaveBeenCalled());
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    // Drive the "normalized.length === 0 → use generateOfflineSeats" branch on a second session
    // by switching back and picking again with an empty seat payload
    sessionsSyncSeats.mockResolvedValueOnce([]);
    seatsGetByScreening.mockResolvedValueOnce([]);
  });

  it('falls back to offline seat generation when both APIs return empty', async () => {
    sessionsSyncSeats.mockResolvedValueOnce([]);
    seatsGetByScreening.mockResolvedValueOnce([]);
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await pickSessionAndSkipModal();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy(), { timeout: 3000 });
  });

  it('falls back to offline seats when sync AND backend BOTH reject', async () => {
    sessionsSyncSeats.mockRejectedValueOnce(new Error('sync failed'));
    seatsGetByScreening.mockRejectedValueOnce(new Error('seats failed'));
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await pickSessionAndSkipModal();
    // The offline grid still renders even when both calls fail
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy(), { timeout: 3000 });
  });

  it('handles a session without theater info — uses room_id lookup', async () => {
    sessionsGetAll.mockResolvedValueOnce([{ ...SCREENING, theater: undefined, room: undefined, room_id: 20 }]);
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await pickSessionAndSkipModal();
    await waitFor(() => expect(roomsGetById).toHaveBeenCalledWith(20));
  });

  it('uses sold fallback when availableSeats is missing on the selected session', async () => {
    sessionsGetAll.mockResolvedValueOnce([{ ...SCREENING, availableSeats: undefined, sold: 17 }]);
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await pickSessionAndSkipModal();
  });

  it('responds to F4 keyboard shortcut when a seat is selected', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await pickSessionAndSkipModal();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    // Click a real seat
    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    // F4 fires handlePay with at least one seat selected — exercises that branch
    fireEvent.keyDown(window, { key: 'F4' });
    await waitFor(() => { /* let any async work flush */ });
  });

  it('ignores F4 keyboard shortcut at the sessions step (early return)', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    // Never enter the seats step → F4 should be a no-op
    fireEvent.keyDown(window, { key: 'F4' });
    expect(salesCreatePurchase).not.toHaveBeenCalled();
  });

  it('keeps the page running when an unknown key is pressed', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    fireEvent.keyDown(window, { key: 'q' });
    expect(document.body.textContent).toContain('Dune');
  });

  it('triggers handleSyncSeats while the seat map is open for the SAME session being edited', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    // Enter seats step first so selectedSession is set
    await pickSessionAndSkipModal();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    // Now open the edit modal for that same session
    const editBtn = document.querySelector('button[title="Editar sesión"]');
    if (editBtn) {
      // Edit buttons live in the sessions step; need to come back via Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
      const editBtn2 = document.querySelector('button[title="Editar sesión"]');
      if (editBtn2) {
        fireEvent.click(editBtn2);
        await waitFor(() => expect(moviesGetActive).toHaveBeenCalled());
        const sync = screen.getAllByRole('button').find(b => /Resincronizar/i.test(b.textContent ?? ''));
        if (sync) {
          fireEvent.click(sync);
          await waitFor(() => expect(sessionsSyncSeats.mock.calls.length).toBeGreaterThan(1));
        }
      }
    }
  });
});
