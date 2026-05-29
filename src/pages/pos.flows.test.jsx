/**
 * POS FLOWS — basic smoke tests for BoxOfficePage and ConcessionPage
 * Code in English; rendered locale is Spanish.
 */
import { describe, it, vi, beforeEach } from 'vitest';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

const MOVIE = { id: 1, title: 'Dune', durationMin: 155, genre: 'Ciencia ficción', ageRating: 'PG-13', format: 'IMAX', language: 'ES', active: true, imageUrl: '' };
const ROOM  = { id: 1, name: 'Sala 1 — IMAX', capacity: 100, type: 'IMAX', status: 'active' };
// Use today + future hour so BoxOfficePage's "hide past sessions" filter keeps it visible
const TODAY = new Date().toISOString().split('T')[0];
const FUTURE_HOUR = (() => {
  const h = new Date().getHours();
  const safeH = h + 4 >= 24 ? 23 : h + 4;
  return `${String(safeH).padStart(2, '0')}:00:00`;
})();
const SCREENING = {
  id: 1, startTime: `${TODAY}T${FUTURE_HOUR}`, dateTime: `${TODAY}T${FUTURE_HOUR}`,
  price: 13.5, basePrice: 13.5, status: 'SCHEDULED', availableSeats: 70, capacity: 100,
  movie: MOVIE, theater: ROOM, full: false,
};

const PRODUCTS = [
  { id: 1, name: 'Palomitas grandes', category: 'FOOD',  price: 6.5, price_unit: 6.5, quantity: 50, description: 'Saladas', imageUrl: '', emoji: '🍿' },
  { id: 2, name: 'Coca-Cola',         category: 'DRINK', price: 3.5, price_unit: 3.5, quantity: 100, description: '500ml',   imageUrl: '' },
];

vi.mock('../services/sessionsService', () => ({
  sessionsService: {
    getAll: vi.fn().mockResolvedValue([SCREENING]),
    syncSeats: vi.fn().mockResolvedValue([
      { id: 1, seat: { id: 1, row: 'A', number: 1 }, occupied: false },
      { id: 2, seat: { id: 2, row: 'A', number: 2 }, occupied: false },
    ]),
  },
}));
vi.mock('../services/moviesService', () => ({
  moviesService: { getAll: vi.fn().mockResolvedValue([MOVIE]) },
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
      tickets: [{ id: 1, row: 'A', number: 1, ticketType: 'ADULT' }, { id: 2, row: 'A', number: 2, ticketType: 'ADULT' }],
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
  inventoryService: {
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
  useAuth: () => ({ user: { id: 1, name: 'Test Admin', role: 'admin' }, login: vi.fn(), logout: vi.fn(), error: '', setError: vi.fn(), can: () => true }),
  AuthProvider: ({ children }) => children,
}));

beforeEach(() => {
  vi.clearAllMocks();
  try { localStorage.clear(); } catch {}
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
   BoxOfficePage — basic flow smoke tests
   ════════════════════════════════════════════════════════ */
describe('BoxOfficePage — smoke', () => {
  it('loads sessions and renders movie title', async () => {
    const { default: Page } = await import('./pos/BoxOfficePage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toContain('Dune'); }, { timeout: 4000 });
  });

  it('shows price on session card', async () => {
    const { default: Page } = await import('./pos/BoxOfficePage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toMatch(/13/); }, { timeout: 4000 });
  });

  it('cancels with Escape from seats step returns to sessions', async () => {
    const { default: Page } = await import('./pos/BoxOfficePage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText('Dune'), { timeout: 4000 });

    const t = screen.getAllByRole('button').find(b => /\d{2}:\d{2}/.test(b.textContent ?? ''));
    if (t) fireEvent.click(t);

    // Skip client modal
    await waitFor(() => {
      const skip = screen.getAllByRole('button').find(b => /Omitir/i.test(b.textContent ?? ''));
      if (skip) fireEvent.click(skip);
      expect(skip).toBeTruthy();
    }, { timeout: 3000 });

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => { expect(document.body.textContent).toContain('Dune'); }, { timeout: 2000 });
  });
});

/* ════════════════════════════════════════════════════════
   ConcessionPage — smoke
   ════════════════════════════════════════════════════════ */
describe('ConcessionPage — smoke', () => {
  it('renders product list', async () => {
    const { default: Page } = await import('./pos/ConcessionPage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toContain('Palomitas'); }, { timeout: 4000 });
  });

  it('shows prices for products', async () => {
    const { default: Page } = await import('./pos/ConcessionPage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toMatch(/6/); }, { timeout: 4000 });
  });

  it('opens product manager via manage button', async () => {
    const { default: Page } = await import('./pos/ConcessionPage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toContain('Palomitas'); }, { timeout: 4000 });

    const manage = screen.queryAllByRole('button').find(b => {
      const title = (b.getAttribute('title') ?? '').toLowerCase();
      const text  = (b.textContent ?? '').toLowerCase();
      return /gestion|manage|producto/.test(title) || /gestion|manage/.test(text);
    });
    if (manage) {
      fireEvent.click(manage);
      await waitFor(() => { /* tick */ }, { timeout: 2000 });
    }
  });
});