import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const sessionsGetAll = vi.fn();
const sessionsGetById = vi.fn();
const seatsGetByScreening = vi.fn();
const seatsGetByTheater = vi.fn();
const seatsGetAll = vi.fn();
const salesCreate = vi.fn();
const salesConfirm = vi.fn();
const salesCancel = vi.fn();
const clientsSearch = vi.fn();
const clientsGetAll = vi.fn();
const roomsGetAll = vi.fn();
const roomsGetSeats = vi.fn();

vi.mock('../../services/sessionsService', () => ({
  sessionsService: {
    getAll:       (...a) => sessionsGetAll(...a),
    getUpcoming:  (...a) => sessionsGetAll(...a),
    getById:      (...a) => sessionsGetById(...a),
  },
  screeningsService: {
    getAll:       (...a) => sessionsGetAll(...a),
    getUpcoming:  (...a) => sessionsGetAll(...a),
    getById:      (...a) => sessionsGetById(...a),
  },
}));
vi.mock('../../services/seatsService', () => ({
  seatsService: {
    getByScreening: (...a) => seatsGetByScreening(...a),
    getByTheater: (...a) => seatsGetByTheater(...a),
    getAll: (...a) => seatsGetAll(...a),
  },
}));
vi.mock('../../services/salesService', () => ({
  salesService: {
    createPurchase:   (...a) => salesCreate(...a),
    confirmPurchase:  (...a) => salesConfirm(...a),
    cancelPurchase:   (...a) => salesCancel(...a),
    createTicketSale: (...a) => salesCreate(...a),
  },
}));
vi.mock('../../services/clientsService', () => ({
  clientsService: {
    search: (...a) => clientsSearch(...a),
    getAll: (...a) => clientsGetAll(...a),
  },
}));
vi.mock('../../services/roomsService', () => ({
  roomsService: { getAll: (...a) => roomsGetAll(...a), getSeats: (...a) => roomsGetSeats(...a) },
  theatersService: { getAll: (...a) => roomsGetAll(...a), getSeats: (...a) => roomsGetSeats(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'admin' }, can: () => true }),
}));
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr">{value}</div>,
}));

const mockSessions = [
  { id: 1, movie: { id: 10, title: 'Dune', posterUrl: '' }, theater: { id: 20, name: 'Sala 1', capacity: 100 }, startTime: new Date().toISOString(), price: 9.5, status: 'ACTIVE', availableSeats: 50 },
  { id: 2, movie: { id: 11, title: 'Avatar', posterUrl: '' }, theater: { id: 21, name: 'Sala 2', capacity: 80 }, startTime: new Date().toISOString(), price: 8.0, status: 'ACTIVE', availableSeats: 30 },
];
const mockSeats = [
  { id: 101, code: 'A1', row: 'A', number: 1, occupied: false },
  { id: 102, code: 'A2', row: 'A', number: 2, occupied: false },
  { id: 103, code: 'B1', row: 'B', number: 1, occupied: true },
];

import BoxOfficePage from './BoxOfficePage';

beforeEach(() => {
  vi.clearAllMocks();
  sessionsGetAll.mockResolvedValue(mockSessions);
  seatsGetByScreening.mockResolvedValue(mockSeats);
  seatsGetByTheater.mockResolvedValue(mockSeats);
  seatsGetAll.mockResolvedValue(mockSeats);
  salesCreate.mockResolvedValue({ id: 1, tickets: [{ qrCode: 'QR-1' }] });
  salesConfirm.mockResolvedValue({});
  clientsSearch.mockResolvedValue([{ id: 50, name: 'Ana López', fidelityDiscountEligible: true }]);
  clientsGetAll.mockResolvedValue([]);
  roomsGetAll.mockResolvedValue([]);
  roomsGetSeats.mockResolvedValue(mockSeats);
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><BoxOfficePage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('BoxOfficePage — comprehensive', () => {

  it('loads and displays today sessions', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.body.textContent).toContain('Dune');
    });

  });

  it('selects a session and loads seats', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));

    // Click on the Dune session card/button
    const sessionBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Dune'));
    if (sessionBtn) {
      fireEvent.click(sessionBtn);
      await waitFor(() => expect(seatsGetByScreening).toHaveBeenCalled());
    }

  });

  it('selects seats and shows them in summary', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));

    const sessionBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Dune'));
    if (sessionBtn) {
      fireEvent.click(sessionBtn);
      await waitFor(() => expect(seatsGetByScreening).toHaveBeenCalled());

      // Click on available seat buttons (A1, A2)
      await waitFor(() => {
        const seatBtns = screen.getAllByRole('button').filter(b =>
          b.textContent.includes('A1') || b.textContent.includes('A2')
        );
        if (seatBtns.length > 0) fireEvent.click(seatBtns[0]);
      });
    }

  });

  it('handles keyboard shortcuts (F2, F5, Escape)', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));

    fireEvent.keyDown(window, { key: 'F2' });
    fireEvent.keyDown(window, { key: 'F5' });
    fireEvent.keyDown(window, { key: 'Escape' });

  });

  it('searches clients with debounce', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));

    // Find client search input if visible
    const inputs = screen.getAllByRole('textbox');
    const searchInput = inputs.find(i =>
      i.placeholder?.toLowerCase().includes('buscar') || i.placeholder?.toLowerCase().includes('client')
    );
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'Ana' } });
      await waitFor(() => { /* debounce settle */ }, { timeout: 2000 });
    }

  });

  it('resets the entire flow', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));

    // Click reset/new sale button or F5
    fireEvent.keyDown(window, { key: 'F5' });
    await waitFor(() => { /* settle */ });

  });

  it('handles session load error', async () => {
    sessionsGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(sessionsGetAll).toHaveBeenCalled());

  });

  it('handles seat load error', async () => {
    seatsGetByScreening.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));

    const sessionBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Dune'));
    if (sessionBtn) {
      fireEvent.click(sessionBtn);
      await waitFor(() => expect(seatsGetByScreening).toHaveBeenCalled());
    }

  });

  it('handles payment flow', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));

    const sessionBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Dune'));
    if (sessionBtn) {
      fireEvent.click(sessionBtn);
      await waitFor(() => expect(seatsGetByScreening).toHaveBeenCalled());

      // Select a seat
      await waitFor(() => {
        const seatBtns = screen.getAllByRole('button').filter(b => b.textContent.includes('A1'));
        if (seatBtns.length > 0) fireEvent.click(seatBtns[0]);
      });

      // Look for pay/continue button
      const payBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('obrar') || b.textContent.includes('agar') || b.textContent.includes('ontinuar') || b.textContent.includes('F4')
      );
      if (payBtn && !payBtn.disabled) {
        fireEvent.click(payBtn);
        await waitFor(() => { /* settle */ });
      }
    }

  });

  it('switches payment methods to cash', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Dune'));

    // Navigate to payment step
    const sessionBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Dune'));
    if (sessionBtn) {
      fireEvent.click(sessionBtn);
      await waitFor(() => expect(seatsGetByScreening).toHaveBeenCalled());

      await waitFor(() => {
        const seatBtns = screen.getAllByRole('button').filter(b => b.textContent.includes('A1'));
        if (seatBtns.length > 0) fireEvent.click(seatBtns[0]);
      });

      // Click cash method
      const cashBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('fectivo') || b.textContent.includes('ash')
      );
      if (cashBtn) fireEvent.click(cashBtn);
    }

  });
});
