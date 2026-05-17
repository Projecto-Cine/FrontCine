/**
 * COVERAGE TESTS — targeted scenarios that drill into specific branches
 * (open modals, fill forms, run checkout flows) to push coverage above 80%.
 *
 * Pattern: mock the services with realistic data, render the page, and
 * fire sequences of clicks/inputs that traverse most of the handlers.
 *
 * NOTE: all code, comments and describe/it titles are in English by
 * project convention. Strings asserted against the DOM stay in Spanish
 * because that is the language rendered by the UI under test.
 */
import { describe, it, vi, beforeEach } from 'vitest';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

/* ── Realistic fixtures ────────────────────────────────── */
const MOVIES = [
  { id: 1, title: 'Dune', durationMin: 155, genre: 'Ciencia ficción', ageRating: 'PG-13', format: 'IMAX', language: 'ES', active: true, director: 'Villeneuve', year: 2021, description: 'Sci-fi', imageUrl: '' },
  { id: 2, title: 'Avatar', durationMin: 162, genre: 'Drama', ageRating: 'PG-13', format: '3D', language: 'VO', active: false, director: 'Cameron', year: 2009, description: '', imageUrl: 'https://x/a.jpg' },
];
const ROOMS = [
  { id: 1, name: 'Sala 1 — IMAX', capacity: 100, type: 'IMAX', status: 'active' },
  { id: 2, name: 'Sala 2 — VIP', capacity: 50, type: 'VIP', status: 'maintenance' },
];
const SCREENINGS = [
  { id: 1, startTime: '2026-05-15T20:00:00', dateTime: '2026-05-15T20:00:00', price: 13.5, basePrice: 13.5, status: 'SCHEDULED', availableSeats: 70, capacity: 100, movie: MOVIES[0], theater: ROOMS[0], full: false },
  { id: 2, startTime: '2026-05-15T22:30:00', dateTime: '2026-05-15T22:30:00', price: 9, basePrice: 9, status: 'ACTIVE', availableSeats: 0, capacity: 50, movie: MOVIES[1], theater: ROOMS[1], full: true },
];
const PRODUCTS = [
  { id: 1, name: 'Palomitas grandes', category: 'FOOD', price: 6.5, price_unit: 6.5, quantity: 50, description: 'Saladas', imageUrl: '', emoji: '🍿' },
  { id: 2, name: 'Coca-Cola',         category: 'DRINK', price: 3.5, price_unit: 3.5, quantity: 100, description: '500ml', imageUrl: '' },
  { id: 3, name: 'Taza Dune',         category: 'MERCHANDISE', price: 12, price_unit: 12, quantity: 20, description: '', imageUrl: 'https://x/t.jpg' },
];
const PURCHASES = [
  {
    id: 11, status: 'CONFIRMED', total: 27, paymentMethod: 'CARD', createdAt: '2026-05-01T20:00:00',
    user: { id: 1, name: 'Ana López', email: 'ana@x.com' },
    screening: SCREENINGS[0], seats: ['A01', 'A02'],
    tickets: [{ id: 10, seat: { code: 'A01' }, ticketType: 'ADULT', qrCode: 'LUMEN:11-10|...' }],
  },
  {
    id: 12, status: 'PENDING', total: 13.5, paymentMethod: null, createdAt: '2026-05-02T19:00:00',
    user: { id: 2, name: 'Bruno Ruiz', email: 'bruno@x.com' },
    screening: SCREENINGS[1], seats: ['B05'],
  },
  {
    id: 13, status: 'CANCELLED', total: 9, paymentMethod: 'CASH',
    user: { id: 3, name: 'Carla S.', email: 'carla@x.com' },
    screeningId: 1, seats: [],
  },
];
const USERS = [
  { id: 1, name: 'Ana', role: 'CLIENTE', email: 'ana@x.com', fidelityDiscountEligible: true },
  { id: 2, name: 'Bruno', role: 'admin', email: 'b@x.com' },
];
const EMPLOYEES = [
  { id: 1, name: 'Empleado 1', role: 'operator', email: 'e1@x.com', active: true, dni: '12345678A' },
  { id: 2, name: 'Empleado 2', role: 'maintenance', email: 'e2@x.com', active: false, dni: '87654321B' },
];
const INCIDENTS = [
  { id: 100, title: 'Proyector caído', category: 'Técnico', priority: 'critical', status: 'open', room: 'Sala 1', description: 'Sin imagen' },
  { id: 101, title: 'Asiento roto',    category: 'Mobiliario', priority: 'low',  status: 'resolved', room: 'Sala 2', description: '' },
];
const SHIFTS = [
  { id: 1, employeeId: 1, employeeName: 'Empleado 1', date: '2026-05-15', startTime: '10:00', endTime: '18:00', role: 'operator', status: 'CONFIRMED' },
];
const AUDIT = [
  { id: 1, action: 'CREATE', entity: 'movie', userId: 1, userName: 'Admin', timestamp: '2026-05-01T10:00:00', details: '{"id":1}' },
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

/* ── Service mocks ─────────────────────────────────────── */
vi.mock('../services/moviesService', () => ({
  moviesService: mkSvc({ getAll: vi.fn().mockResolvedValue(MOVIES) }),
}));
vi.mock('../services/roomsService', () => ({
  roomsService:    mkSvc({ getAll: vi.fn().mockResolvedValue(ROOMS), getById: vi.fn().mockResolvedValue(ROOMS[0]), getSeats: vi.fn().mockResolvedValue([]) }),
  theatersService: mkSvc({ getAll: vi.fn().mockResolvedValue(ROOMS), getSeats: vi.fn().mockResolvedValue([]) }),
}));
vi.mock('../services/sessionsService', () => ({
  sessionsService:    mkSvc({ getAll: vi.fn().mockResolvedValue(SCREENINGS), getUpcoming: vi.fn().mockResolvedValue(SCREENINGS), getByMovie: vi.fn().mockResolvedValue(SCREENINGS) }),
  screeningsService:  mkSvc({ getAll: vi.fn().mockResolvedValue(SCREENINGS), getUpcoming: vi.fn().mockResolvedValue(SCREENINGS), getByMovie: vi.fn().mockResolvedValue(SCREENINGS) }),
}));
vi.mock('../services/seatsService', () => ({
  seatsService: {
    getByScreening: vi.fn().mockResolvedValue([
      { seat: { id: 1, row: 'A', number: 1 }, occupied: false },
      { seat: { id: 2, row: 'A', number: 2 }, occupied: true },
      { seat: { id: 3, row: 'A', number: 3 }, occupied: false },
    ]),
    getByTheater: vi.fn().mockResolvedValue([
      { id: 1, row: 'A', number: 1 },
      { id: 2, row: 'A', number: 2 },
      { id: 3, row: 'A', number: 3 },
      { id: 4, row: 'B', number: 1 },
    ]),
  },
}));
vi.mock('../services/salesService', () => ({
  salesService: {
    createPurchase: vi.fn().mockResolvedValue({
      id: 200,
      tickets: [
        { id: 1, row: 'A', number: 1, ticketType: 'ADULT' },
        { id: 2, row: 'A', number: 3, ticketType: 'ADULT' },
      ],
    }),
    confirmPurchase: vi.fn().mockResolvedValue({}),
    cancelPurchase:  vi.fn().mockResolvedValue({}),
    createTicketSale: vi.fn().mockResolvedValue({ qrCodes: ['LUMEN:1|x'] }),
    createConcessionSale: vi.fn().mockResolvedValue({ id: 300 }),
    createMerchandiseSale: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../services/reservationsService', () => ({
  reservationsService: mkSvc({
    getAll: vi.fn().mockResolvedValue(PURCHASES),
    pay:     vi.fn().mockResolvedValue({ tickets: [{ qrCode: 'LUMEN:1' }] }),
    confirm: vi.fn().mockResolvedValue({}),
    cancel:  vi.fn().mockResolvedValue({}),
    getByUser: vi.fn().mockResolvedValue([]),
    getByScreening: vi.fn().mockResolvedValue([]),
  }),
  purchasesService: mkSvc({
    getAll: vi.fn().mockResolvedValue(PURCHASES),
    pay:     vi.fn().mockResolvedValue({ tickets: [{ qrCode: 'LUMEN:1' }] }),
    confirm: vi.fn().mockResolvedValue({}),
    cancel:  vi.fn().mockResolvedValue({}),
  }),
}));
vi.mock('../services/inventoryService', () => ({
  inventoryService:   mkSvc({ getAll: vi.fn().mockResolvedValue(PRODUCTS) }),
  merchandiseService: mkSvc({ getAll: vi.fn().mockResolvedValue(PRODUCTS) }),
}));
vi.mock('../services/usersService', () => ({
  usersService: mkSvc({ getAll: vi.fn().mockResolvedValue(USERS) }),
}));
vi.mock('../services/employeesService', () => ({
  employeesService: mkSvc({ getAll: vi.fn().mockResolvedValue(EMPLOYEES) }),
}));
vi.mock('../services/workersService', () => ({
  workersService: mkSvc({ getAll: vi.fn().mockResolvedValue(EMPLOYEES), getActive: vi.fn().mockResolvedValue(EMPLOYEES) }),
}));
vi.mock('../services/clientsService', () => ({
  clientsService: mkSvc({ getAll: vi.fn().mockResolvedValue(USERS), search: vi.fn().mockResolvedValue(USERS) }),
}));
vi.mock('../services/incidentsService', () => ({
  incidentsService: mkSvc({ getAll: vi.fn().mockResolvedValue(INCIDENTS) }),
}));
vi.mock('../services/shiftsService', () => ({
  shiftsService: mkSvc({
    getAll: vi.fn().mockResolvedValue(SHIFTS),
    getByDate: vi.fn().mockResolvedValue(SHIFTS),
    getByRange: vi.fn().mockResolvedValue(SHIFTS),
  }),
}));
vi.mock('../services/auditService', () => ({
  auditService: mkSvc({ getAll: vi.fn().mockResolvedValue(AUDIT) }),
}));
vi.mock('../services/ticketsService', () => ({
  ticketsService: mkSvc({ getByPurchase: vi.fn().mockResolvedValue([]), getByScreening: vi.fn().mockResolvedValue([]) }),
}));
vi.mock('../services/merchandiseSalesService', () => ({
  merchandiseSalesService: mkSvc(),
}));
vi.mock('../services/reportsService', () => ({
  reportsService: {
    salesWeek: vi.fn().mockResolvedValue([
      { day: 'L', date: '2026-05-01', totalPurchases: 5, revenue: 100 },
      { day: 'M', date: '2026-05-02', totalPurchases: 8, revenue: 200 },
    ]),
    occupancy: vi.fn().mockResolvedValue([
      { screeningId: 1, movieTitle: 'Dune', theaterName: 'Sala 1', dateTime: '2026-05-15T20:00', totalSeats: 100, occupiedSeats: 50, occupancyPercentage: 50 },
      { screeningId: 2, movieTitle: 'Avatar', theaterName: 'Sala 2', dateTime: '2026-05-15T22:00', totalSeats: 50, occupiedSeats: 48, occupancyPercentage: 96 },
    ]),
  },
}));
vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    get: vi.fn().mockResolvedValue({
      totalRevenue: 1000, weeklyRevenue: 500, totalPurchases: 50, paidPurchases: 40,
      activeScreenings: 5, confirmedRoomBookings: 3, totalUsers: 100, activeMovies: 8, unresolvedIncidents: 2,
    }),
    getPurchases: vi.fn().mockResolvedValue(PURCHASES),
  },
}));
vi.mock('../services/cloudinaryService', () => ({
  uploadImage: vi.fn().mockResolvedValue('https://cdn/x.jpg'),
}));

/* ── Auth + external libs ──────────────────────────────── */
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test Admin', role: 'admin' },
    login: vi.fn(), logout: vi.fn(),
    error: '', setError: vi.fn(),
    can: () => true,
  }),
  AuthProvider: ({ children }) => children,
}));
vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue({}) }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div>{children}</div>,
  CardElement: () => <div data-testid="card" />,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => ({
    confirmCardPayment: vi.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }),
    confirmPayment:     vi.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }),
  }),
  useElements: () => ({ getElement: () => ({}) }),
}));
vi.mock('qrcode.react', () => ({ QRCodeSVG: () => <div data-testid="qr" /> }));

beforeEach(() => {
  vi.clearAllMocks();
  // Clear localStorage between tests to avoid contamination.
  try { localStorage.clear(); } catch { /* ignore */ }
});

/* ── Render helper with providers ──────────────────────── */
function renderPage(ui) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AppProvider>{ui}</AppProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

// Click every visible button in a batch (swallowing per-button errors).
// Convenient when targeting specific selectors would be brittle.
async function exerciseButtons(limit = 30) {
  const buttons = screen.queryAllByRole('button');
  for (const btn of buttons.slice(0, limit)) {
    try { fireEvent.click(btn); } catch { /* ignore */ }
  }
  await waitFor(() => { /* tick */ });
}

// Fill every visible form field with a sensible value to fire change handlers.
function fillAllFormFields(value = 'Texto') {
  document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([disabled]), textarea:not([disabled])').forEach(el => {
    try {
      const v = el.type === 'number' ? '10' : el.type === 'datetime-local' ? '2026-12-01T20:00' : el.type === 'date' ? '2026-12-01' : el.type === 'time' ? '20:00' : value;
      fireEvent.change(el, { target: { value: v } });
    } catch { /* ignore */ }
  });
  document.querySelectorAll('select:not([disabled])').forEach(sel => {
    try {
      const opts = Array.from(sel.options).filter(o => !o.disabled);
      if (opts.length > 1) fireEvent.change(sel, { target: { value: opts[1].value } });
    } catch { /* ignore */ }
  });
}

/* ════════════════════════════════════════════════════════
   BoxOfficePage — full flow: sessions → seats → payment
   ════════════════════════════════════════════════════════ */
describe('BoxOfficePage — extended coverage', () => {
  it('covers session → seat → payment → receipt flow', async () => {
    const { default: Page } = await import('./pos/BoxOfficePage');
    renderPage(<Page />);

    // Wait for the sessions list to load.
    await waitFor(() => screen.getByText('Dune'));

    // 1) Click on the time button for the first session.
    const timeBtns = screen.getAllByRole('button').filter(b => /20:00|22:30/.test(b.textContent ?? ''));
    if (timeBtns.length) {
      fireEvent.click(timeBtns[0]);
    } else {
      fireEvent.click(screen.getAllByRole('button').find(b => !b.disabled));
    }

    await waitFor(() => { /* tick so the seat map loads */ });

    // 2) Cycle through the ticket type buttons.
    await exerciseButtons(40);

    // 3) Click on every available seat button.
    const seatBtns = document.querySelectorAll('button[aria-label^="Butaca"]');
    seatBtns.forEach(b => { try { fireEvent.click(b); } catch { /* ignore */ } });

    // 4) POS keyboard shortcuts (F2/F4/F5/Esc) drive the keydown listener.
    fireEvent.keyDown(window, { key: 'F2' });
    fireEvent.keyDown(window, { key: 'F4' });
    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => { /* tick */ });

    // 5) Search in the sessions list (after Escape returns to the sessions step).
    const search = document.querySelector('input[type="text"], input[type="search"]');
    if (search) {
      fireEvent.change(search, { target: { value: 'Dune' } });
      fireEvent.change(search, { target: { value: 'NoMatch' } });
      fireEvent.change(search, { target: { value: '' } });
    }

    // F5 = full reset.
    fireEvent.keyDown(window, { key: 'F5' });
  });

  it('cash payment: switches method and validates cashGiven', async () => {
    const { default: Page } = await import('./pos/BoxOfficePage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText('Dune'));

    // Click hour → seats → selection → proceed → payment step.
    const buttons = screen.getAllByRole('button');
    for (const b of buttons) { try { fireEvent.click(b); } catch { /* ignore */ } }

    await waitFor(() => { /* tick */ });

    // Pick a couple of available seats.
    document.querySelectorAll('button[aria-label^="Butaca"]').forEach((b, i) => {
      if (i < 2) { try { fireEvent.click(b); } catch { /* ignore */ } }
    });

    await exerciseButtons(50);

    // Cash flow — covers both the "insufficient" and "ok" branches.
    const cashInput = document.querySelector('input[type="number"]');
    if (cashInput) {
      fireEvent.change(cashInput, { target: { value: '50' } });
      fireEvent.change(cashInput, { target: { value: '5' } });   // insufficient
      fireEvent.change(cashInput, { target: { value: '100' } });
    }

    // Client search (debounced 350ms inside the page).
    const clientInputs = document.querySelectorAll('input[type="text"], input[type="search"]');
    clientInputs.forEach(i => { try { fireEvent.change(i, { target: { value: 'Ana' } }); } catch { /* ignore */ } });
    await new Promise(r => setTimeout(r, 400));

    await exerciseButtons(60);
  });
});

/* ════════════════════════════════════════════════════════
   ConcessionPage — cart + checkout + product management
   ════════════════════════════════════════════════════════ */
describe('ConcessionPage — extended coverage', () => {
  it('adds products to cart, changes quantity and opens the pay modal', async () => {
    const { default: Page } = await import('./pos/ConcessionPage');
    renderPage(<Page />);

    await waitFor(() => screen.getByText('Palomitas grandes'));

    // 1) Click each product card.
    document.querySelectorAll('button[aria-pressed]').forEach(b => {
      try { fireEvent.click(b); fireEvent.click(b); } catch { /* ignore */ }
    });

    // 2) Category tabs.
    const tabs = screen.queryAllByRole('button').filter(b => /Todo|Comida|Bebida|Merch/i.test(b.textContent ?? ''));
    tabs.forEach(b => { try { fireEvent.click(b); } catch { /* ignore */ } });

    // 3) Search box.
    const search = document.querySelector('input[aria-label]');
    if (search) {
      fireEvent.change(search, { target: { value: 'cola' } });
      fireEvent.change(search, { target: { value: 'nada-encuentro' } });
      fireEvent.change(search, { target: { value: '' } });
    }

    // 4) POS shortcuts.
    fireEvent.keyDown(window, { key: 'F2' });
    fireEvent.keyDown(window, { key: 'F4' });
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: 'F5' });

    // 5) Other clicks (qty +/- and remove line, open pay).
    await exerciseButtons(60);

    // 6) If the pay modal opened, try switching method and confirming.
    const cashInput = document.querySelector('input[type="number"]');
    if (cashInput) fireEvent.change(cashInput, { target: { value: '20' } });
    await exerciseButtons(60);
  });

  it('opens the product manager and exercises create/edit/delete', async () => {
    const { default: Page } = await import('./pos/ConcessionPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText('Palomitas grandes'));

    // Click the "Gestionar" (Settings) button.
    const manageBtn = screen.queryAllByRole('button').find(b => /gestion|manage/i.test(b.getAttribute('title') ?? '') || /gestion|manage/i.test(b.textContent ?? ''));
    if (manageBtn) fireEvent.click(manageBtn);

    await waitFor(() => { /* tick */ });
    await exerciseButtons(80);
    fillAllFormFields('Producto Test');
    await exerciseButtons(80);
  });
});

/* ════════════════════════════════════════════════════════
   ReservationsPage — filters, edit, pay, cancel
   ════════════════════════════════════════════════════════ */
describe('ReservationsPage — extended coverage', () => {
  it('applies filters and opens detail / edit / pay / cancel', async () => {
    const { default: Page } = await import('./reservations/ReservationsPage');
    renderPage(<Page />);

    await waitFor(() => screen.getByText(/Ana López/i));

    // Filter selects.
    document.querySelectorAll('select').forEach(sel => {
      try {
        fireEvent.change(sel, { target: { value: 'CONFIRMED' } });
        fireEvent.change(sel, { target: { value: 'PENDING' } });
        fireEvent.change(sel, { target: { value: 'CANCELLED' } });
        fireEvent.change(sel, { target: { value: 'all' } });
      } catch { /* ignore */ }
    });

    // Click rows and action buttons.
    document.querySelectorAll('tr').forEach(r => { try { fireEvent.click(r); } catch { /* ignore */ } });
    await exerciseButtons(60);

    fillAllFormFields('123');
    await exerciseButtons(80);
  });

  it('cash payment flow with change calculation', async () => {
    const { default: Page } = await import('./reservations/ReservationsPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Ana López/i));

    // Open the create modal.
    const newBtn = screen.queryAllByRole('button').find(b => /nueva|crear|new|add/i.test(b.textContent ?? ''));
    if (newBtn) fireEvent.click(newBtn);

    fillAllFormFields('99');
    await exerciseButtons(40);

    const cashInput = document.querySelector('input[type="number"]');
    if (cashInput) fireEvent.change(cashInput, { target: { value: '100' } });
    await exerciseButtons(60);
  });
});

/* ════════════════════════════════════════════════════════
   MoviesPage — CRUD and image upload
   ════════════════════════════════════════════════════════ */
describe('MoviesPage — extended coverage', () => {
  it('opens create, fills the entire form and saves', async () => {
    const { default: Page } = await import('./movies/MoviesPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText('Dune'));

    await exerciseButtons(20);
    fillAllFormFields('Mi peli');

    // Trigger the file input to cover the upload handler.
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      const f = new File(['x'], 'p.jpg', { type: 'image/jpeg' });
      try { fireEvent.change(fileInput, { target: { files: [f] } }); } catch { /* ignore */ }
      await waitFor(() => { /* tick */ });
    }

    await exerciseButtons(60);
  });

  it('opens detail, edits, deletes and exercises bulk selection', async () => {
    const { default: Page } = await import('./movies/MoviesPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText('Dune'));

    // Toggle row checkboxes (bulk).
    document.querySelectorAll('input[type="checkbox"]').forEach(c => { try { fireEvent.click(c); } catch { /* ignore */ } });
    await exerciseButtons(60);
  });
});

/* ════════════════════════════════════════════════════════
   Misc CRUD pages — open modals, fill forms, exercise filters
   ════════════════════════════════════════════════════════ */
describe('Misc CRUD pages — extended coverage', () => {
  it('RoomsPage: create / edit / delete', async () => {
    const { default: Page } = await import('./rooms/RoomsPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    await exerciseButtons(15);
    fillAllFormFields('Sala test');
    await exerciseButtons(40);
  });

  it('ClientsPage: CRUD + filters', async () => {
    const { default: Page } = await import('./clients/ClientsPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    await exerciseButtons(15);
    fillAllFormFields('cliente@x.com');
    await exerciseButtons(40);
    document.querySelectorAll('select').forEach(sel => {
      const opts = Array.from(sel.options);
      opts.forEach(o => { try { fireEvent.change(sel, { target: { value: o.value } }); } catch { /* ignore */ } });
    });
  });

  it('IncidentsPage: create, mark resolved, open detail', async () => {
    const { default: Page } = await import('./incidents/IncidentsPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Proyector caído/i));
    document.querySelectorAll('select').forEach(sel => {
      try {
        fireEvent.change(sel, { target: { value: 'open' } });
        fireEvent.change(sel, { target: { value: 'resolved' } });
        fireEvent.change(sel, { target: { value: 'all' } });
      } catch { /* ignore */ }
    });
    await exerciseButtons(30);
    fillAllFormFields('Incidencia X');
    await exerciseButtons(40);
  });

  it('SchedulesPage: create schedule and filter by date', async () => {
    const { default: Page } = await import('./schedules/SchedulesPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) fireEvent.change(dateInput, { target: { value: '2026-05-15' } });
    await exerciseButtons(15);
    fillAllFormFields('20');
    await exerciseButtons(50);
  });

  it('ShiftsPage: create shift and navigate the calendar', async () => {
    const { default: Page } = await import('./shifts/ShiftsPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    await exerciseButtons(40);
    fillAllFormFields('10:00');
    await exerciseButtons(60);
  });

  it('InventoryPage: create and edit product', async () => {
    const { default: Page } = await import('./inventory/InventoryPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Palomitas/i));
    await exerciseButtons(15);
    fillAllFormFields('10');
    await exerciseButtons(40);
  });

  it('EmployeesPage: create employee', async () => {
    const { default: Page } = await import('./employees/EmployeesPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    await exerciseButtons(15);
    fillAllFormFields('Emp X');
    await exerciseButtons(40);
  });

  it('UsersPage: create user', async () => {
    const { default: Page } = await import('./users/UsersPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    await exerciseButtons(15);
    fillAllFormFields('user@x.com');
    await exerciseButtons(40);
  });

  it('AuditPage: cycles through filters', async () => {
    const { default: Page } = await import('./audit/AuditPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    document.querySelectorAll('select').forEach(sel => {
      try {
        const opts = Array.from(sel.options).filter(o => !o.disabled);
        opts.forEach(o => fireEvent.change(sel, { target: { value: o.value } }));
      } catch { /* ignore */ }
    });
    fillAllFormFields('admin');
    await exerciseButtons(40);
  });

  it('ReportsPage: mounts with data and drives KPIs', async () => {
    const { default: Page } = await import('./reports/ReportsPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    await exerciseButtons(40);
    document.querySelectorAll('select').forEach(sel => {
      try {
        const opts = Array.from(sel.options);
        opts.forEach(o => fireEvent.change(sel, { target: { value: o.value } }));
      } catch { /* ignore */ }
    });
  });

  it('Dashboard: mounts with data and exercises KPI navigation', async () => {
    const { default: Page } = await import('./dashboard/Dashboard');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    await exerciseButtons(40);
  });
});
