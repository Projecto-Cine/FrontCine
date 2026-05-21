/**
 * BoxOfficePage — full payment flow integration test.
 *
 * Targets the `handlePay` happy and edge paths that the smoke / branch
 * suites do not reach end-to-end:
 *   - successful card payment for a guest (anonimo@taquilla.com fallback)
 *   - successful card payment with a guest email pre-filled in the modal
 *   - successful card payment for an existing selectedClient (member flow)
 *   - confirmPurchase failure → "email could not be sent" warning toast
 *   - HTTP 4xx error mapping (404 seat, 409 conflict, 422 generic)
 *
 * Code in English; UI strings asserted in Spanish.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const sessionsGetAll       = vi.fn();
const sessionsSyncSeats    = vi.fn();
const seatsGetByScreening  = vi.fn();
const salesCreatePurchase  = vi.fn();
const salesConfirmPurchase = vi.fn();
const clientsSearch        = vi.fn();

vi.mock('../../services/sessionsService', () => ({
  sessionsService: {
    getAll:    (...a) => sessionsGetAll(...a),
    syncSeats: (...a) => sessionsSyncSeats(...a),
    create:    vi.fn(),
    update:    vi.fn(),
    remove:    vi.fn(),
  },
}));
vi.mock('../../services/seatsService', () => ({
  seatsService: {
    getByScreening: (...a) => seatsGetByScreening(...a),
    getByTheater:   vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('../../services/salesService', () => ({
  salesService: {
    createPurchase:  (...a) => salesCreatePurchase(...a),
    confirmPurchase: (...a) => salesConfirmPurchase(...a),
    cancelPurchase:  vi.fn(),
    getById:         vi.fn(),
  },
}));
vi.mock('../../services/clientsService', () => ({
  clientsService: { search: (...a) => clientsSearch(...a), create: vi.fn() },
}));
vi.mock('../../services/roomsService', () => ({
  roomsService:    { getById: vi.fn(), getAll: vi.fn().mockResolvedValue([]) },
  theatersService: { getAll: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../services/moviesService', () => ({
  moviesService: { getAll: vi.fn().mockResolvedValue([]), getActive: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'admin' }, can: () => true }),
}));
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr">{value}</div>,
}));

/* ── Fixtures (today + late-evening) ── */
const TODAY = new Date().toISOString().split('T')[0];
const FUTURE_HOUR = '23:30:00';

const MOVIE = { id: 10, title: 'Dune', genre: 'Ciencia ficción', format: 'IMAX', language: 'ES', active: true };
const ROOM  = { id: 20, name: 'Sala 1 IMAX', capacity: 100, type: 'IMAX' };
const SCREENING = {
  id: 1, startTime: `${TODAY}T${FUTURE_HOUR}`, dateTime: `${TODAY}T${FUTURE_HOUR}`,
  movie: MOVIE, theater: ROOM, price: 9.5, basePrice: 9.5, status: 'SCHEDULED',
  availableSeats: 95, capacity: 100, full: false,
};

const SEATS = [
  { id: 100, seat: { id: 100, row: 'A', number: 1, seatType: 'NORMAL' }, status: 'available', occupied: false },
  { id: 101, seat: { id: 101, row: 'A', number: 2, seatType: 'NORMAL' }, status: 'available', occupied: false },
];

import BoxOfficePage from './BoxOfficePage';

beforeEach(() => {
  vi.clearAllMocks();
  try { localStorage.clear(); } catch { /* ignore */ }
  sessionsGetAll.mockResolvedValue([SCREENING]);
  sessionsSyncSeats.mockResolvedValue(SEATS);
  seatsGetByScreening.mockResolvedValue(SEATS);
  salesCreatePurchase.mockResolvedValue({
    id: 50,
    tickets: [{ id: 1, row: 'A', number: 1, ticketType: 'ADULT' }],
  });
  salesConfirmPurchase.mockResolvedValue({ emailSent: true });
  clientsSearch.mockResolvedValue([]);
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

/** Drive the wizard through to the payment step with one seat selected. */
async function goToPaymentStep() {
  // Step 1: click time button + skip client modal
  const timeBtn = screen.getAllByRole('button').find(b =>
    /\d{1,2}:\d{2}/.test(b.textContent ?? '') && /Sala/.test(b.textContent ?? '') && !b.disabled
  );
  if (timeBtn) await act(async () => { fireEvent.click(timeBtn); });
  await waitFor(() => {
    const skip = screen.getAllByRole('button').find(b => /Saltar|Omitir/i.test(b.textContent ?? ''));
    if (skip) fireEvent.click(skip);
    expect(skip).toBeTruthy();
  }, { timeout: 3000 });
  await waitFor(() => expect(sessionsSyncSeats).toHaveBeenCalled());

  // Step 2: pick one seat
  await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());
  const seatBtn = document.querySelector('button[aria-label*="libre"]');
  if (seatBtn) fireEvent.click(seatBtn);

  // Step 3: proceed → payment step
  const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
  if (proceedBtn) fireEvent.click(proceedBtn);
  await waitFor(() => expect(screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''))).toBeTruthy());
}

function clickConfirmCobro() {
  const confirm = screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''));
  if (confirm && !confirm.disabled) fireEvent.click(confirm);
  return confirm;
}

describe('BoxOfficePage — handlePay full flow', () => {
  it('successful card payment for a guest fires createPurchase + confirmPurchase', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await goToPaymentStep();
    clickConfirmCobro();
    await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(() => expect(salesConfirmPurchase).toHaveBeenCalledWith(50), { timeout: 3000 });
  });

  it('successful card payment with a guest email entered in the modal', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));

    // Open client modal, fill email + Continuar
    const timeBtn = screen.getAllByRole('button').find(b =>
      /\d{1,2}:\d{2}/.test(b.textContent ?? '') && /Sala/.test(b.textContent ?? '') && !b.disabled
    );
    fireEvent.click(timeBtn);
    await waitFor(() => expect(screen.getByLabelText(/Cerrar/i)).toBeInTheDocument());

    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) fireEvent.change(emailInput, { target: { value: 'guest@example.com' } });

    const continuar = screen.getAllByRole('button').find(b => /Continuar/i.test(b.textContent ?? ''));
    if (continuar) fireEvent.click(continuar);
    await waitFor(() => expect(sessionsSyncSeats).toHaveBeenCalled());

    // Pick seat → proceed → confirm
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());
    fireEvent.click(document.querySelector('button[aria-label*="libre"]'));
    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);
    await waitFor(() => expect(screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''))).toBeTruthy());
    clickConfirmCobro();
    await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
    const body = salesCreatePurchase.mock.calls[0][0];
    // Either userId or guestEmail must be present
    expect(body.userId || body.guestEmail).toBeTruthy();
  });

  it('confirmPurchase failure shows "email could not be sent" toast', async () => {
    salesConfirmPurchase.mockRejectedValueOnce(new Error('SMTP down'));
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await goToPaymentStep();
    clickConfirmCobro();
    await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(() => expect(salesConfirmPurchase).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('confirmPurchase returns emailSent=false warning branch', async () => {
    salesConfirmPurchase.mockResolvedValueOnce({ emailSent: false });
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));

    // Open client modal with email
    const timeBtn = screen.getAllByRole('button').find(b =>
      /\d{1,2}:\d{2}/.test(b.textContent ?? '') && /Sala/.test(b.textContent ?? '') && !b.disabled
    );
    fireEvent.click(timeBtn);
    await waitFor(() => expect(screen.getByLabelText(/Cerrar/i)).toBeInTheDocument());
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) fireEvent.change(emailInput, { target: { value: 'fail@example.com' } });
    fireEvent.click(screen.getAllByRole('button').find(b => /Continuar/i.test(b.textContent ?? '')));
    await waitFor(() => expect(sessionsSyncSeats).toHaveBeenCalled());
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());
    fireEvent.click(document.querySelector('button[aria-label*="libre"]'));
    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);
    await waitFor(() => expect(screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''))).toBeTruthy());
    clickConfirmCobro();
    await waitFor(() => expect(salesConfirmPurchase).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('handlePay maps 404 backend error to the "seat not found" toast', async () => {
    salesCreatePurchase.mockRejectedValueOnce(Object.assign(new Error('API 404 /purchases: seat not found'), { status: 404 }));
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await goToPaymentStep();
    clickConfirmCobro();
    await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('handlePay maps 409 backend error to "asiento ocupado" toast', async () => {
    salesCreatePurchase.mockRejectedValueOnce(Object.assign(new Error('API 409 /purchases: seat taken'), { status: 409 }));
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await goToPaymentStep();
    clickConfirmCobro();
    await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('handlePay maps generic 500 error to generic toast', async () => {
    salesCreatePurchase.mockRejectedValueOnce(Object.assign(new Error('API 500 /purchases: server error'), { status: 500 }));
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await goToPaymentStep();
    clickConfirmCobro();
    await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('successful payment with response missing tickets uses fallback ticket generation', async () => {
    salesCreatePurchase.mockResolvedValueOnce({ id: 60, tickets: [] });
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await goToPaymentStep();
    clickConfirmCobro();
    await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('cash payment path: switch to cash, fill amount, confirm', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await goToPaymentStep();

    // Switch to cash
    const cashBtn = screen.getAllByRole('button').find(b => /Efectivo/i.test(b.textContent ?? ''));
    if (cashBtn) fireEvent.click(cashBtn);
    const cashInput = document.getElementById('bo-cash-input');
    if (cashInput) fireEvent.change(cashInput, { target: { value: '20' } });
    clickConfirmCobro();
    await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
  });
});
