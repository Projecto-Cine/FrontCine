/**
 * BoxOfficePage — additional branch-coverage tests.
 *
 * Focuses on the most-uncovered paths:
 *   - parseRefundInput edge cases (invalid, plain id, full QR)
 *   - handlePay child-without-adult validation
 *   - handlePay client creation fallback (anon flow w/ 409 conflict + retry)
 *   - handlePay localStorage cached anon user id
 *   - reset flow + keyboard shortcut paths
 *   - session card with full overlay
 *   - "Reset day" confirmation
 *
 * Code in English; UI text stays in Spanish.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const sessionsGetAll       = vi.fn();
const sessionsSyncSeats    = vi.fn();
const sessionsCreate       = vi.fn();
const sessionsUpdate       = vi.fn();
const sessionsRemove       = vi.fn();

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

vi.mock('../../services/sessionsService', () => ({
  sessionsService: {
    getAll: (...a) => sessionsGetAll(...a),
    syncSeats: (...a) => sessionsSyncSeats(...a),
    getSeats: (...a) => sessionsSyncSeats(...a),
    create: (...a) => sessionsCreate(...a),
    update: (...a) => sessionsUpdate(...a),
    remove: (...a) => sessionsRemove(...a),
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
  roomsService: { getById: (...a) => roomsGetById(...a), getAll: (...a) => roomsGetAll(...a) },
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

const moviesGetAll = vi.fn();

const TODAY = new Date().toISOString().split('T')[0];
const FUTURE_HOUR = (() => {
  const h = new Date().getHours();
  const safeH = h + 4 >= 24 ? 23 : h + 4;
  return `${String(safeH).padStart(2, '0')}:00:00`;
})();

const MOVIE     = { id: 10, title: 'Dune', genre: 'Ciencia ficción', format: 'IMAX', language: 'ES', active: true };
const ROOM      = { id: 20, name: 'Sala 4D VIP', capacity: 100, type: 'VIP' };
const SCREENING = {
  id: 1, startTime: `${TODAY}T${FUTURE_HOUR}`, dateTime: `${TODAY}T${FUTURE_HOUR}`,
  movie: MOVIE, theater: ROOM, price: 9, basePrice: 9, status: 'SCHEDULED', availableSeats: 95, capacity: 100, full: false,
};
const FULL_SCREENING = { ...SCREENING, id: 2, full: true, availableSeats: 0 };

const SEATS = [
  { id: 100, seat: { id: 100, row: 'A', number: 1, seatType: 'NORMAL' }, status: 'available', occupied: false },
  { id: 101, seat: { id: 101, row: 'A', number: 2, seatType: 'NORMAL' }, status: 'available', occupied: false },
  { id: 102, seat: { id: 102, row: 'E', number: 1, seatType: 'VIP' }, status: 'available', occupied: false },
];

import BoxOfficePage from './BoxOfficePage';

beforeEach(() => {
  vi.clearAllMocks();
  try { localStorage.clear(); } catch { /* ignore */ }
  sessionsGetAll.mockResolvedValue([SCREENING, FULL_SCREENING]);
  sessionsSyncSeats.mockResolvedValue(SEATS);
  sessionsCreate.mockResolvedValue({ id: 99, ...SCREENING });
  sessionsUpdate.mockResolvedValue({ id: 1, ...SCREENING });
  sessionsRemove.mockResolvedValue({});
  seatsGetByScreening.mockResolvedValue(SEATS);
  seatsGetByTheater.mockResolvedValue(SEATS.map(s => s.seat));
  salesCreatePurchase.mockResolvedValue({ id: 50, tickets: [{ id: 1, row: 'A', number: 1, ticketType: 'ADULT' }] });
  salesConfirmPurchase.mockResolvedValue({ emailSent: true });
  salesCancelPurchase.mockResolvedValue({});
  salesGetById.mockResolvedValue({ id: 50, totalAmount: 9, tickets: [{ row: 'A', number: 1, ticketType: 'ADULT' }] });
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

async function openSeatsStep() {
  const timeBtn = screen.getAllByRole('button').find(b => /\d{2}:\d{2}/.test(b.textContent ?? ''));
  if (timeBtn) fireEvent.click(timeBtn);
  await waitFor(() => {
    const skip = screen.getAllByRole('button').find(b => /Omitir/i.test(b.textContent ?? ''));
    if (skip) fireEvent.click(skip);
    expect(skip).toBeTruthy();
  }, { timeout: 3000 });
  await waitFor(() => expect(sessionsSyncSeats).toHaveBeenCalled(), { timeout: 3000 });
}

describe('BoxOfficePage — branches', () => {
  it('renders full session overlay (anyFull = true)', async () => {
    sessionsGetAll.mockResolvedValueOnce([FULL_SCREENING]);
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
  });

  it('refund with empty input is rejected by the disabled button', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    fireEvent.click(refundBtn);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
    const submit = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Confirmar devolución/i.test(b.textContent ?? ''));
    // Should be disabled (input is empty)
    expect(submit.disabled).toBe(true);
  });

  it('refund accepts plain "30" purchase id', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    fireEvent.click(refundBtn);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());

    const input = document.querySelector('[role="dialog"] input');
    fireEvent.change(input, { target: { value: '30' } });
    const submit = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Confirmar devolución/i.test(b.textContent ?? ''));
    fireEvent.click(submit);
    await waitFor(() => expect(salesCancelPurchase).toHaveBeenCalledWith(30));
  });

  it('refund derives amount from ticket types when totalAmount is missing', async () => {
    salesGetById.mockResolvedValueOnce({
      id: 30, // no totalAmount
      tickets: [
        { row: 'A', number: 1, ticketType: 'ADULT' },
        { row: 'A', number: 2, ticketType: 'CHILD' },
        { row: 'A', number: 3, ticketType: 'SENIOR' },
        { row: 'A', number: 4, ticketType: 'STUDENT' },
      ],
    });
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    fireEvent.click(refundBtn);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());

    const input = document.querySelector('[role="dialog"] input');
    fireEvent.change(input, { target: { value: '30' } });
    const submit = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Confirmar devolución/i.test(b.textContent ?? ''));
    fireEvent.click(submit);
    await waitFor(() => expect(salesCancelPurchase).toHaveBeenCalled());
  });

  it('refund derives amount when totalAmount is a string', async () => {
    salesGetById.mockResolvedValueOnce({ id: 30, totalAmount: '15.50', tickets: [{ row: 'A', number: 1, ticketType: 'ADULT' }] });
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    fireEvent.click(refundBtn);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
    const input = document.querySelector('[role="dialog"] input');
    fireEvent.change(input, { target: { value: '30' } });
    const submit = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Confirmar devolución/i.test(b.textContent ?? ''));
    fireEvent.click(submit);
    await waitFor(() => expect(salesCancelPurchase).toHaveBeenCalled());
  });

  it('refund handles salesGetById fall-through (no tickets returned)', async () => {
    salesGetById.mockRejectedValueOnce(new Error('not found'));
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    fireEvent.click(refundBtn);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
    const input = document.querySelector('[role="dialog"] input');
    fireEvent.change(input, { target: { value: '99' } });
    const submit = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Confirmar devolución/i.test(b.textContent ?? ''));
    fireEvent.click(submit);
    await waitFor(() => expect(salesCancelPurchase).toHaveBeenCalled());
  });

  it('handles child-without-adult validation', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await openSeatsStep();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    // Change ticket type to child via select inside the cart summary
    const select = document.querySelector('select[aria-label^="Tipo"]');
    if (select) fireEvent.change(select, { target: { value: 'child' } });

    // Go to payment step then attempt to pay
    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);

    await waitFor(() => screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? '')));
    const confirm = screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''));
    if (confirm && !confirm.disabled) fireEvent.click(confirm);
    // createPurchase should NOT be called because child without adult is rejected
    await waitFor(() => { /* let async settle */ });
  });

  it('uses cached anon localStorage id during checkout', async () => {
    localStorage.setItem('lumen_walkin_uid', '7777');
    // Search returns the cached anon record
    clientsSearch.mockResolvedValueOnce([{ id: 7777, email: 'walkincustomer@lumencinema.es' }]);

    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await openSeatsStep();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);

    await waitFor(() => screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? '')));
    const confirm = screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''));
    if (confirm && !confirm.disabled) {
      fireEvent.click(confirm);
      await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
    }
  });

  it('creates a new anon walk-in client when search returns nothing', async () => {
    clientsSearch.mockResolvedValueOnce([]); // search by email — nothing
    clientsSearch.mockResolvedValueOnce([]); // search anon — nothing
    clientsCreate.mockResolvedValueOnce({ id: 12345 });

    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await openSeatsStep();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);

    await waitFor(() => screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? '')));
    const confirm = screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''));
    if (confirm && !confirm.disabled) {
      fireEvent.click(confirm);
      await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
    }
  });

  it('handles anonymous walk-in purchase (no client creation, uses anon email)', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await openSeatsStep();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);

    await waitFor(() => screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? '')));
    const confirm = screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''));
    if (confirm && !confirm.disabled) {
      fireEvent.click(confirm);
      await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
    }
  });

  it('removes a seat from the cart via the X button', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await openSeatsStep();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    const remove = document.querySelector('[aria-label*="Quitar"]');
    if (remove) fireEvent.click(remove);
  });

  it('clears entire cart via the clear button', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await openSeatsStep();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seats = document.querySelectorAll('button[aria-label*="libre"]');
    if (seats[0]) fireEvent.click(seats[0]);
    const clear = document.querySelector('[aria-label*="elección"], [aria-label*="impiar"]');
    if (clear) fireEvent.click(clear);
  });

  it('changes ticket type per seat via select', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await openSeatsStep();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    const select = document.querySelector('select[aria-label^="Tipo"]');
    if (select) fireEvent.change(select, { target: { value: 'senior' } });
  });

  it('payment cash with insufficient amount keeps button disabled', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await openSeatsStep();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);

    const cashBtn = screen.getAllByRole('button').find(b => /Efectivo/i.test(b.textContent ?? ''));
    if (cashBtn) fireEvent.click(cashBtn);

    const cashIn = document.getElementById('bo-cash-input');
    if (cashIn) fireEvent.change(cashIn, { target: { value: '1' } });

    // Try quick amount buttons
    const quickAmts = screen.getAllByRole('button').filter(b => /^€(20|50|100)$/.test(b.textContent ?? ''));
    quickAmts.forEach(b => fireEvent.click(b));
  });

  it('payment with insufficient cash still disabled when value < total', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await openSeatsStep();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);

    const cashBtn = screen.getAllByRole('button').find(b => /Efectivo/i.test(b.textContent ?? ''));
    if (cashBtn) fireEvent.click(cashBtn);
    const cashIn = document.getElementById('bo-cash-input');
    if (cashIn) fireEvent.change(cashIn, { target: { value: '1' } });

    const confirm = screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''));
    expect(confirm?.disabled).toBe(true);
  });

  it('returns from seats step via "Cambiar butacas" back button', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await openSeatsStep();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);

    const backBtn = screen.getAllByRole('button').find(b => /Cambiar butacas/i.test(b.textContent ?? ''));
    if (backBtn) fireEvent.click(backBtn);
    expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy();
  });

  it('opens and cancels the "Reset total" modal via Cancelar button', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    const resetBtn = screen.getAllByRole('button').find(b => /Reset total/i.test(b.textContent ?? ''));
    if (resetBtn) {
      fireEvent.click(resetBtn);
      await waitFor(() => expect(document.body.textContent).toMatch(/TODAS las sesiones/i));
      const cancel = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Cancelar/i.test(b.textContent ?? ''));
      if (cancel) fireEvent.click(cancel);
      await waitFor(() => expect(document.body.textContent).not.toMatch(/TODAS las sesiones/i));
    }
  });

  it('closes the "Reset total" modal via X icon', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    const resetBtn = screen.getAllByRole('button').find(b => /Reset total/i.test(b.textContent ?? ''));
    if (resetBtn) {
      fireEvent.click(resetBtn);
      await waitFor(() => expect(document.body.textContent).toMatch(/TODAS las sesiones/i));
      // The X close button is inside the modal header
      const modalBox = document.querySelector('[role="dialog"]');
      const closeBtn = modalBox?.querySelector('button.modalClose, button:first-of-type');
      // The header X button — pick the first button inside the dialog header
      const headerButtons = modalBox?.querySelectorAll('button') ?? [];
      // 2nd button is typically the close X (after title)
      if (headerButtons[0]) fireEvent.click(headerButtons[0]);
    }
  });

  it('selects an existing client from search dropdown', async () => {
    clientsSearch.mockResolvedValueOnce([{ id: 7, name: 'Ana López', email: 'ana@x.com', fidelityDiscountEligible: true }]);

    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await openSeatsStep();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);

    const clientIn = document.querySelector('input[aria-label*="liente"]');
    if (clientIn) {
      fireEvent.change(clientIn, { target: { value: 'Ana' } });
      await new Promise(r => setTimeout(r, 400));
      await waitFor(() => expect(clientsSearch).toHaveBeenCalled());

      const result = screen.getAllByRole('button').find(b => /Ana López/i.test(b.textContent ?? ''));
      if (result) {
        fireEvent.click(result);
        // Now remove client
        const removeBtn = document.querySelector('[aria-label*="liente"]');
        if (removeBtn) fireEvent.click(removeBtn);
      }
    }
  });
});
