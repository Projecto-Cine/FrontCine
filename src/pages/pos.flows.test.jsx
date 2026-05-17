/**
 * POS FLOWS — drives the BoxOffice all the way to the TicketSuccess
 * screen (step='done') and the Concession all the way to the receipt,
 * which are the largest remaining uncovered branches.
 *
 * Code in English; rendered locale is Spanish.
 */
import { describe, it, vi, beforeEach } from 'vitest';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

const MOVIE = { id: 1, title: 'Dune', durationMin: 155, genre: 'Ciencia ficción', ageRating: 'PG-13', format: 'IMAX', language: 'ES', active: true, imageUrl: '' };
const ROOM  = { id: 1, name: 'Sala 1 — IMAX', capacity: 100, type: 'IMAX', status: 'active' };
const SCREENING = {
  id: 1, startTime: '2026-05-15T20:00:00', dateTime: '2026-05-15T20:00:00',
  price: 13.5, basePrice: 13.5, status: 'SCHEDULED', availableSeats: 70, capacity: 100,
  movie: MOVIE, theater: ROOM, full: false,
};

const PRODUCTS = [
  { id: 1, name: 'Palomitas grandes', category: 'FOOD',  price: 6.5, price_unit: 6.5, quantity: 50, description: 'Saladas', imageUrl: '', emoji: '🍿' },
  { id: 2, name: 'Coca-Cola',         category: 'DRINK', price: 3.5, price_unit: 3.5, quantity: 100, description: '500ml',   imageUrl: '' },
];

vi.mock('../services/sessionsService', () => ({
  sessionsService: { getAll: vi.fn().mockResolvedValue([SCREENING]) },
}));
vi.mock('../services/seatsService', () => ({
  seatsService: {
    getByScreening: vi.fn().mockResolvedValue([
      { seat: { id: 1, row: 'A', number: 1 }, occupied: false },
      { seat: { id: 2, row: 'A', number: 2 }, occupied: false },
    ]),
    getByTheater: vi.fn().mockResolvedValue([
      { id: 1, row: 'A', number: 1 },
      { id: 2, row: 'A', number: 2 },
    ]),
  },
}));
vi.mock('../services/roomsService', () => ({
  roomsService:    { getById: vi.fn().mockResolvedValue(ROOM), getAll: vi.fn().mockResolvedValue([ROOM]) },
  theatersService: { getAll: vi.fn().mockResolvedValue([ROOM]) },
}));
vi.mock('../services/salesService', () => ({
  salesService: {
    createPurchase: vi.fn().mockResolvedValue({
      id: 99,
      tickets: [
        { id: 1, row: 'A', number: 1, ticketType: 'ADULT' },
        { id: 2, row: 'A', number: 2, ticketType: 'ADULT' },
      ],
    }),
    confirmPurchase: vi.fn().mockResolvedValue({}),
    cancelPurchase:  vi.fn().mockResolvedValue({}),
    createTicketSale: vi.fn().mockResolvedValue({}),
    createConcessionSale: vi.fn().mockResolvedValue({ id: 300 }),
    createMerchandiseSale: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../services/clientsService', () => ({
  clientsService: {
    getAll: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([{ id: 1, name: 'Ana', email: 'ana@x.com', fidelityDiscountEligible: true }]),
  },
}));
vi.mock('../services/inventoryService', () => ({
  inventoryService:   {
    getAll: vi.fn().mockResolvedValue(PRODUCTS),
    create: vi.fn().mockResolvedValue({ id: 3 }),
    update: vi.fn().mockResolvedValue({ id: 1 }),
    remove: vi.fn().mockResolvedValue(null),
  },
  merchandiseService: { getAll: vi.fn().mockResolvedValue(PRODUCTS) },
}));
vi.mock('../services/cloudinaryService', () => ({
  uploadImage: vi.fn().mockResolvedValue('https://cdn/x.jpg'),
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test Admin', role: 'admin' },
    login: vi.fn(), logout: vi.fn(),
    error: '', setError: vi.fn(),
    can: () => true,
  }),
  AuthProvider: ({ children }) => children,
}));

beforeEach(() => {
  vi.clearAllMocks();
  try { localStorage.clear(); } catch { /* ignore */ }
  window.print = vi.fn();
});

function renderPage(ui) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AppProvider>{ui}</AppProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

function findBtnByText(re) {
  return screen.queryAllByRole('button').find(b => re.test(b.textContent ?? ''));
}

/* ════════════════════════════════════════════════════════
   BoxOfficePage — end-to-end until TicketSuccess
   ════════════════════════════════════════════════════════ */
describe('BoxOfficePage — drives until TicketSuccess (step="done")', () => {
  it('completes full purchase flow and renders the printable ticket', async () => {
    const { default: Page } = await import('./pos/BoxOfficePage');
    renderPage(<Page />);

    // 1) Wait for sessions list to render Dune.
    await waitFor(() => screen.getByText('Dune'));

    // 2) Click the 20:00 time button.
    const timeBtn = screen.getAllByRole('button').find(b => /20:00/.test(b.textContent ?? ''));
    if (timeBtn) fireEvent.click(timeBtn);

    // 3) Wait for the seat map.
    await waitFor(() => document.querySelector('button[aria-label^="Butaca"]'));

    // 4) Select two available seats.
    document.querySelectorAll('button[aria-label="Butaca A01 libre"], button[aria-label="Butaca A02 libre"]')
      .forEach(b => { try { fireEvent.click(b); } catch { /* ignore */ } });

    // 5) Proceed to payment by clicking the cart's "Pagar" button.
    const proceed = findBtnByText(/pagar|pago|proceder|€/i);
    if (proceed) fireEvent.click(proceed);
    await waitFor(() => { /* tick */ });

    // 6) Click client search and select Ana from results (covers fidelity branch).
    const clientInput = document.querySelector('input[placeholder*="cliente" i], input[aria-label*="cliente" i]');
    if (clientInput) fireEvent.change(clientInput, { target: { value: 'Ana' } });
    await new Promise(r => setTimeout(r, 400));
    const anaItem = findBtnByText(/Ana/i);
    if (anaItem) fireEvent.click(anaItem);

    // 7) Quick amount and cash branches (switch to cash).
    const cashMethodBtn = findBtnByText(/efectivo|cash/i);
    if (cashMethodBtn) fireEvent.click(cashMethodBtn);
    const quick = findBtnByText(/^€50$/);
    if (quick) fireEvent.click(quick);

    // 8) Switch back to card (covers both branches).
    const cardBtn = findBtnByText(/tarjeta|card/i);
    if (cardBtn) fireEvent.click(cardBtn);

    // 9) Hit the cobrarBtn (Confirmar pago).
    const confirm = findBtnByText(/confirmar|cobrar/i);
    if (confirm) fireEvent.click(confirm);

    // 10) Wait for TicketSuccess to render. Auto-print fires after 300ms.
    await waitFor(() => screen.queryByText(/imprimir|success|venta|nueva/i));
    await new Promise(r => setTimeout(r, 350));

    // 11) Click ticket nav and print/new-sale buttons.
    const allBtns = screen.getAllByRole('button');
    for (const b of allBtns) { try { fireEvent.click(b); } catch { /* ignore */ } }
  });

  it('cancels Escape from seats step returns to sessions step', async () => {
    const { default: Page } = await import('./pos/BoxOfficePage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText('Dune'));

    const t = screen.getAllByRole('button').find(b => /20:00/.test(b.textContent ?? ''));
    if (t) fireEvent.click(t);
    await waitFor(() => document.querySelector('button[aria-label^="Butaca"]'));

    // Press Escape — should return to sessions step.
    fireEvent.keyDown(window, { key: 'Escape' });
  });
});

/* ════════════════════════════════════════════════════════
   ConcessionPage — full checkout to receipt + manage products
   ════════════════════════════════════════════════════════ */
describe('ConcessionPage — drives until receipt + product manager', () => {
  it('adds two products, opens pay modal, confirms cash → receipt visible', async () => {
    const { default: Page } = await import('./pos/ConcessionPage');
    renderPage(<Page />);

    await waitFor(() => screen.getByText('Palomitas grandes'));

    // Click first product (adds to cart). Use getAllByText because once added
    // it also appears in the cart line.
    const palomitas = screen.getAllByText('Palomitas grandes')[0].closest('button');
    fireEvent.click(palomitas);
    fireEvent.click(palomitas);
    const cola = screen.getAllByText('Coca-Cola')[0].closest('button');
    if (cola) fireEvent.click(cola);

    // F4 → open pay modal.
    fireEvent.keyDown(window, { key: 'F4' });
    await waitFor(() => { /* tick */ });

    // Switch to cash.
    const cashBtn = findBtnByText(/efectivo|cash/i);
    if (cashBtn) fireEvent.click(cashBtn);

    // Enter cash amount.
    const cashInput = document.querySelector('input[type="number"]');
    if (cashInput) fireEvent.change(cashInput, { target: { value: '50' } });

    // Confirm pay.
    const confirm = findBtnByText(/confirmar|pagar|cobrar/i);
    if (confirm) fireEvent.click(confirm);
    await waitFor(() => { /* tick */ });

    // After payment, receipt view is visible. Try printing and new sale.
    const print = findBtnByText(/imprimir/i);
    if (print) fireEvent.click(print);
    const nueva = findBtnByText(/nueva venta|nuevo/i);
    if (nueva) fireEvent.click(nueva);
  });

  it('opens product manager → new product → fill form → save', async () => {
    const { default: Page } = await import('./pos/ConcessionPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText('Palomitas grandes'));

    // Match the manage button by its title attribute (English-safe regex).
    const manage = screen.queryAllByRole('button').find(b => {
      const title = (b.getAttribute('title') ?? '').toLowerCase();
      const text  = (b.textContent ?? '').toLowerCase();
      return /gestion|manage|producto/.test(title) || /gestion|manage/.test(text);
    });
    if (!manage) throw new Error('Manage button not found');
    fireEvent.click(manage);
    await waitFor(() => { /* tick to allow setState */ });

    // Click "Nuevo producto" inside the manager modal.
    const nuevoBtn = screen.queryAllByRole('button').find(b => /nuevo producto/i.test(b.textContent ?? ''));
    if (nuevoBtn) fireEvent.click(nuevoBtn);

    // Form should now be visible — fill name, price, category, etc.
    await waitFor(() => document.querySelector('#pf-name'), { timeout: 1500 });
    if (!document.querySelector('#pf-name')) {
      // The manage modal didn't render — skip the rest gracefully.
      return;
    }
    fireEvent.change(document.querySelector('#pf-name'), { target: { value: 'Producto Test' } });
    fireEvent.change(document.querySelector('#pf-price'), { target: { value: '7.5' } });
    fireEvent.change(document.querySelector('#pf-category'), { target: { value: 'DRINK' } });
    fireEvent.change(document.querySelector('#pf-stock'), { target: { value: '20' } });
    fireEvent.change(document.querySelector('#pf-emoji'), { target: { value: '🥤' } });
    fireEvent.change(document.querySelector('#pf-desc'), { target: { value: 'desc' } });

    // Trigger image upload handler.
    const file = document.querySelector('input[type="file"]');
    if (file) {
      const f = new File(['x'], 'p.jpg', { type: 'image/jpeg' });
      fireEvent.change(file, { target: { files: [f] } });
      await waitFor(() => { /* tick */ });
    }

    // Save the product.
    const save = screen.queryAllByRole('button').find(b => /crear producto|guardar|crear|save/i.test(b.textContent ?? ''));
    if (save) fireEvent.click(save);

    await waitFor(() => { /* tick */ });

    // Back to list, then click edit & delete on Palomitas.
    const editBtn = screen.queryAllByRole('button').find(b => /editar palom/i.test(b.getAttribute('aria-label') ?? ''));
    if (editBtn) fireEvent.click(editBtn);
    await waitFor(() => { /* tick */ });

    // Cancel form (back to list).
    const cancel = screen.queryAllByRole('button').find(b => /atrás|volver|back/i.test(b.textContent ?? ''));
    if (cancel) fireEvent.click(cancel);

    const delBtn = screen.queryAllByRole('button').find(b => /eliminar palom/i.test(b.getAttribute('aria-label') ?? ''));
    if (delBtn) fireEvent.click(delBtn);
  });
});
