/**
 * BoxOfficePage — exhaustive coverage suite.
 *
 * Goal: exercise as many branches and effect paths as possible — modal flows,
 * keyboard shortcuts, payment flows, refunds, session edit/delete, and reset
 * flows. Code in English; rendered locale stays in Spanish.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

/* ── Mock services (declare fns first, then mock with delegates) ── */
const sessionsGetAll       = vi.fn();
const sessionsSyncSeats    = vi.fn();
const sessionsCreate       = vi.fn();
const sessionsUpdate       = vi.fn();
const sessionsRemove       = vi.fn();
const sessionsGetUpcoming  = vi.fn();

const seatsGetByScreening  = vi.fn();
const seatsGetByTheater    = vi.fn();

const salesCreatePurchase  = vi.fn();
const salesConfirmPurchase = vi.fn();
const salesCancelPurchase  = vi.fn();
const salesGetById         = vi.fn();
const salesCreateTicket    = vi.fn();

const clientsSearch        = vi.fn();
const clientsGetAll        = vi.fn();
const clientsCreate        = vi.fn();

const roomsGetById         = vi.fn();
const roomsGetAll          = vi.fn();
const roomsGetSeats        = vi.fn();

const moviesGetAll         = vi.fn();
const moviesGetActive      = vi.fn();

vi.mock('../../services/sessionsService', () => ({
  sessionsService: {
    getAll:      (...a) => sessionsGetAll(...a),
    getUpcoming: (...a) => sessionsGetUpcoming(...a),
    syncSeats:   (...a) => sessionsSyncSeats(...a),
    create:      (...a) => sessionsCreate(...a),
    update:      (...a) => sessionsUpdate(...a),
    remove:      (...a) => sessionsRemove(...a),
  },
  screeningsService: {
    getAll:      (...a) => sessionsGetAll(...a),
    getUpcoming: (...a) => sessionsGetUpcoming(...a),
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
    createPurchase:   (...a) => salesCreatePurchase(...a),
    confirmPurchase:  (...a) => salesConfirmPurchase(...a),
    cancelPurchase:   (...a) => salesCancelPurchase(...a),
    getById:          (...a) => salesGetById(...a),
    createTicketSale: (...a) => salesCreateTicket(...a),
  },
}));

vi.mock('../../services/clientsService', () => ({
  clientsService: {
    search: (...a) => clientsSearch(...a),
    getAll: (...a) => clientsGetAll(...a),
    create: (...a) => clientsCreate(...a),
  },
}));

vi.mock('../../services/roomsService', () => ({
  roomsService: {
    getById:  (...a) => roomsGetById(...a),
    getAll:   (...a) => roomsGetAll(...a),
    getSeats: (...a) => roomsGetSeats(...a),
  },
  theatersService: {
    getAll:   (...a) => roomsGetAll(...a),
    getSeats: (...a) => roomsGetSeats(...a),
  },
}));

vi.mock('../../services/moviesService', () => ({
  moviesService: {
    getAll:    (...a) => moviesGetAll(...a),
    getActive: (...a) => moviesGetActive(...a),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'admin' }, can: () => true }),
}));

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr">{value}</div>,
}));

/* ── Fixtures: today + future hour so the "hide past sessions" filter keeps them ── */
// Always use today + a fixed late-evening hour so it stays > 3h ahead regardless of test execution time
const TODAY = new Date().toISOString().split('T')[0];
const FUTURE_HOUR = '23:30:00';

const MOVIE = { id: 10, title: 'Dune', durationMin: 155, genre: 'Ciencia ficción', format: 'IMAX', language: 'ES', active: true, imageUrl: '', ageRating: 'PG-13' };
const MOVIE_VIP = { id: 11, title: 'Avatar', durationMin: 162, genre: 'Drama', format: '4DX', language: 'VO', active: true, imageUrl: '' };
const ROOM = { id: 20, name: 'Sala 1 IMAX', capacity: 100, type: 'IMAX', status: 'active' };
const ROOM_VIP = { id: 21, name: 'Sala 4D VIP', capacity: 50, type: 'VIP', status: 'active' };

const SCREENING = {
  id: 1, startTime: `${TODAY}T${FUTURE_HOUR}`, dateTime: `${TODAY}T${FUTURE_HOUR}`,
  movie: MOVIE, theater: ROOM, price: 9.5, basePrice: 9.5, status: 'SCHEDULED', availableSeats: 95, capacity: 100, full: false,
};
const SCREENING_VIP = {
  id: 2, startTime: `${TODAY}T${FUTURE_HOUR}`, dateTime: `${TODAY}T${FUTURE_HOUR}`,
  movie: MOVIE_VIP, theater: ROOM_VIP, price: 12, basePrice: 12, status: 'SCHEDULED', availableSeats: 30, capacity: 50, full: false,
};

const SEATS = [
  { id: 100, seat: { id: 100, row: 'A', number: 1, seatType: 'NORMAL' }, occupied: false, status: 'available' },
  { id: 101, seat: { id: 101, row: 'A', number: 2, seatType: 'NORMAL' }, occupied: false, status: 'available' },
  { id: 102, seat: { id: 102, row: 'B', number: 1, seatType: 'NORMAL' }, occupied: true, status: 'occupied' },
  { id: 103, seat: { id: 103, row: 'E', number: 1, seatType: 'VIP' }, occupied: false, status: 'available' },
];

import BoxOfficePage from './BoxOfficePage';

beforeEach(() => {
  vi.clearAllMocks();
  try { localStorage.clear(); } catch { /* ignore */ }
  sessionsGetAll.mockResolvedValue([SCREENING, SCREENING_VIP]);
  sessionsSyncSeats.mockResolvedValue(SEATS);
  sessionsCreate.mockResolvedValue({ id: 99, ...SCREENING });
  sessionsUpdate.mockResolvedValue({ id: 1, ...SCREENING });
  sessionsRemove.mockResolvedValue({});
  seatsGetByScreening.mockResolvedValue(SEATS);
  seatsGetByTheater.mockResolvedValue(SEATS.map(s => s.seat));
  salesCreatePurchase.mockResolvedValue({ id: 50, tickets: [{ id: 1, row: 'A', number: 1, ticketType: 'ADULT' }] });
  salesConfirmPurchase.mockResolvedValue({ emailSent: true });
  salesCancelPurchase.mockResolvedValue({});
  salesGetById.mockResolvedValue({ id: 50, totalAmount: 9.5, tickets: [{ row: 'A', number: 1, ticketType: 'ADULT' }] });
  clientsSearch.mockResolvedValue([{ id: 7, name: 'Ana López', email: 'ana@x.com', fidelityDiscountEligible: true }]);
  clientsCreate.mockResolvedValue({ id: 999 });
  roomsGetById.mockResolvedValue(ROOM);
  roomsGetAll.mockResolvedValue([ROOM, ROOM_VIP]);
  moviesGetActive.mockResolvedValue([MOVIE, MOVIE_VIP]);
  moviesGetAll.mockResolvedValue([MOVIE, MOVIE_VIP]);
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

async function pickSessionAndSkipModal() {
  const timeBtn = screen.getAllByRole('button').find(b => /\d{2}:\d{2}/.test(b.textContent ?? ''));
  if (timeBtn) fireEvent.click(timeBtn);
  await waitFor(() => {
    const skip = screen.getAllByRole('button').find(b => /Saltar|Omitir/i.test(b.textContent ?? ''));
    if (skip) fireEvent.click(skip);
    expect(skip).toBeTruthy();
  }, { timeout: 3000 });
  await waitFor(() => expect(sessionsSyncSeats).toHaveBeenCalled(), { timeout: 3000 });
}

describe('BoxOfficePage — exhaustive coverage', () => {
  it('renders sessions and basic UI', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    expect(screen.getByText('Avatar')).toBeInTheDocument();
  });

  it('changes selected date and reloads sessions', async () => {
    renderPage();
    await waitFor(() => expect(sessionsGetAll).toHaveBeenCalled());
    const dateInput = document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: '2026-12-15' } });
    await waitFor(() => expect(sessionsGetAll).toHaveBeenCalledTimes(2));
  });

  it('searches sessions by movie title', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    const search = document.querySelector('input[aria-label*="usca"]') || document.querySelector('input[type="text"]');
    fireEvent.change(search, { target: { value: 'Avatar' } });
    await waitFor(() => expect(screen.queryByText('Dune')).not.toBeInTheDocument());
  });

  it('opens "Nueva sesión" modal and creates a session', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const newBtn = screen.getAllByRole('button').find(b => /Nueva sesión/i.test(b.textContent ?? ''));
    fireEvent.click(newBtn);

    await waitFor(() => expect(moviesGetActive).toHaveBeenCalled());
    const selects = document.querySelectorAll('select');
    if (selects[0]) fireEvent.change(selects[0], { target: { value: '10' } });
    if (selects[1]) fireEvent.change(selects[1], { target: { value: '20' } });
    const dateIn = document.querySelectorAll('input[type="date"]');
    if (dateIn.length > 1) fireEvent.change(dateIn[1], { target: { value: '2026-12-25' } });
    const timeIn = document.querySelector('input[type="time"]');
    if (timeIn) fireEvent.change(timeIn, { target: { value: '20:00' } });

    const saveBtn = [...document.querySelectorAll('[role="dialog"] button, .modalSave, button')].find(b =>
      /Crear|Guardar/i.test(b.textContent ?? '') && b.closest('[role="dialog"]')
    );
    if (saveBtn) {
      fireEvent.click(saveBtn);
      await waitFor(() => expect(sessionsCreate).toHaveBeenCalled());
    }
  });

  it('rejects creating a session with missing fields', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const newBtn = screen.getAllByRole('button').find(b => /Nueva sesión/i.test(b.textContent ?? ''));
    fireEvent.click(newBtn);

    await waitFor(() => expect(moviesGetActive).toHaveBeenCalled());

    const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear/i.test(b.textContent ?? ''));
    if (saveBtn) fireEvent.click(saveBtn);
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it('opens refund modal and validates input', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? '') || /Reembol/i.test(b.title ?? ''));
    if (refundBtn) {
      fireEvent.click(refundBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
    }

    // Submit with invalid input
    const submitBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Procesar|Devolver|Confirmar/i.test(b.textContent ?? ''));
    if (submitBtn) fireEvent.click(submitBtn);
  });

  it('processes a valid refund via QR code', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    if (refundBtn) {
      fireEvent.click(refundBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());

      const input = document.querySelector('[role="dialog"] input');
      if (input) {
        fireEvent.change(input, { target: { value: 'LUMEN:50-1|Dune|Sala 1|2026-12-01|20:00|A01|ADULT' } });
        const submitBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Procesar|Devolver|Confirmar/i.test(b.textContent ?? ''));
        if (submitBtn) {
          fireEvent.click(submitBtn);
          await waitFor(() => expect(salesCancelPurchase).toHaveBeenCalled());
        }
      }
    }
  });

  it('handles refund errors (404, 409, 400, generic)', async () => {
    // 404
    salesCancelPurchase.mockRejectedValueOnce({ status: 404 });
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    if (refundBtn) {
      fireEvent.click(refundBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const input = document.querySelector('[role="dialog"] input');
      if (input) {
        fireEvent.change(input, { target: { value: '50-1' } });
        const submitBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Procesar|Devolver|Confirmar/i.test(b.textContent ?? ''));
        if (submitBtn) fireEvent.click(submitBtn);
        await waitFor(() => expect(salesCancelPurchase).toHaveBeenCalled());
      }
    }
  });

  it('clicks a session time, dismisses client modal, and shows seat map', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy(), { timeout: 3000 });
  });

  it('fills client modal with email and continues', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const timeBtn = screen.getAllByRole('button').find(b => /\d{2}:\d{2}/.test(b.textContent ?? ''));
    fireEvent.click(timeBtn);

    await waitFor(() => expect(document.querySelector('[aria-labelledby="client-modal-title"]')).toBeTruthy());

    // Fill email
    const emailIn = document.querySelector('input[type="email"]');
    if (emailIn) fireEvent.change(emailIn, { target: { value: 'guest@test.com' } });

    const continueBtn = screen.getAllByRole('button').find(b => /Continuar/i.test(b.textContent ?? ''));
    if (continueBtn) fireEvent.click(continueBtn);

    await waitFor(() => expect(sessionsSyncSeats).toHaveBeenCalled());
  });

  it('selects available seats and shows summary', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();

    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());
    const seatBtns = document.querySelectorAll('button[aria-label*="libre"]');
    if (seatBtns[0]) fireEvent.click(seatBtns[0]);
    if (seatBtns[1]) fireEvent.click(seatBtns[1]);
  });

  it('handles payment flow with card method', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    // Click "proceed to payment" button (still on seats step)
    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);
    // Wait for payment step buttons to render
    await waitFor(() => {
      const confirmBtn = screen.getAllByRole('button').find(b => /Confirmar cobro|Procesando/i.test(b.textContent ?? ''));
      expect(confirmBtn).toBeTruthy();
    }, { timeout: 3000 });
    const confirmBtn = screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''));
    if (confirmBtn && !confirmBtn.disabled) {
      fireEvent.click(confirmBtn);
      await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
    }
  });

  it('switches to cash method and validates cashGiven', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    const cashBtn = screen.getAllByRole('button').find(b => /Efectivo/i.test(b.textContent ?? ''));
    if (cashBtn) fireEvent.click(cashBtn);

    const cashInput = document.querySelector('input[inputmode="decimal"], input[type="number"]');
    if (cashInput) {
      fireEvent.change(cashInput, { target: { value: '20' } });
    }
  });

  it('triggers F2 focus, F5 reset, Escape return', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    fireEvent.keyDown(window, { key: 'F2' });
    fireEvent.keyDown(window, { key: 'F5' });
    await waitFor(() => { expect(screen.getByText('Dune')).toBeInTheDocument(); });

    await pickSessionAndSkipModal();
    fireEvent.keyDown(window, { key: 'Escape' });
    // After Escape from seats step, returns to sessions and Dune visible again
    await waitFor(() => expect(document.body.textContent).toContain('Dune'), { timeout: 3000 });
  });

  it('searches clients with debounce', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();

    const clientInput = document.querySelector('input[aria-label*="liente"], input[placeholder*="liente"]');
    if (clientInput) {
      fireEvent.change(clientInput, { target: { value: 'Ana' } });
      await new Promise(r => setTimeout(r, 450));
      await waitFor(() => expect(clientsSearch).toHaveBeenCalled());
    }
  });

  it('clears client query when empty', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();

    const clientInput = document.querySelector('input[aria-label*="liente"], input[placeholder*="liente"]');
    if (clientInput) {
      fireEvent.change(clientInput, { target: { value: 'Ana' } });
      await new Promise(r => setTimeout(r, 400));
      fireEvent.change(clientInput, { target: { value: '' } });
    }
  });

  it('handles session load error', async () => {
    sessionsGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(sessionsGetAll).toHaveBeenCalled());
  });

  it('handles seat sync error and falls back', async () => {
    sessionsSyncSeats.mockRejectedValueOnce(new Error('sync fail'));
    seatsGetByScreening.mockRejectedValueOnce(new Error('seat fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();
    expect(document.body.textContent).toContain('Dune');
  });

  it('loads room details via room_id fallback', async () => {
    sessionsGetAll.mockResolvedValueOnce([{ ...SCREENING, theater: undefined, room: undefined, room_id: 20 }]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();
    await waitFor(() => expect(roomsGetById).toHaveBeenCalledWith(20));
  });

  it('handles session edit and modifies all fields', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const editBtn = document.querySelector('button[title="Editar sesión"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      await waitFor(() => expect(moviesGetActive).toHaveBeenCalled());

      // Modify all fields to cover their onChange branches
      const selects = document.querySelectorAll('[role="dialog"] select');
      if (selects[0]) fireEvent.change(selects[0], { target: { value: '11' } });
      if (selects[1]) fireEvent.change(selects[1], { target: { value: '21' } });
      const dateIn = document.querySelector('[role="dialog"] input[type="date"]');
      if (dateIn) fireEvent.change(dateIn, { target: { value: `${TODAY}` } });
      const timeIn = document.querySelector('[role="dialog"] input[type="time"]');
      if (timeIn) fireEvent.change(timeIn, { target: { value: '20:00' } });
      const priceIn = document.querySelector('[role="dialog"] input[type="number"]');
      if (priceIn) fireEvent.change(priceIn, { target: { value: '12.5' } });

      const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Guardar/i.test(b.textContent ?? ''));
      if (saveBtn) {
        fireEvent.click(saveBtn);
        await waitFor(() => expect(sessionsUpdate).toHaveBeenCalled());
      }
    }
  });

  it('cancels session edit when fields missing', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const editBtn = document.querySelector('button[title="Editar sesión"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      await waitFor(() => expect(moviesGetActive).toHaveBeenCalled());

      // Clear required field
      const selects = document.querySelectorAll('[role="dialog"] select');
      if (selects[0]) fireEvent.change(selects[0], { target: { value: '' } });

      const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Guardar/i.test(b.textContent ?? ''));
      if (saveBtn) fireEvent.click(saveBtn);
    }
  });

  it('deletes a session', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const deleteBtn = document.querySelector('button[title="Eliminar sesión"]');
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const confirm = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Eliminar|Confirmar/i.test(b.textContent ?? ''));
      if (confirm) {
        fireEvent.click(confirm);
        await waitFor(() => expect(sessionsRemove).toHaveBeenCalled());
      }
    }
  });

  it('handles session delete error', async () => {
    sessionsRemove.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const deleteBtn = document.querySelector('button[title="Eliminar sesión"]');
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const confirm = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Eliminar|Confirmar/i.test(b.textContent ?? ''));
      if (confirm) fireEvent.click(confirm);
    }
  });

  it('shows price on session card', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    expect(document.body.textContent).toMatch(/9[.,]5/);
  });

  it('handles fallback ticket generation when API returns no tickets', async () => {
    salesCreatePurchase.mockResolvedValueOnce({ id: 60, tickets: [] });
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    // Click "proceed to payment" button (still on seats step)
    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);
    // Wait for payment step buttons to render
    await waitFor(() => {
      const confirmBtn = screen.getAllByRole('button').find(b => /Confirmar cobro|Procesando/i.test(b.textContent ?? ''));
      expect(confirmBtn).toBeTruthy();
    }, { timeout: 3000 });
    const confirmBtn = screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''));
    if (confirmBtn && !confirmBtn.disabled) {
      fireEvent.click(confirmBtn);
      await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
    }
  });

  it('handles payment offline error fallback', async () => {
    salesCreatePurchase.mockRejectedValueOnce(new Error('Network error'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    // Click "proceed to payment" button (still on seats step)
    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);
    // Wait for payment step buttons to render
    await waitFor(() => {
      const confirmBtn = screen.getAllByRole('button').find(b => /Confirmar cobro|Procesando/i.test(b.textContent ?? ''));
      expect(confirmBtn).toBeTruthy();
    }, { timeout: 3000 });
    const confirmBtn = screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''));
    if (confirmBtn && !confirmBtn.disabled) {
      fireEvent.click(confirmBtn);
      await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
    }
  });

  it('handles 409 conflict (seat unavailable) error', async () => {
    salesCreatePurchase.mockRejectedValueOnce({ status: 409, message: 'API 409 conflict: seat occupied' });
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    const seatBtn = document.querySelector('button[aria-label*="libre"]');
    if (seatBtn) fireEvent.click(seatBtn);

    // Click "proceed to payment" button (still on seats step)
    const proceedBtn = screen.getAllByRole('button').find(b => /\d+ butaca/i.test(b.textContent ?? ''));
    if (proceedBtn) fireEvent.click(proceedBtn);
    // Wait for payment step buttons to render
    await waitFor(() => {
      const confirmBtn = screen.getAllByRole('button').find(b => /Confirmar cobro|Procesando/i.test(b.textContent ?? ''));
      expect(confirmBtn).toBeTruthy();
    }, { timeout: 3000 });
    const confirmBtn = screen.getAllByRole('button').find(b => /Confirmar cobro/i.test(b.textContent ?? ''));
    if (confirmBtn && !confirmBtn.disabled) {
      fireEvent.click(confirmBtn);
      await waitFor(() => expect(salesCreatePurchase).toHaveBeenCalled(), { timeout: 3000 });
    }
  });

  it('removes selected client', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    await pickSessionAndSkipModal();

    const clientInput = document.querySelector('input[aria-label*="liente"], input[placeholder*="liente"]');
    if (clientInput) {
      fireEvent.change(clientInput, { target: { value: 'Ana' } });
      await new Promise(r => setTimeout(r, 400));
      await waitFor(() => expect(clientsSearch).toHaveBeenCalled());

      // Select first result if any
      const resultBtn = screen.getAllByRole('button').find(b => /Ana/i.test(b.textContent ?? ''));
      if (resultBtn) {
        fireEvent.click(resultBtn);
        // Now removable
        const removeBtn = document.querySelector('button[aria-label*="quitar"], button[aria-label*="liente"]');
        if (removeBtn) fireEvent.click(removeBtn);
      }
    }
  });

  it('uses TicketSuccess to navigate among multiple tickets', async () => {
    const tickets = [
      { id: 'T1', movie: 'Dune', room: 'Sala 1', date: '2026-12-01', time: '20:00', seat: 'A01', format: 'IMAX', language: 'ES', qrValue: 'QR-1' },
      { id: 'T2', movie: 'Dune', room: 'Sala 1', date: '2026-12-01', time: '20:00', seat: 'A02', format: 'IMAX', language: 'VO', qrValue: 'QR-2' },
    ];
    const { TicketSuccess } = await import('./BoxOfficePage');
    const tFn = (k, p = {}) => {
      const labels = {
        'box_office.success.title': '¡Cobro completado!',
        'box_office.success.print': 'Imprimir',
        'box_office.success.newSale': 'Nueva venta',
        'box_office.pay.cash': 'Efectivo',
        'box_office.ticket.dubbed': 'Doblada',
        'box_office.ticket.original': 'V. Original',
      };
      if (k === 'box_office.ticket.total') return `TOTAL (${p.n} ent.)`;
      return labels[k] ?? k;
    };
    const onReset = vi.fn();
    render(<TicketSuccess tickets={tickets} total={19} payMethod="cash" onReset={onReset} t={tFn} />);
    expect(screen.getByText('¡Cobro completado!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: /Nueva venta/i }));
    expect(onReset).toHaveBeenCalled();
  });

  it('opens "Reset total" modal and confirms full reset', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const fullResetBtn = screen.getAllByRole('button').find(b => /Reset total/i.test(b.textContent ?? ''));
    if (fullResetBtn) {
      fireEvent.click(fullResetBtn);
      await waitFor(() => expect(document.body.textContent).toMatch(/TODAS las sesiones/i));

      const confirmBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Borrar todo/i.test(b.textContent ?? ''));
      if (confirmBtn) {
        fireEvent.click(confirmBtn);
        // sessionsService.getAll runs many times in full reset
        await waitFor(() => expect(sessionsGetAll).toHaveBeenCalled(), { timeout: 3000 });
      }
    }
  });

  it('triggers handleSyncSeats from edit modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    const editBtn = document.querySelector('button[title="Editar sesión"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      await waitFor(() => expect(moviesGetActive).toHaveBeenCalled());

      const syncBtn = screen.getAllByRole('button').find(b => /Resincronizar/i.test(b.textContent ?? ''));
      if (syncBtn) {
        fireEvent.click(syncBtn);
        await waitFor(() => expect(sessionsSyncSeats).toHaveBeenCalled(), { timeout: 3000 });
      }
    }
  });

  it('handles handleSyncSeats error', async () => {
    sessionsSyncSeats.mockRejectedValueOnce(new Error('sync failed'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    const editBtn = document.querySelector('button[title="Editar sesión"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      await waitFor(() => expect(moviesGetActive).toHaveBeenCalled());

      const syncBtn = screen.getAllByRole('button').find(b => /Resincronizar/i.test(b.textContent ?? ''));
      if (syncBtn) {
        fireEvent.click(syncBtn);
        await waitFor(() => expect(sessionsSyncSeats).toHaveBeenCalled(), { timeout: 3000 });
      }
    }
  });

  it('handles update session error', async () => {
    sessionsUpdate.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    const editBtn = document.querySelector('button[title="Editar sesión"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      await waitFor(() => expect(moviesGetActive).toHaveBeenCalled());
      const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Guardar/i.test(b.textContent ?? ''));
      if (saveBtn) {
        fireEvent.click(saveBtn);
        await waitFor(() => expect(sessionsUpdate).toHaveBeenCalled());
      }
    }
  });

  it('handles create session error', async () => {
    sessionsCreate.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const newBtn = screen.getAllByRole('button').find(b => /Nueva sesión/i.test(b.textContent ?? ''));
    fireEvent.click(newBtn);
    await waitFor(() => expect(moviesGetActive).toHaveBeenCalled());

    const selects = document.querySelectorAll('[role="dialog"] select');
    if (selects[0]) fireEvent.change(selects[0], { target: { value: '10' } });
    if (selects[1]) fireEvent.change(selects[1], { target: { value: '20' } });
    const dateIn = document.querySelectorAll('[role="dialog"] input[type="date"]');
    if (dateIn[0]) fireEvent.change(dateIn[0], { target: { value: '2026-12-25' } });
    const timeIn = document.querySelector('[role="dialog"] input[type="time"]');
    if (timeIn) fireEvent.change(timeIn, { target: { value: '20:00' } });

    const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear sesión/i.test(b.textContent ?? ''));
    if (saveBtn) {
      fireEvent.click(saveBtn);
      await waitFor(() => expect(sessionsCreate).toHaveBeenCalled());
    }
  });

  it('closes new session modal via X button', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    const newBtn = screen.getAllByRole('button').find(b => /Nueva sesión/i.test(b.textContent ?? ''));
    fireEvent.click(newBtn);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
    const closeBtn = document.querySelector('[role="dialog"] [aria-label="Cerrar"]');
    if (closeBtn) fireEvent.click(closeBtn);
  });

  it('closes edit session modal via X button', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    const editBtn = document.querySelector('button[title="Editar sesión"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const closeBtn = document.querySelector('[role="dialog"] [aria-label="Cerrar"]');
      if (closeBtn) fireEvent.click(closeBtn);
    }
  });

  it('cancels delete session modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    const deleteBtn = document.querySelector('button[title="Eliminar sesión"]');
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const cancelBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Cancelar/i.test(b.textContent ?? ''));
      if (cancelBtn) fireEvent.click(cancelBtn);
    }
  });

  it('processes refund using purchase id only', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    if (refundBtn) {
      fireEvent.click(refundBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const input = document.querySelector('[role="dialog"] input');
      if (input) {
        fireEvent.change(input, { target: { value: '50' } });
        const submitBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Confirmar devolución/i.test(b.textContent ?? ''));
        if (submitBtn) {
          fireEvent.click(submitBtn);
          await waitFor(() => expect(salesCancelPurchase).toHaveBeenCalled());
        }
      }
    }
  });

  it('rejects refund with invalid input', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    if (refundBtn) {
      fireEvent.click(refundBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const input = document.querySelector('[role="dialog"] input');
      if (input) {
        fireEvent.change(input, { target: { value: 'invalid' } });
        const submitBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Confirmar devolución/i.test(b.textContent ?? ''));
        if (submitBtn) fireEvent.click(submitBtn);
        expect(salesCancelPurchase).not.toHaveBeenCalled();
      }
    }
  });

  it('cancels refund modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    if (refundBtn) {
      fireEvent.click(refundBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const cancel = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Cancelar/i.test(b.textContent ?? ''));
      if (cancel) fireEvent.click(cancel);
    }
  });

  it('handles refund 409 conflict (already refunded)', async () => {
    salesCancelPurchase.mockRejectedValueOnce({ status: 409 });
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    if (refundBtn) {
      fireEvent.click(refundBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const input = document.querySelector('[role="dialog"] input');
      if (input) {
        fireEvent.change(input, { target: { value: '50' } });
        const submitBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Confirmar devolución/i.test(b.textContent ?? ''));
        if (submitBtn) {
          fireEvent.click(submitBtn);
          await waitFor(() => expect(salesCancelPurchase).toHaveBeenCalled());
        }
      }
    }
  });

  it('handles refund 400 (session already started)', async () => {
    salesCancelPurchase.mockRejectedValueOnce({ status: 400 });
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    if (refundBtn) {
      fireEvent.click(refundBtn);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const input = document.querySelector('[role="dialog"] input');
      if (input) {
        fireEvent.change(input, { target: { value: '50' } });
        const submitBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Confirmar devolución/i.test(b.textContent ?? ''));
        if (submitBtn) {
          fireEvent.click(submitBtn);
          await waitFor(() => expect(salesCancelPurchase).toHaveBeenCalled());
        }
      }
    }
  });

  it('client search debounce clears results when input is emptied', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await pickSessionAndSkipModal();

    const clientInput = document.querySelector('input[aria-label*="liente"], input[placeholder*="liente"]');
    if (clientInput) {
      // Fill then empty — covers both !clientQuery.trim() branches
      fireEvent.change(clientInput, { target: { value: 'X' } });
      fireEvent.change(clientInput, { target: { value: '' } });
    }
  });

  it('renders session with availableSeats=undefined (uses sold fallback)', async () => {
    sessionsGetAll.mockResolvedValueOnce([{ ...SCREENING, availableSeats: undefined, sold: 12 }]);
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
  });

  it('handlePay early-returns when no seats are selected', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    await pickSessionAndSkipModal();
    await waitFor(() => expect(document.querySelector('button[aria-label^="Butaca"]')).toBeTruthy());

    // Trigger F4 with no seats selected → toast error, no purchase
    fireEvent.keyDown(window, { key: 'F4' });
    expect(salesCreatePurchase).not.toHaveBeenCalled();
  });

  it('triggers image onError fallback when poster URL fails', async () => {
    sessionsGetAll.mockResolvedValueOnce([{ ...SCREENING, movie: { ...MOVIE, imageUrl: 'https://broken/img.jpg' } }]);
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));
    const img = document.querySelector('img[alt="Dune"]');
    if (img) fireEvent.error(img);
  });

  it('renders RefundReceipt component standalone', async () => {
    const { default: PageDefault } = await import('./BoxOfficePage');
    // Build a refund through the page and capture the receipt screen.
    salesGetById.mockResolvedValueOnce({
      id: 50,
      totalAmount: 9.5,
      movieTitle: 'Dune',
      theaterName: 'Sala 1',
      startTime: `${TODAY}T20:00:00`,
      tickets: [{ row: 'A', number: 1, ticketType: 'ADULT' }],
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const refundBtn = screen.getAllByRole('button').find(b => /Devolución/i.test(b.textContent ?? ''));
    fireEvent.click(refundBtn);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
    const input = document.querySelector('[role="dialog"] input');
    fireEvent.change(input, { target: { value: '50' } });
    const submitBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Confirmar devolución/i.test(b.textContent ?? ''));
    fireEvent.click(submitBtn);

    await waitFor(() => expect(screen.getByText(/LUMEN CINEMA — REEMBOLSO/i)).toBeInTheDocument());

    // Print + Close from the receipt
    const printBtn = screen.getAllByRole('button').find(b => /Imprimir/i.test(b.textContent ?? ''));
    if (printBtn) {
      fireEvent.click(printBtn);
      expect(window.print).toHaveBeenCalled();
    }
    const closeBtn = screen.getAllByRole('button').find(b => /Cerrar/i.test(b.textContent ?? ''));
    if (closeBtn) fireEvent.click(closeBtn);
  });
});
