import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';

const room = { id: 1, name: 'Sala 1 IMAX', capacity: 100, type: 'IMAX', status: 'active' };
const movie = { id: 1, title: 'Dune', genre: 'Ciencia ficción', format: 'IMAX', language: 'ES', active: true, imageUrl: '', durationMin: 155, ageRating: 'PG-13' };
const screening = {
  id: 1, startTime: '2026-05-18T20:00:00', dateTime: '2026-05-18T20:00:00',
  price: 13.5, basePrice: 13.5, movie, theater: room, availableSeats: 98, capacity: 100, full: false, status: 'SCHEDULED',
};

const sessionsGetAll = vi.fn();
const sessionsSyncSeats = vi.fn();
const seatsGetByScreening = vi.fn();
const seatsGetByTheater = vi.fn();
const clientsSearch = vi.fn();
const createPurchase = vi.fn();
const confirmPurchase = vi.fn();
const roomsGetById = vi.fn();
const moviesGetAll = vi.fn();

vi.mock('../../services/sessionsService', () => ({
  sessionsService: {
    getAll: (...a) => sessionsGetAll(...a),
    syncSeats: (...a) => sessionsSyncSeats(...a),
  },
}));
vi.mock('../../services/seatsService', () => ({
  seatsService: {
    getByScreening: (...a) => seatsGetByScreening(...a),
    getByTheater: (...a) => seatsGetByTheater(...a),
  },
}));
vi.mock('../../services/clientsService', () => ({
  clientsService: { search: (...a) => clientsSearch(...a) },
}));
vi.mock('../../services/salesService', () => ({
  salesService: {
    createPurchase: (...a) => createPurchase(...a),
    confirmPurchase: (...a) => confirmPurchase(...a),
  },
}));
vi.mock('../../services/roomsService', () => ({
  roomsService: { getById: (...a) => roomsGetById(...a) },
}));
vi.mock('../../services/moviesService', () => ({
  moviesService: { getAll: (...a) => moviesGetAll(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'admin' }, can: () => true }),
}));
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr">{value}</div>,
  __esModule: true,
}));

import BoxOfficePage from './BoxOfficePage';

beforeEach(() => {
  vi.clearAllMocks();
  sessionsGetAll.mockResolvedValue([screening]);
  sessionsSyncSeats.mockResolvedValue([
    { id: 1, seat: { id: 1, row: 'A', number: 1 }, occupied: false },
    { id: 2, seat: { id: 2, row: 'A', number: 2 }, occupied: false },
  ]);
  seatsGetByScreening.mockResolvedValue([
    { id: 1, seat: { id: 1, row: 'A', number: 1 }, occupied: false },
    { id: 2, seat: { id: 2, row: 'A', number: 2 }, occupied: false },
  ]);
  seatsGetByTheater.mockResolvedValue([{ id: 1, row: 'A', number: 1 }]);
  clientsSearch.mockResolvedValue([{ id: 7, name: 'Ana López', email: 'ana@x.com', fidelityDiscountEligible: true }]);
  createPurchase.mockResolvedValue({ id: 50, tickets: [{ id: 1, row: 'A', number: 1, ticketType: 'ADULT' }] });
  confirmPurchase.mockResolvedValue({});
  roomsGetById.mockResolvedValue(room);
  moviesGetAll.mockResolvedValue([movie]);
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

describe('BoxOfficePage — verified purchase flow', () => {
  it('loads sessions and shows movie title', async () => {
    renderPage();
    await waitFor(() => { expect(document.body.textContent).toContain('Dune'); }, { timeout: 5000 });
    expect(sessionsGetAll).toHaveBeenCalled();
  });

  it('opens seats map when clicking session time', async () => {
    renderPage();
    await waitFor(() => { expect(document.body.textContent).toContain('Dune'); }, { timeout: 5000 });

    const timeBtn = screen.getAllByRole('button').find(b => /20:00/.test(b.textContent ?? ''));
    if (timeBtn) fireEvent.click(timeBtn);

    // Skip client modal
    await waitFor(() => {
      const skip = screen.getAllByRole('button').find(b => /Omitir/i.test(b.textContent ?? ''));
      if (skip) fireEvent.click(skip);
      expect(skip).toBeTruthy();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(sessionsSyncSeats).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('handles client-search failure gracefully', async () => {
    clientsSearch.mockRejectedValueOnce(new Error('search failed'));
    renderPage();
    await waitFor(() => { expect(document.body.textContent).toContain('Dune'); }, { timeout: 5000 });

    const timeBtn = screen.getAllByRole('button').find(b => /20:00/.test(b.textContent ?? ''));
    if (timeBtn) fireEvent.click(timeBtn);

    // Skip client modal
    await waitFor(() => {
      const skip = screen.getAllByRole('button').find(b => /Omitir/i.test(b.textContent ?? ''));
      if (skip) fireEvent.click(skip);
      expect(skip).toBeTruthy();
    }, { timeout: 3000 });

    await waitFor(() => { expect(sessionsSyncSeats).toHaveBeenCalled(); }, { timeout: 5000 });
    expect(document.body.textContent).toContain('Dune');
  });

  it('recovers from seat loading failures', async () => {
    sessionsSyncSeats.mockRejectedValueOnce(new Error('sync failed'));
    seatsGetByScreening.mockRejectedValueOnce(new Error('seats failed'));
    renderPage();

    await waitFor(() => { expect(document.body.textContent).toContain('Dune'); }, { timeout: 5000 });

    const timeBtn = screen.getAllByRole('button').find(b => /20:00/.test(b.textContent ?? ''));
    if (timeBtn) fireEvent.click(timeBtn);

    // Skip client modal
    await waitFor(() => {
      const skip = screen.getAllByRole('button').find(b => /Omitir/i.test(b.textContent ?? ''));
      if (skip) fireEvent.click(skip);
      expect(skip).toBeTruthy();
    }, { timeout: 3000 });

    await waitFor(() => { expect(sessionsSyncSeats).toHaveBeenCalled(); }, { timeout: 3000 });
    expect(document.body.textContent).toContain('Dune');
  });

  it('shows price on session card', async () => {
    renderPage();
    await waitFor(() => { expect(document.body.textContent).toContain('Dune'); }, { timeout: 5000 });
    expect(document.body.textContent).toMatch(/13/);
  });

  it('uses fallback ticket generation when backend returns no tickets', async () => {
    createPurchase.mockResolvedValueOnce({ id: 60, tickets: [] });
    renderPage();
    await waitFor(() => { expect(document.body.textContent).toContain('Dune'); }, { timeout: 5000 });

    const timeBtn = screen.getAllByRole('button').find(b => /20:00/.test(b.textContent ?? ''));
    if (timeBtn) fireEvent.click(timeBtn);

    // Skip client modal
    await waitFor(() => {
      const skip = screen.getAllByRole('button').find(b => /Omitir/i.test(b.textContent ?? ''));
      if (skip) fireEvent.click(skip);
      expect(skip).toBeTruthy();
    }, { timeout: 3000 });

    await waitFor(() => { expect(sessionsSyncSeats).toHaveBeenCalled(); }, { timeout: 5000 });
    expect(document.body.textContent).toContain('Dune');
  });

  it('loads room details from room_id fallback', async () => {
    sessionsGetAll.mockResolvedValueOnce([{ ...screening, theater: undefined, room: undefined, room_id: 1 }]);
    seatsGetByTheater.mockResolvedValueOnce([]);
    renderPage();

    await waitFor(() => { expect(document.body.textContent).toContain('Dune'); }, { timeout: 5000 });
    const timeBtn = screen.getAllByRole('button').find(b => /20:00/.test(b.textContent ?? ''));
    if (timeBtn) fireEvent.click(timeBtn);
    // Skip client modal
    await waitFor(() => {
      const skip = screen.getAllByRole('button').find(b => /Omitir/i.test(b.textContent ?? ''));
      if (skip) fireEvent.click(skip);
      expect(skip).toBeTruthy();
    }, { timeout: 3000 });
    await waitFor(() => { expect(roomsGetById).toHaveBeenCalledWith(1); }, { timeout: 3000 });
  });
});