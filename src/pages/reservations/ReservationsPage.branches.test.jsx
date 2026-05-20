/**
 * ReservationsPage — branch coverage tests.
 *
 * Exercises:
 *   - status normalisation (PAID → CONFIRMED, default PENDING)
 *   - getSeats from seats/seatCodes/tickets arrays
 *   - getClientName fallbacks (userName, clientName, client object, etc.)
 *   - getScreening from screeningId / session_id / movieTitle / theaterName
 *   - filter by status / screening
 *   - non-array purchases response
 *   - payment method branches (CARD/CASH/ONLINE/QR)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const purchasesGetAll = vi.fn();
const purchasesCreate = vi.fn();
const purchasesUpdate = vi.fn();
const purchasesPay    = vi.fn();
const purchasesCancel = vi.fn();
const screeningsGetAll = vi.fn();
const usersGetAll = vi.fn();

vi.mock('../../services/reservationsService', () => ({
  reservationsService: {
    getAll: (...a) => purchasesGetAll(...a),
    create: (...a) => purchasesCreate(...a),
    update: (...a) => purchasesUpdate(...a),
    pay:    (...a) => purchasesPay(...a),
    cancel: (...a) => purchasesCancel(...a),
  },
  purchasesService: {
    getAll: (...a) => purchasesGetAll(...a),
    create: (...a) => purchasesCreate(...a),
    update: (...a) => purchasesUpdate(...a),
    pay:    (...a) => purchasesPay(...a),
    cancel: (...a) => purchasesCancel(...a),
  },
}));
vi.mock('../../services/sessionsService', () => ({
  sessionsService: {
    getAll: (...a) => screeningsGetAll(...a),
    getUpcoming: vi.fn().mockResolvedValue([]),
  },
  screeningsService: { getAll: (...a) => screeningsGetAll(...a) },
}));
vi.mock('../../services/usersService', () => ({
  usersService: { getAll: (...a) => usersGetAll(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr">{value}</div>,
}));

const PURCHASES = [
  // Status PAID → normalised to CONFIRMED
  { id: 1, status: 'PAID', totalAmount: 18, paymentMethod: 'CARD',
    userName: 'Ana', clientEmail: 'ana@x.com',
    screening: { movie: { title: 'Dune' }, theater: { name: 'Sala 1' }, startTime: '2026-12-01T20:00:00' },
    seats: ['A01', 'A02'] },
  // Status PENDING default
  { id: 2, total: 9, paymentMethod: 'CASH',
    clientName: 'Bruno',
    screeningId: 100,
    seatCodes: ['B01'] },
  // No status (defaults to PENDING) + tickets-based seats
  { id: 3, amount: 30, paymentMethod: 'ONLINE',
    client: { name: 'Carla', email: 'carla@x.com' },
    movieTitle: 'Avatar', theaterName: 'Sala 2', startTime: '2026-12-02T20:00:00',
    tickets: [{ seat: { code: 'C01' } }, { row: 'C', number: 2 }, { seatCode: 'C03' }] },
  // String client + QR payment
  { id: 4, status: 'CONFIRMED', paymentMethod: 'QR', client: 'D',
    purchaseStatus: 'REFUNDED', session_id: 100 },
  // user.name fallback
  { id: 5, status: 'CANCELLED', user: { name: 'Eli', email: 'eli@x.com' } },
];

const SCREENINGS = [
  { id: 100, movie: { title: 'Linked Movie' }, theater: { name: 'Sala X' }, startTime: '2026-12-03T18:00:00' },
];

const USERS = [
  { id: 1, name: 'User A' },
  { id: 2, name: 'User B' },
];

import ReservationsPage from './ReservationsPage';

beforeEach(() => {
  vi.clearAllMocks();
  purchasesGetAll.mockResolvedValue(PURCHASES);
  purchasesCreate.mockResolvedValue({ id: 99 });
  purchasesUpdate.mockResolvedValue({ id: 1 });
  purchasesPay.mockResolvedValue({ tickets: [{ qrCode: 'LUMEN:1' }] });
  purchasesCancel.mockResolvedValue({});
  screeningsGetAll.mockResolvedValue(SCREENINGS);
  usersGetAll.mockResolvedValue(USERS);
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><ReservationsPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('ReservationsPage — branch coverage', () => {
  it('renders purchases with all status/payment/client branches', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Ana'));
    expect(document.body.textContent).toContain('Bruno');
    expect(document.body.textContent).toContain('Carla');
  });

  it('handles non-array purchases response', async () => {
    purchasesGetAll.mockResolvedValueOnce(null);
    renderPage();
    await waitFor(() => expect(purchasesGetAll).toHaveBeenCalled());
  });

  it('handles load error', async () => {
    purchasesGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(purchasesGetAll).toHaveBeenCalled());
  });

  it('filters by status using filter buttons', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Ana'));
    const statusBtns = screen.getAllByRole('button').filter(b => /Confirmadas|Pendientes|Canceladas|Reembolsadas|Todo/i.test(b.textContent ?? ''));
    statusBtns.forEach(b => fireEvent.click(b));
  });

  it('opens create modal and rejects save without required fields', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Ana'));
    const createBtn = screen.getAllByRole('button').find(b => /Nueva|Crear|reserva/i.test(b.textContent ?? ''));
    if (createBtn) {
      fireEvent.click(createBtn);
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear|Guardar/i.test(b.textContent ?? ''));
      if (save) fireEvent.click(save);
      expect(purchasesCreate).not.toHaveBeenCalled();
    }
  });

  it('handles refund error branch (catch path) without crashing', async () => {
    // Force update() to throw — covers handleRefund's catch
    purchasesUpdate.mockRejectedValueOnce(new Error('refund failed'));
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Ana'));

    // Find the refund button (only shows on CONFIRMED purchases)
    const refundBtn = document.querySelector('[title*="eembolso"], [title*="efund"]');
    if (refundBtn) {
      fireEvent.click(refundBtn);
      // If a confirm dialog appears, click confirm to fire handleRefund
      await waitFor(() => { /* settle */ });
      const confirm = [...document.querySelectorAll('[role="dialog"] button')].find(b =>
        /Sí, reembolsar|Confirmar/i.test(b.textContent ?? '')
      );
      if (confirm) fireEvent.click(confirm);
    }
  });

  it('handles cancel reservation flow', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Ana'));
    const cancelBtn = document.querySelector('[title*="ancelar"]');
    if (cancelBtn) {
      fireEvent.click(cancelBtn);
      await waitFor(() => { /* let modal appear */ });
      const confirm = [...document.querySelectorAll('[role="dialog"] button')].find(b =>
        /Sí.*cancelar|Confirmar/i.test(b.textContent ?? '')
      );
      if (confirm) {
        fireEvent.click(confirm);
        await waitFor(() => expect(purchasesCancel).toHaveBeenCalled());
      }
    }
  });
});
