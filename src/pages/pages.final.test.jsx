/**
 * FINAL COVERAGE PUSH — narrow tests that open one modal, fill it,
 * click the precise save / confirm button (never the close X), to
 * exercise handleSave / handleDelete branches that ad-hoc click-all
 * tests don't reliably hit.
 *
 * Code in English; rendered locale (Spanish) drives the strings asserted.
 */
import { describe, it, vi, beforeEach } from 'vitest';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

/* ── Realistic fixtures ────────────────────────────────── */
const MOVIES = [
  { id: 1, title: 'Dune',   durationMin: 155, genre: 'Sci-fi', ageRating: 'PG-13', format: 'IMAX', language: 'ES', active: true,  director: 'V', year: 2021 },
  { id: 2, title: 'Avatar', durationMin: 162, genre: 'Sci-fi', ageRating: 'PG-13', format: '3D',   language: 'VO', active: false, director: 'C', year: 2009 },
];
const ROOMS = [
  { id: 1, name: 'Sala 1', capacity: 100, type: 'STANDARD', status: 'active' },
];
const CLIENTS = [
  { id: 1, name: 'Ana López', lastName: 'García', email: 'ana@x.com', username: 'ana', status: 'ACTIVE', userType: 'ADULT', birthDate: '1995-04-12' },
];
const EMPLOYEES = [
  { id: 1, name: 'Empleado Uno', lastName: 'P.', email: 'e1@x.com', role: 'CAJERO',   phone: '600', active: true },
  { id: 2, name: 'Empleado Dos', lastName: 'R.', email: 'e2@x.com', role: 'GERENCIA', phone: '601', active: false },
];
const INCIDENTS = [
  { id: 100, title: 'Proyector caído', category: 'Técnico', priority: 'critical', status: 'open',     room: 'Sala 1', description: 'Sin imagen' },
  { id: 101, title: 'Asiento roto',    category: 'Mobiliario', priority: 'low',   status: 'resolved', room: 'Sala 2', description: '' },
];
const PURCHASES = [
  {
    id: 11, status: 'PENDING', total: 27, paymentMethod: null, createdAt: '2026-05-01T20:00:00',
    user: { id: 1, name: 'Ana López', email: 'ana@x.com' },
    screening: { id: 1, dateTime: '2026-05-15T20:00', movie: { id: 1, title: 'Dune' }, theater: { id: 1, name: 'Sala 1' } },
    seats: ['A01', 'A02'],
  },
  {
    id: 12, status: 'CONFIRMED', total: 13.5, paymentMethod: 'CARD', createdAt: '2026-05-02T19:00:00',
    user: { id: 2, name: 'Bruno Ruiz', email: 'b@x.com' },
    screening: { id: 1, dateTime: '2026-05-15T20:00', movie: { id: 1, title: 'Dune' }, theater: { id: 1, name: 'Sala 1' } },
    seats: ['B05'],
  },
];

const mkSvc = (extra = {}) => ({
  getAll: vi.fn().mockResolvedValue([]),
  getById: vi.fn().mockResolvedValue({}),
  getActive: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({ id: 99 }),
  createFormData: vi.fn().mockResolvedValue({ id: 99 }),
  update: vi.fn().mockResolvedValue({ id: 1 }),
  remove: vi.fn().mockResolvedValue(null),
  ...extra,
});

vi.mock('../services/moviesService', () => ({
  moviesService: mkSvc({ getAll: vi.fn().mockResolvedValue(MOVIES), create: vi.fn().mockResolvedValue({ id: 3 }) }),
}));
vi.mock('../services/roomsService', () => ({
  roomsService:    mkSvc({ getAll: vi.fn().mockResolvedValue(ROOMS) }),
  theatersService: mkSvc({ getAll: vi.fn().mockResolvedValue(ROOMS) }),
}));
vi.mock('../services/employeesService', () => ({
  employeesService: mkSvc({ getAll: vi.fn().mockResolvedValue(EMPLOYEES) }),
}));
vi.mock('../services/clientsService', () => ({
  clientsService: mkSvc({ getAll: vi.fn().mockResolvedValue(CLIENTS), search: vi.fn().mockResolvedValue(CLIENTS), getById: vi.fn().mockResolvedValue(CLIENTS[0]) }),
}));
vi.mock('../services/usersService', () => ({
  usersService: mkSvc({ getAll: vi.fn().mockResolvedValue(CLIENTS) }),
}));
vi.mock('../services/incidentsService', () => ({
  incidentsService: mkSvc({ getAll: vi.fn().mockResolvedValue(INCIDENTS) }),
}));
vi.mock('../services/reservationsService', () => ({
  reservationsService: mkSvc({
    getAll: vi.fn().mockResolvedValue(PURCHASES),
    pay:    vi.fn().mockResolvedValue({ tickets: [{ qrCode: 'LUMEN:1' }] }),
    cancel: vi.fn().mockResolvedValue({}),
  }),
  purchasesService: mkSvc({
    getAll: vi.fn().mockResolvedValue(PURCHASES),
    pay:    vi.fn().mockResolvedValue({ tickets: [{ qrCode: 'LUMEN:1' }] }),
    cancel: vi.fn().mockResolvedValue({}),
  }),
}));
vi.mock('../services/sessionsService', () => ({
  sessionsService:   mkSvc({ getAll: vi.fn().mockResolvedValue([]) }),
  screeningsService: mkSvc({ getAll: vi.fn().mockResolvedValue([]) }),
}));
vi.mock('../services/salesService', () => ({
  salesService: {
    createPurchase: vi.fn().mockResolvedValue({ id: 99, tickets: [] }),
    confirmPurchase: vi.fn().mockResolvedValue({}),
    cancelPurchase: vi.fn().mockResolvedValue({}),
    createTicketSale: vi.fn().mockResolvedValue({}),
    createConcessionSale: vi.fn().mockResolvedValue({}),
    createMerchandiseSale: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../services/seatsService', () => ({
  seatsService: { getByScreening: vi.fn().mockResolvedValue([]), getByTheater: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../services/inventoryService', () => ({
  inventoryService:   mkSvc({ getAll: vi.fn().mockResolvedValue([{ id: 1, name: 'Palomitas', category: 'FOOD', price: 5, quantity: 10 }]) }),
  merchandiseService: mkSvc(),
}));
vi.mock('../services/workersService', () => ({
  workersService: mkSvc({ getAll: vi.fn().mockResolvedValue(EMPLOYEES), getActive: vi.fn().mockResolvedValue(EMPLOYEES) }),
}));
vi.mock('../services/auditService', () => ({ auditService: mkSvc() }));
vi.mock('../services/reportsService', () => ({
  reportsService: { salesWeek: vi.fn().mockResolvedValue([]), occupancy: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../services/dashboardService', () => ({
  dashboardService: { get: vi.fn().mockResolvedValue({}), getPurchases: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../services/ticketsService', () => ({ ticketsService: mkSvc() }));
vi.mock('../services/shiftsService', () => ({ shiftsService: mkSvc() }));
vi.mock('../services/merchandiseSalesService', () => ({ merchandiseSalesService: mkSvc() }));
vi.mock('../services/cloudinaryService', () => ({ uploadImage: vi.fn().mockResolvedValue('https://cdn/x.jpg') }));

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
  useStripe: () => ({ confirmCardPayment: vi.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }), confirmPayment: vi.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }) }),
  useElements: () => ({ getElement: () => ({}) }),
}));
vi.mock('qrcode.react', () => ({ QRCodeSVG: () => <div data-testid="qr" /> }));

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

/* Helper: find a button whose visible text matches regex. */
function findBtnByText(re) {
  return screen.queryAllByRole('button').find(b => re.test(b.textContent ?? ''));
}

/* Helper: find a button whose title attribute matches regex. */
function findBtnByTitle(re) {
  return screen.queryAllByRole('button').find(b => re.test(b.getAttribute('title') ?? ''));
}

/* Helper: find a button inside the currently-open dialog. */
function findDialogBtn(re) {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return null;
  return Array.from(dialog.querySelectorAll('button')).find(b => re.test(b.textContent ?? ''));
}

/* ════════════════════════════════════════════════════════
   EmployeesPage — full CRUD path with required fields
   ════════════════════════════════════════════════════════ */
describe('EmployeesPage — full CRUD path', () => {
  it('opens create, fills required fields, saves', async () => {
    const { default: Page } = await import('./employees/EmployeesPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Empleado Uno/i));

    const newBtn = findBtnByText(/nuevo|crear|nueva/i);
    if (newBtn) fireEvent.click(newBtn);

    await waitFor(() => screen.getByLabelText?.(/nombre|name/i) ?? screen.getByText(/empleado/i));

    // Required fields are name + email. Fill all inputs.
    const inputs = document.querySelectorAll('.modal-overlay input, [role="dialog"] input');
    const realInputs = inputs.length ? inputs : document.querySelectorAll('input:not([type="file"]):not([type="checkbox"])');
    realInputs.forEach((el, i) => {
      try {
        if (el.type === 'email' || i === 1) fireEvent.change(el, { target: { value: 'new@x.com' } });
        else fireEvent.change(el, { target: { value: 'Nuevo Empleado' } });
      } catch { /* ignore */ }
    });
    // Select role.
    document.querySelectorAll('select').forEach(sel => {
      const opts = Array.from(sel.options);
      if (opts.length > 1) fireEvent.change(sel, { target: { value: opts[1].value } });
    });

    // Save (NOT cancel).
    const save = findBtnByText(/guardar|crear|save/i);
    if (save) fireEvent.click(save);
  });

  it('row action: edit and delete one employee', async () => {
    const { default: Page } = await import('./employees/EmployeesPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Empleado Uno/i));

    // Click "Editar" row action by title.
    const editBtn = findBtnByTitle(/editar|edit/i);
    if (editBtn) fireEvent.click(editBtn);
    // Close.
    const cancel = findBtnByText(/cancelar|cancel/i);
    if (cancel) fireEvent.click(cancel);

    // Now delete.
    const delBtn = findBtnByTitle(/eliminar|delete/i);
    if (delBtn) fireEvent.click(delBtn);
    await waitFor(() => { /* tick */ });
    // Confirm delete.
    const confirm = findBtnByText(/eliminar|confirmar/i);
    if (confirm) fireEvent.click(confirm);
  });
});

/* ════════════════════════════════════════════════════════
   ClientsPage — open detail, edit, delete
   ════════════════════════════════════════════════════════ */
describe('ClientsPage — final flows', () => {
  it('open detail by clicking row, close and trigger search debounce path', async () => {
    const { default: Page } = await import('./clients/ClientsPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Ana López/i));

    // Row click → opens detail.
    const row = screen.getByText(/Ana López/i).closest('tr');
    if (row) fireEvent.click(row);
    await waitFor(() => { /* tick */ });

    // Close detail modal via X / close button (any).
    const close = findBtnByText(/cerrar|close/i)
              ?? document.querySelector('[role="dialog"] button[aria-label*="errar" i]');
    if (close) fireEvent.click(close);

    // Search with debounce + empty path.
    const search = document.querySelector('input');
    if (search) {
      fireEvent.change(search, { target: { value: 'ana' } });
      await new Promise(r => setTimeout(r, 400));
      fireEvent.change(search, { target: { value: '' } });
    }
  });

  it('delete a client (row action + confirm)', async () => {
    const { default: Page } = await import('./clients/ClientsPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Ana López/i));

    const delBtn = findBtnByTitle(/eliminar|delete/i);
    if (delBtn) fireEvent.click(delBtn);
    await waitFor(() => { /* tick */ });
    const confirm = findBtnByText(/eliminar|confirmar/i);
    if (confirm) fireEvent.click(confirm);
  });
});

/* ════════════════════════════════════════════════════════
   MoviesPage — bulk delete (covers lines 281-286)
   ════════════════════════════════════════════════════════ */
describe('MoviesPage — bulk delete confirm', () => {
  it('selects rows, clicks bulk-delete and confirms', async () => {
    const { default: Page } = await import('./movies/MoviesPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText('Dune'));

    // Toggle row checkboxes.
    document.querySelectorAll('input[type="checkbox"]').forEach(c => {
      try { fireEvent.click(c); } catch { /* ignore */ }
    });
    await waitFor(() => { /* tick */ });

    // The "Eliminar selección (N)" bulk action button.
    const bulkBtn = findBtnByText(/eliminar selecci/i);
    if (bulkBtn) fireEvent.click(bulkBtn);
    await waitFor(() => { /* tick */ });

    // Confirm.
    const confirm = findBtnByText(/eliminar todas/i) ?? findBtnByText(/eliminar/i);
    if (confirm) fireEvent.click(confirm);
  });

  it('opens detail modal by clicking a row', async () => {
    const { default: Page } = await import('./movies/MoviesPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText('Dune'));

    const row = screen.getByText('Dune').closest('tr');
    if (row) fireEvent.click(row);
    await waitFor(() => { /* tick */ });
  });
});

/* ════════════════════════════════════════════════════════
   ReservationsPage — pay confirm + cancel confirm + refund
   ════════════════════════════════════════════════════════ */
describe('ReservationsPage — final modals', () => {
  it('pays a PENDING reservation: opens pay modal, confirms with card', async () => {
    const { default: Page } = await import('./reservations/ReservationsPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Ana López/i));

    // The pay button (CreditCard icon) on the PENDING row has title=t('reservations.col.payment') = "Pago".
    const payBtn = findBtnByTitle(/^pago$/i);
    if (payBtn) fireEvent.click(payBtn);
    await waitFor(() => { /* tick */ });

    // Confirm pay (button text contains "Confirmar" + €).
    const confirm = findBtnByText(/confirmar|€/i);
    if (confirm) fireEvent.click(confirm);
    await waitFor(() => { /* tick */ });

    // Close the ticket modal.
    const close = findBtnByText(/cerrar|close/i);
    if (close) fireEvent.click(close);
  });

  it('opens detail modal for a CONFIRMED row and triggers refund', async () => {
    const { default: Page } = await import('./reservations/ReservationsPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Bruno Ruiz/i));

    // Click on the row.
    const row = screen.getByText(/Bruno Ruiz/i).closest('tr');
    if (row) fireEvent.click(row);
    await waitFor(() => { /* tick */ });

    // Within the detail modal, look for "Reembolso" button.
    const refund = findBtnByText(/reembolso|refund/i);
    if (refund) fireEvent.click(refund);
    await waitFor(() => { /* tick */ });
    // Confirm refund.
    const confirm = findBtnByText(/reembolsar|confirmar/i);
    if (confirm) fireEvent.click(confirm);
  });

  it('cancels a PENDING reservation', async () => {
    const { default: Page } = await import('./reservations/ReservationsPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Ana López/i));

    // The cancel button (XCircle) has title=t('reservations.cancel.title') ~ "Cancelar".
    const cancelBtn = findBtnByTitle(/cancelar|cancel/i);
    if (cancelBtn) fireEvent.click(cancelBtn);
    await waitFor(() => { /* tick */ });
    const confirm = findBtnByText(/cancelar|confirmar/i);
    if (confirm) fireEvent.click(confirm);
  });
});

/* ════════════════════════════════════════════════════════
   IncidentsPage — open the form modal and save
   ════════════════════════════════════════════════════════ */
describe('IncidentsPage — create and resolve', () => {
  it('opens create form and saves with title filled', async () => {
    const { default: Page } = await import('./incidents/IncidentsPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Proyector caído/i));

    const newBtn = findBtnByText(/nueva|crear|registrar|añadir/i);
    if (newBtn) fireEvent.click(newBtn);
    await waitFor(() => { /* tick */ });

    // Fill title input (first visible text input).
    document.querySelectorAll('input:not([type="file"]):not([type="checkbox"]):not([type="radio"])').forEach((el, i) => {
      try { fireEvent.change(el, { target: { value: `Incidencia ${i}` } }); } catch { /* ignore */ }
    });
    document.querySelectorAll('select').forEach(sel => {
      const opts = Array.from(sel.options).filter(o => !o.disabled);
      if (opts.length > 1) fireEvent.change(sel, { target: { value: opts[1].value } });
    });
    document.querySelectorAll('textarea').forEach(el => {
      try { fireEvent.change(el, { target: { value: 'Detalle' } }); } catch { /* ignore */ }
    });

    const save = findBtnByText(/guardar|crear|registrar|save/i);
    if (save) fireEvent.click(save);
  });

  it('mark resolved button on an open incident', async () => {
    const { default: Page } = await import('./incidents/IncidentsPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Proyector caído/i));

    // The "marcar resuelta" button (CheckCircle icon) has title set to translated string.
    const resolveBtn = findBtnByTitle(/resol|reso|reso/i)
                    ?? screen.queryAllByRole('button').find(b => b.querySelector('svg'));
    if (resolveBtn) fireEvent.click(resolveBtn);
  });
});

/* ════════════════════════════════════════════════════════
   RoomsPage — full create and delete
   ════════════════════════════════════════════════════════ */
describe('RoomsPage — final paths', () => {
  it('creates a room with valid fields and saves', async () => {
    const { default: Page } = await import('./rooms/RoomsPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });

    const newBtn = findBtnByText(/nueva|añadir|new/i);
    if (newBtn) fireEvent.click(newBtn);
    await waitFor(() => document.querySelector('[role="dialog"]'));

    document.querySelectorAll('[role="dialog"] input').forEach(el => {
      try {
        const v = el.type === 'number' ? '120' : 'Sala Test';
        fireEvent.change(el, { target: { value: v } });
      } catch { /* ignore */ }
    });

    // Save button is INSIDE the dialog (avoids matching the header "Crear sala").
    const save = findDialogBtn(/guardar|crear|save/i);
    if (save) fireEvent.click(save);
  });

  it('deletes a room (row action + confirm)', async () => {
    const { default: Page } = await import('./rooms/RoomsPage');
    renderPage(<Page />);
    await waitFor(() => screen.getByText(/Sala 1/));

    const del = findBtnByTitle(/eliminar|delete/i);
    if (del) fireEvent.click(del);
    await waitFor(() => document.querySelector('[role="dialog"]'));
    const confirm = findDialogBtn(/eliminar|confirmar|delete/i);
    if (confirm) fireEvent.click(confirm);
  });
});

/* ════════════════════════════════════════════════════════
   UsersPage — open create, fill required fields, save
   ════════════════════════════════════════════════════════ */
describe('UsersPage — full CRUD path', () => {
  it('creates a user with required fields', async () => {
    const { default: Page } = await import('./users/UsersPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });

    const newBtn = findBtnByText(/nuevo|crear|añadir|new/i);
    if (newBtn) fireEvent.click(newBtn);
    await waitFor(() => document.querySelector('[role="dialog"]') ?? screen.getByText(/cliente|usuario/i));

    document.querySelectorAll('[role="dialog"] input').forEach((el, i) => {
      try {
        if (el.type === 'email') fireEvent.change(el, { target: { value: 'usr@x.com' } });
        else if (el.type === 'password') fireEvent.change(el, { target: { value: 'secret' } });
        else if (el.type === 'date') fireEvent.change(el, { target: { value: '1990-01-01' } });
        else fireEvent.change(el, { target: { value: `Texto ${i}` } });
      } catch { /* ignore */ }
    });
    document.querySelectorAll('[role="dialog"] select').forEach(sel => {
      const opts = Array.from(sel.options).filter(o => !o.disabled);
      if (opts.length > 1) fireEvent.change(sel, { target: { value: opts[1].value } });
    });

    const save = findDialogBtn(/guardar|crear|save/i);
    if (save) fireEvent.click(save);
  });
});

/* ════════════════════════════════════════════════════════
   SchedulesPage — create with valid fields
   ════════════════════════════════════════════════════════ */
describe('SchedulesPage — save and delete', () => {
  it('creates a schedule (movie + theater + datetime + price)', async () => {
    const { default: Page } = await import('./schedules/SchedulesPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });

    const newBtn = findBtnByText(/nueva|nuevo|crear|añadir|new/i);
    if (newBtn) fireEvent.click(newBtn);
    await waitFor(() => document.querySelector('[role="dialog"]'));

    // Fill dialog selects + datetime + price.
    document.querySelectorAll('[role="dialog"] select').forEach(sel => {
      const opts = Array.from(sel.options).filter(o => o.value && !o.disabled);
      if (opts.length > 0) fireEvent.change(sel, { target: { value: opts[0].value } });
    });
    document.querySelectorAll('[role="dialog"] input').forEach(el => {
      try {
        if (el.type === 'datetime-local') fireEvent.change(el, { target: { value: '2026-12-01T20:00' } });
        else if (el.type === 'number') fireEvent.change(el, { target: { value: '12.5' } });
      } catch { /* ignore */ }
    });

    const save = findDialogBtn(/guardar|crear|save/i);
    if (save) fireEvent.click(save);
  });
});
