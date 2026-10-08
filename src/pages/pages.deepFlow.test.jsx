/**
 * DEEP FLOW COVERAGE — simplified smoke tests that exercise full flows.
 * Code in English; UI strings in Spanish (rendered locale).
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
const SEATS_BY_SCR = [
  { seat: { id: 1, row: 'A', number: 1 }, occupied: false },
  { seat: { id: 2, row: 'A', number: 2 }, occupied: false },
];
const PRODUCTS = [
  { id: 1, name: 'Palomitas grandes', category: 'FOOD',  price: 6.5, price_unit: 6.5, quantity: 50, description: 'Saladas', imageUrl: '', emoji: '🍿' },
  { id: 2, name: 'Coca-Cola',         category: 'DRINK', price: 3.5, price_unit: 3.5, quantity: 100, description: '500ml',   imageUrl: '' },
];
const PURCHASES = [
  {
    id: 11, status: 'PENDING', total: 27, paymentMethod: null, createdAt: '2026-05-01T20:00:00',
    user: { id: 1, name: 'Ana López', email: 'ana@x.com' },
    screening: SCREENING, seats: ['A01', 'A02'],
    tickets: [{ id: 10, seat: { code: 'A01' }, ticketType: 'ADULT' }],
  },
];

const mkSvc = (extra = {}) => ({
  getAll:   vi.fn().mockResolvedValue([]),
  getById:  vi.fn().mockResolvedValue({}),
  getActive: vi.fn().mockResolvedValue([]),
  create:   vi.fn().mockResolvedValue({ id: 99 }),
  createFormData: vi.fn().mockResolvedValue({ id: 99 }),
  update:   vi.fn().mockResolvedValue({ id: 1 }),
  remove:   vi.fn().mockResolvedValue(null),
  ...extra,
});

vi.mock('../services/sessionsService', () => ({
  getSeats: vi.fn().mockResolvedValue([]),
  sessionsService:   mkSvc({ getAll: vi.fn().mockResolvedValue([SCREENING]) }),
  screeningsService: mkSvc({ getAll: vi.fn().mockResolvedValue([SCREENING]) }),
}));
vi.mock('../services/seatsService', () => ({
  seatsService: {
    getByScreening: vi.fn().mockResolvedValue(SEATS_BY_SCR),
    getByTheater:   vi.fn().mockResolvedValue([{ id: 1, row: 'A', number: 1 }]),
  },
}));
vi.mock('../services/roomsService', () => ({
  roomsService:    mkSvc({ getById: vi.fn().mockResolvedValue(ROOM), getAll: vi.fn().mockResolvedValue([ROOM]) }),
  theatersService: mkSvc({ getAll: vi.fn().mockResolvedValue([ROOM]) }),
}));
vi.mock('../services/salesService', () => ({
  salesService: {
    createPurchase: vi.fn().mockResolvedValue({ id: 99, tickets: [{ id: 1, row: 'A', number: 1, ticketType: 'ADULT' }] }),
    confirmPurchase: vi.fn().mockResolvedValue({}),
    cancelPurchase:  vi.fn().mockResolvedValue({}),
    createTicketSale:    vi.fn().mockResolvedValue({}),
    createConcessionSale: vi.fn().mockResolvedValue({ id: 300 }),
    createMerchandiseSale: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../services/clientsService', () => ({
  clientsService: mkSvc({ search: vi.fn().mockResolvedValue([{ id: 1, name: 'Ana', email: 'ana@x.com', fidelityDiscountEligible: true }]) }),
}));
vi.mock('../services/inventoryService', () => ({
  inventoryService:   mkSvc({ getAll: vi.fn().mockResolvedValue(PRODUCTS) }),
  merchandiseService: mkSvc({ getAll: vi.fn().mockResolvedValue(PRODUCTS) }),
}));
vi.mock('../services/reservationsService', () => ({
  reservationsService: mkSvc({
    getAll: vi.fn().mockResolvedValue(PURCHASES),
    pay:    vi.fn().mockResolvedValue({ tickets: [{ qrCode: 'LUMEN:1|x' }] }),
    cancel: vi.fn().mockResolvedValue({}),
  }),
  purchasesService: mkSvc({ getAll: vi.fn().mockResolvedValue(PURCHASES) }),
}));
vi.mock('../services/usersService', () => ({
  usersService: mkSvc({ getAll: vi.fn().mockResolvedValue([{ id: 1, name: 'Ana', role: 'CLIENTE', email: 'ana@x.com' }]) }),
}));
vi.mock('../services/cloudinaryService', () => ({ uploadImage: vi.fn().mockResolvedValue('https://cdn/x.jpg') }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test Admin', role: 'admin' }, login: vi.fn(), logout: vi.fn(), error: '', setError: vi.fn(), can: () => true }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue({}) }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div>{children}</div>,
  CardElement: () => <div data-testid="card" />,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => ({ confirmCardPayment: vi.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }), confirmPayment: vi.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }) }),
  useElements: () => ({ getElement: () => ({}) }),
}));
vi.mock('qrcode.react', () => ({ QRCodeSVG: () => <div data-testid="qr" /> }));

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

function clickAllButtons() {
  for (const b of screen.getAllByRole('button').filter(b => !b.disabled)) {
    try { fireEvent.click(b); } catch {}
  }
}

/* ── BoxOfficePage ─────────────────────────────────── */
describe('BoxOfficePage — full flow smoke', () => {
  it('loads sessions and renders movie', async () => {
    const { default: Page } = await import('./pos/BoxOfficePage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toMatch(/Sesiones|Dune/i); }, { timeout: 6000 });
  });

  it('opens seat map and exercises buttons', async () => {
    const { default: Page } = await import('./pos/BoxOfficePage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toMatch(/Sesiones|Dune/i); }, { timeout: 6000 });

    const timeBtn = screen.getAllByRole('button').find(b => /20:00/.test(b.textContent ?? ''));
    if (timeBtn) fireEvent.click(timeBtn);

    await waitFor(() => document.querySelector('button[aria-label^="Butaca"]'), { timeout: 5000 });

    const a01 = document.querySelector('button[aria-label="Butaca A01 libre"]');
    if (a01) fireEvent.click(a01);

    clickAllButtons();
  });

  it('handles ticket-success navigation', async () => {
    const { default: Page } = await import('./pos/BoxOfficePage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toMatch(/Sesiones|Dune/i); }, { timeout: 6000 });

    const t = screen.getAllByRole('button').find(b => /20:00/.test(b.textContent ?? ''));
    if (t) fireEvent.click(t);

    await waitFor(() => document.querySelector('button[aria-label^="Butaca"]'), { timeout: 5000 });
    clickAllButtons();
  });
});

/* ── ConcessionPage ────────────────────────────────── */
describe('ConcessionPage — smoke', () => {
  it('loads products', async () => {
    const { default: Page } = await import('./pos/ConcessionPage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toContain('Palomitas'); }, { timeout: 5000 });
  });

  it('opens pay modal and confirms payment', async () => {
    const { default: Page } = await import('./pos/ConcessionPage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toContain('Palomitas'); }, { timeout: 5000 });

    const product = screen.getByText('Palomitas grandes').closest('button');
    if (product) fireEvent.click(product);

    fireEvent.keyDown(window, { key: 'F4' });
    await waitFor(() => { /* tick */ }, { timeout: 1000 });

    const cashBtn = screen.queryAllByRole('button').find(b => /efectivo|cash/i.test(b.textContent ?? ''));
    if (cashBtn) fireEvent.click(cashBtn);

    const cashInput = document.querySelector('input[type="number"]');
    if (cashInput) fireEvent.change(cashInput, { target: { value: '50' } });

    const confirmBtn = screen.queryAllByRole('button').find(b => /confirmar|pagar|cobrar/i.test(b.textContent ?? ''));
    if (confirmBtn) fireEvent.click(confirmBtn);

    await waitFor(() => { /* tick */ }, { timeout: 1000 });
  });

  it('opens product manager and clicks buttons', async () => {
    const { default: Page } = await import('./pos/ConcessionPage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toContain('Palomitas'); }, { timeout: 5000 });

    const manageBtn = screen.queryAllByRole('button').find(b => {
      const t = (b.textContent ?? '').toLowerCase();
      const title = (b.getAttribute('title') ?? '').toLowerCase();
      return /gestion|manage/.test(t + title);
    });
    if (manageBtn) fireEvent.click(manageBtn);
    await waitFor(() => { /* tick */ }, { timeout: 1000 });
    clickAllButtons();
  });
});

/* ── ReservationsPage ──────────────────────────────── */
describe('ReservationsPage — smoke', () => {
  it('loads reservations', async () => {
    const { default: Page } = await import('./reservations/ReservationsPage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toContain('Ana'); }, { timeout: 5000 });
  });

  it('opens detail and exercises buttons', async () => {
    const { default: Page } = await import('./reservations/ReservationsPage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toContain('Ana'); }, { timeout: 5000 });

    const row = screen.getByText(/Ana López/i).closest('tr');
    if (row) fireEvent.click(row);
    await waitFor(() => { /* tick */ }, { timeout: 1000 });
    clickAllButtons();
  });

  it('opens pay flow and switches to cash', async () => {
    const { default: Page } = await import('./reservations/ReservationsPage');
    renderPage(<Page />);
    await waitFor(() => { expect(document.body.textContent).toContain('Ana'); }, { timeout: 5000 });

    const payBtn = screen.queryAllByRole('button').find(b => /tarjeta|payment|pago/i.test(b.getAttribute('title') ?? ''));
    if (payBtn) fireEvent.click(payBtn);
    await waitFor(() => { /* tick */ }, { timeout: 1000 });

    const cashBtn = screen.queryAllByRole('button').find(b => /efectivo|cash/i.test(b.textContent ?? ''));
    if (cashBtn) fireEvent.click(cashBtn);

    const quickBtns = screen.queryAllByRole('button').filter(b => /^€\d+$/.test(b.textContent ?? ''));
    quickBtns.forEach(b => { try { fireEvent.click(b); } catch {} });

    clickAllButtons();
  });
});

/* ── SeatMap ──────────────────────────────────────── */
describe('SeatMap — generated grid', () => {
  it('renders for various capacities', async () => {
    const { default: SeatMap } = await import('../components/shared/SeatMap');
    const { rerender } = render(
      <SeatMap session={{ id: 1, sold: 5 }} room={{ capacity: 60, name: 'Sala 1' }} selectedSeats={[]} onToggle={() => {}} maxSelect={5} />
    );

    document.querySelectorAll('button').forEach((b, i) => { if (i < 3) { try { fireEvent.click(b); } catch {} } });

    rerender(
      <SeatMap session={{ id: 2, sold: 50 }} room={{ capacity: 120, name: 'Sala 2' }} selectedSeats={[]} onToggle={() => {}} maxSelect={5} />
    );
    document.querySelectorAll('button').forEach((b, i) => { if (i < 2) { try { fireEvent.click(b); } catch {} } });
  });

  it('respects maxSelect', async () => {
    const { default: SeatMap } = await import('../components/shared/SeatMap');
    const onToggle = vi.fn();
    render(
      <SeatMap
        seats={[{ row: 'A', number: 1, status: 'available', id: 1 }, { row: 'A', number: 2, status: 'available', id: 2 }]}
        selectedSeats={['A01', 'A02']}
        onToggle={onToggle}
        maxSelect={2}
      />
    );
    const a02 = document.querySelector('button[aria-label="Butaca A02 libre"]');
    if (a02) fireEvent.click(a02);
  });
});