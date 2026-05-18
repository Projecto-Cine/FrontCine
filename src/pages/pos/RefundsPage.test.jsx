import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

/* ── Service mocks (declare fns first, then mock with delegates) ── */
const sessionsGetAll = vi.fn();
const sessionsGetPurchases = vi.fn();
const salesCancelPurchase = vi.fn();
const merchSalesGetAll = vi.fn();
const merchSalesRemove = vi.fn();

vi.mock('../../services/sessionsService', () => ({
  sessionsService: {
    getAll: (...a) => sessionsGetAll(...a),
    getPurchases: (...a) => sessionsGetPurchases(...a),
  },
}));
vi.mock('../../services/salesService', () => ({
  salesService: { cancelPurchase: (...a) => salesCancelPurchase(...a) },
}));
vi.mock('../../services/merchandiseSalesService', () => ({
  merchandiseSalesService: {
    getAll: (...a) => merchSalesGetAll(...a),
    remove: (...a) => merchSalesRemove(...a),
  },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'admin' }, can: () => true }),
}));
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr">{value}</div>,
}));

import RefundsPage from './RefundsPage';

const TODAY = new Date().toISOString().split('T')[0];
const mockSessions = [
  {
    id: 1,
    startTime: `${TODAY}T20:00:00`,
    dateTime: `${TODAY}T20:00:00`,
    movie: { id: 10, title: 'Dune' },
    theater: { id: 20, name: 'Sala 1' },
  },
  {
    id: 2,
    startTime: `${TODAY}T22:00:00`,
    dateTime: `${TODAY}T22:00:00`,
    movie: { id: 11, title: 'Avatar' },
    theater: { id: 21, name: 'Sala 2' },
  },
];
const mockPurchases = [
  {
    id: 100,
    status: 'PAID',
    totalAmount: 27,
    paymentMethod: 'CARD',
    createdAt: `${TODAY}T19:00:00`,
    user: { id: 5, name: 'Ana López', email: 'ana@x.com' },
    tickets: [
      { seat: { row: 'A', number: 1 }, ticketType: 'ADULT' },
      { seat: { row: 'A', number: 2 }, ticketType: 'ADULT' },
    ],
  },
  {
    id: 101,
    status: 'PENDING',
    totalAmount: 13.5,
    paymentMethod: null,
    createdAt: `${TODAY}T18:00:00`,
    user: { id: 6, name: 'Bruno Ruiz', email: 'bruno@x.com' },
    tickets: [],
  },
  {
    id: 102,
    status: 'CANCELLED',
    totalAmount: 9,
    paymentMethod: 'CASH',
    createdAt: `${TODAY}T17:00:00`,
    user: { username: 'carla' },
    tickets: [],
  },
];
const mockMerchSales = [
  {
    id: 200,
    merchandise: { id: 1, name: 'Palomitas', price: 6.5 },
    quantity: 2,
    totalPrice: 13,
    saleDate: `${TODAY}T18:00:00`,
    user: { name: 'Diego' },
  },
  {
    id: 201,
    merchandise: { id: 2, name: 'Coca-Cola', price: 3.5 },
    quantity: 1,
    totalPrice: 3.5,
    saleDate: `${TODAY}T18:30:00`,
    user: { username: 'eli' },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  sessionsGetAll.mockResolvedValue(mockSessions);
  sessionsGetPurchases.mockResolvedValue(mockPurchases);
  salesCancelPurchase.mockResolvedValue({});
  merchSalesGetAll.mockResolvedValue(mockMerchSales);
  merchSalesRemove.mockResolvedValue({});
  window.print = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AppProvider>
          <RefundsPage />
        </AppProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('RefundsPage — comprehensive', () => {
  it('renders title and tabs', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Reembolsos')).toBeInTheDocument());
    expect(screen.getByText(/Taquilla/i)).toBeInTheDocument();
    expect(screen.getByText(/Caja/i)).toBeInTheDocument();
  });

  it('loads sessions for the chosen date (ticket tab default)', async () => {
    renderPage();
    await waitFor(() => expect(sessionsGetAll).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    expect(screen.getByText('Avatar')).toBeInTheDocument();
  });

  it('selects a session and loads its purchases', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    // Click on Dune session
    const sessionBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Dune'));
    fireEvent.click(sessionBtn);

    await waitFor(() => expect(sessionsGetPurchases).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());
  });

  it('filters purchases by search input', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    const sessionBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Dune'));
    fireEvent.click(sessionBtn);
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const search = document.querySelector('input[placeholder*="Buscar"]');
    fireEvent.change(search, { target: { value: 'Ana' } });
    await waitFor(() => expect(screen.queryByText('Bruno Ruiz')).not.toBeInTheDocument());

    fireEvent.change(search, { target: { value: '' } });
    await waitFor(() => expect(screen.getByText('Bruno Ruiz')).toBeInTheDocument());
  });

  it('opens refund confirmation modal for a PAID purchase', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent.includes('Dune')));
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const refundBtn = screen.getAllByRole('button').find(b => /Reembolsar/i.test(b.textContent ?? ''));
    fireEvent.click(refundBtn);

    await waitFor(() => expect(screen.getByText(/Confirmar reembolso/i)).toBeInTheDocument());
  });

  it('cancels the confirmation modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent.includes('Dune')));
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const refundBtn = screen.getAllByRole('button').find(b => /Reembolsar/i.test(b.textContent ?? ''));
    fireEvent.click(refundBtn);
    await waitFor(() => expect(screen.getByText(/Confirmar reembolso/i)).toBeInTheDocument());

    const cancelBtn = screen.getAllByRole('button').find(b => b.textContent === 'Cancelar');
    fireEvent.click(cancelBtn);
    await waitFor(() => expect(screen.queryByText(/Confirmar reembolso/i)).not.toBeInTheDocument());
  });

  it('processes a ticket refund and shows receipt', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent.includes('Dune')));
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const refundBtn = screen.getAllByRole('button').find(b => /Reembolsar/i.test(b.textContent ?? ''));
    fireEvent.click(refundBtn);
    await waitFor(() => expect(screen.getByText(/Confirmar reembolso/i)).toBeInTheDocument());

    const confirmBtn = screen.getAllByRole('button').find(b => /Sí, reembolsar/i.test(b.textContent ?? ''));
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(salesCancelPurchase).toHaveBeenCalledWith(100));
    await waitFor(() => expect(screen.getByText(/LUMEN CINEMA — REEMBOLSO/i)).toBeInTheDocument());
  });

  it('closes refund receipt', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent.includes('Dune')));
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button').find(b => /Reembolsar/i.test(b.textContent ?? '')));
    await waitFor(() => screen.getByText(/Confirmar reembolso/i));
    fireEvent.click(screen.getAllByRole('button').find(b => /Sí, reembolsar/i.test(b.textContent ?? '')));

    await waitFor(() => expect(screen.getByText(/LUMEN CINEMA — REEMBOLSO/i)).toBeInTheDocument());

    const closeBtn = screen.getAllByRole('button').find(b => /Cerrar/i.test(b.textContent ?? ''));
    fireEvent.click(closeBtn);
  });

  it('prints from refund receipt', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent.includes('Dune')));
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button').find(b => /Reembolsar/i.test(b.textContent ?? '')));
    await waitFor(() => screen.getByText(/Confirmar reembolso/i));
    fireEvent.click(screen.getAllByRole('button').find(b => /Sí, reembolsar/i.test(b.textContent ?? '')));

    await waitFor(() => expect(screen.getByText(/LUMEN CINEMA — REEMBOLSO/i)).toBeInTheDocument());
    const printBtn = screen.getAllByRole('button').find(b => /Imprimir/i.test(b.textContent ?? ''));
    fireEvent.click(printBtn);
    expect(window.print).toHaveBeenCalled();
  });

  it('handles purchases load error', async () => {
    sessionsGetPurchases.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent.includes('Dune')));
    await waitFor(() => expect(sessionsGetPurchases).toHaveBeenCalled());
  });

  it('handles refund processing error', async () => {
    salesCancelPurchase.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent.includes('Dune')));
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button').find(b => /Reembolsar/i.test(b.textContent ?? '')));
    await waitFor(() => screen.getByText(/Confirmar reembolso/i));
    fireEvent.click(screen.getAllByRole('button').find(b => /Sí, reembolsar/i.test(b.textContent ?? '')));

    await waitFor(() => expect(salesCancelPurchase).toHaveBeenCalled());
  });

  it('changes date filter and reloads sessions', async () => {
    renderPage();
    await waitFor(() => expect(sessionsGetAll).toHaveBeenCalled());

    const dateInput = document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: '2026-06-01' } });
    await waitFor(() => expect(sessionsGetAll).toHaveBeenCalledTimes(2));
  });

  it('handles session load error', async () => {
    sessionsGetAll.mockRejectedValueOnce(new Error('Net'));
    renderPage();
    await waitFor(() => expect(sessionsGetAll).toHaveBeenCalled());
  });

  it('switches to merchandise tab and loads sales', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Reembolsos')).toBeInTheDocument());

    const merchTab = screen.getAllByRole('button').find(b => /Caja/i.test(b.textContent ?? ''));
    fireEvent.click(merchTab);
    await waitFor(() => expect(merchSalesGetAll).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());
    expect(screen.getByText('Coca-Cola')).toBeInTheDocument();
  });

  it('filters merchandise sales by search', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button').find(b => /Caja/i.test(b.textContent ?? '')));
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    const search = document.querySelector('input[placeholder*="Buscar"]');
    fireEvent.change(search, { target: { value: 'Palomitas' } });
    await waitFor(() => expect(screen.queryByText('Coca-Cola')).not.toBeInTheDocument());
  });

  it('processes a merchandise refund', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button').find(b => /Caja/i.test(b.textContent ?? '')));
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    const refundBtn = screen.getAllByRole('button').find(b => /Reembolsar/i.test(b.textContent ?? ''));
    fireEvent.click(refundBtn);
    await waitFor(() => expect(screen.getByText(/Confirmar reembolso/i)).toBeInTheDocument());

    const confirmBtn = screen.getAllByRole('button').find(b => /Sí, reembolsar/i.test(b.textContent ?? ''));
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(merchSalesRemove).toHaveBeenCalledWith(200));
    await waitFor(() => expect(screen.getByText(/LUMEN CINEMA — REEMBOLSO/i)).toBeInTheDocument());
  });

  it('handles merchandise refund error', async () => {
    merchSalesRemove.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    fireEvent.click(screen.getAllByRole('button').find(b => /Caja/i.test(b.textContent ?? '')));
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button').find(b => /Reembolsar/i.test(b.textContent ?? '')));
    await waitFor(() => screen.getByText(/Confirmar reembolso/i));
    fireEvent.click(screen.getAllByRole('button').find(b => /Sí, reembolsar/i.test(b.textContent ?? '')));

    await waitFor(() => expect(merchSalesRemove).toHaveBeenCalled());
  });

  it('cancels merchandise refund modal', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button').find(b => /Caja/i.test(b.textContent ?? '')));
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button').find(b => /Reembolsar/i.test(b.textContent ?? '')));
    await waitFor(() => screen.getByText(/Confirmar reembolso/i));

    const cancelBtn = screen.getAllByRole('button').find(b => b.textContent === 'Cancelar');
    fireEvent.click(cancelBtn);
    await waitFor(() => expect(screen.queryByText(/Confirmar reembolso/i)).not.toBeInTheDocument());
  });

  it('handles merchandise sales load error', async () => {
    merchSalesGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    fireEvent.click(screen.getAllByRole('button').find(b => /Caja/i.test(b.textContent ?? '')));
    await waitFor(() => expect(merchSalesGetAll).toHaveBeenCalled());
  });

  it('changes merchandise date filter', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button').find(b => /Caja/i.test(b.textContent ?? '')));
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    const dateInput = document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: '2024-01-01' } });
    await waitFor(() => expect(screen.queryByText('Palomitas')).not.toBeInTheDocument());
  });

  it('shows empty state for sessions with no purchases', async () => {
    sessionsGetPurchases.mockResolvedValueOnce([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent.includes('Dune')));
    await waitFor(() => expect(screen.getByText(/No hay compras para esta sesión/i)).toBeInTheDocument());
  });

  it('shows empty state when no sessions for selected day', async () => {
    sessionsGetAll.mockResolvedValueOnce([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/Sin sesiones para este día/i)).toBeInTheDocument());
  });

  it('closes ticket refund confirm modal via X icon button', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent.includes('Dune')));
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button').find(b => /Reembolsar/i.test(b.textContent ?? '')));
    await waitFor(() => screen.getByText(/Confirmar reembolso/i));

    // The X button has no text — find it by parent header
    // The X close button is the first button inside the modal that's not the cancel/confirm one
    const allButtons = screen.getAllByRole('button');
    const xButton = allButtons.find(b => {
      // Skip cancel + confirm buttons
      if (/Cancelar|reembolsar/i.test(b.textContent ?? '')) return false;
      // SVG-only X button (no text)
      return b.textContent.trim() === '' && b.querySelector('svg');
    });
    if (xButton) fireEvent.click(xButton);
    await waitFor(() => expect(screen.queryByText(/Confirmar reembolso/i)).not.toBeInTheDocument());
  });

  it('closes merchandise refund confirm modal via X icon button', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button').find(b => /Caja/i.test(b.textContent ?? '')));
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button').find(b => /Reembolsar/i.test(b.textContent ?? '')));
    await waitFor(() => screen.getByText(/Confirmar reembolso/i));

    // The X close button is the first button inside the modal that's not the cancel/confirm one
    const allButtons = screen.getAllByRole('button');
    const xButton = allButtons.find(b => {
      // Skip cancel + confirm buttons
      if (/Cancelar|reembolsar/i.test(b.textContent ?? '')) return false;
      // SVG-only X button (no text)
      return b.textContent.trim() === '' && b.querySelector('svg');
    });
    if (xButton) fireEvent.click(xButton);
    await waitFor(() => expect(screen.queryByText(/Confirmar reembolso/i)).not.toBeInTheDocument());
  });

  it('switches back to ticket tab from merchandise (covers tab branch)', async () => {
    renderPage();
    // Switch to merch
    fireEvent.click(screen.getAllByRole('button').find(b => /Caja/i.test(b.textContent ?? '')));
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());
    // Switch back to taquilla
    fireEvent.click(screen.getAllByRole('button').find(b => /Taquilla/i.test(b.textContent ?? '')));
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
  });

  it('renders merchandise sales with missing user (uses "Cliente anónimo" fallback)', async () => {
    merchSalesGetAll.mockResolvedValueOnce([
      { id: 300, merchandise: { name: 'X', price: 1 }, quantity: 1, totalPrice: 1, saleDate: `${TODAY}T18:00:00` },
    ]);
    renderPage();
    fireEvent.click(screen.getAllByRole('button').find(b => /Caja/i.test(b.textContent ?? '')));
    await waitFor(() => expect(screen.getByText('Cliente anónimo')).toBeInTheDocument());
  });

  it('renders ticket purchases with no tickets array (no seats badges)', async () => {
    sessionsGetPurchases.mockResolvedValueOnce([
      { id: 500, status: 'PAID', totalAmount: 10, paymentMethod: 'CARD', user: { name: 'Z' } },
    ]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent.includes('Dune')));
    await waitFor(() => expect(screen.getByText('Z')).toBeInTheDocument());
  });

  it('renders merchandise sale using createdAt fallback for date', async () => {
    merchSalesGetAll.mockResolvedValueOnce([
      { id: 301, merchandise: { name: 'Y', price: 2 }, quantity: 3, totalPrice: 6, createdAt: `${TODAY}T19:00:00`, user: { username: 'guille' } },
    ]);
    renderPage();
    fireEvent.click(screen.getAllByRole('button').find(b => /Caja/i.test(b.textContent ?? '')));
    await waitFor(() => expect(screen.getByText('guille')).toBeInTheDocument());
  });
});
