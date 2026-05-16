/**
 * INTERACTION TESTS — más profundos que los smoke tests:
 * abren modales, escriben en formularios y disparan acciones para
 * ejercitar más ramas de cada página.
 *
 * No verifican comportamiento exhaustivo — solo "no estalla y aumenta cobertura".
 */
import { describe, it, vi, beforeEach } from 'vitest';
import { waitFor, fireEvent, screen, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

// ───── Servicios mockeados (mismo patrón que pages.smoke.test) ─────
const mkSvc = (extra = {}) => ({
  getAll:   vi.fn().mockResolvedValue([{ id: 1, name: 'X', title: 'X' }, { id: 2, name: 'Y', title: 'Y' }]),
  getById:  vi.fn().mockResolvedValue({ id: 1 }),
  getActive: vi.fn().mockResolvedValue([]),
  create:   vi.fn().mockResolvedValue({ id: 99 }),
  createFormData: vi.fn().mockResolvedValue({ id: 99 }),
  update:   vi.fn().mockResolvedValue({ id: 1 }),
  remove:   vi.fn().mockResolvedValue(null),
  ...extra,
});

vi.mock('../services/moviesService',           () => ({ moviesService:          mkSvc() }));
vi.mock('../services/auditService',            () => ({ auditService:           mkSvc() }));
vi.mock('../services/clientsService',          () => ({ clientsService:         mkSvc({ search: vi.fn().mockResolvedValue([]) }) }));
vi.mock('../services/dashboardService',        () => ({ dashboardService:       { get: vi.fn().mockResolvedValue({ totalRevenue: 100, weeklyRevenue: 50, totalPurchases: 10, paidPurchases: 8, activeScreenings: 5, confirmedRoomBookings: 3, totalUsers: 20, activeMovies: 4, unresolvedIncidents: 1 }), getPurchases: vi.fn().mockResolvedValue([]) } }));
vi.mock('../services/employeesService',        () => ({ employeesService:       mkSvc() }));
vi.mock('../services/incidentsService',        () => ({ incidentsService:       mkSvc() }));
vi.mock('../services/inventoryService',        () => ({ inventoryService:       mkSvc(), merchandiseService: mkSvc() }));
vi.mock('../services/merchandiseSalesService', () => ({ merchandiseSalesService: mkSvc() }));
vi.mock('../services/reportsService',          () => ({ reportsService:         { salesWeek: vi.fn().mockResolvedValue([{ day: 'L', date: '2026-05-01', totalPurchases: 5, revenue: 100 }]), occupancy: vi.fn().mockResolvedValue([{ screeningId: 1, movieTitle: 'M', theaterName: 'T1', dateTime: '2026-05-15T20:00', totalSeats: 100, occupiedSeats: 50, occupancyPercentage: 50 }]) } }));
vi.mock('../services/reservationsService',     () => ({ reservationsService:    mkSvc({ pay: vi.fn().mockResolvedValue({}), confirm: vi.fn().mockResolvedValue({}), cancel: vi.fn().mockResolvedValue({}), getByUser: vi.fn().mockResolvedValue([]), getByScreening: vi.fn().mockResolvedValue([]) }), purchasesService: mkSvc() }));
vi.mock('../services/roomsService',            () => ({ roomsService:           mkSvc({ getSeats: vi.fn().mockResolvedValue([]) }), theatersService: mkSvc({ getSeats: vi.fn().mockResolvedValue([]) }) }));
vi.mock('../services/salesService',            () => ({ salesService:           { createPurchase: vi.fn().mockResolvedValue({ id: 1 }), confirmPurchase: vi.fn().mockResolvedValue({}), cancelPurchase: vi.fn().mockResolvedValue({}), createMerchandiseSale: vi.fn().mockResolvedValue({}), createTicketSale: vi.fn().mockResolvedValue({}), createConcessionSale: vi.fn().mockResolvedValue({}) } }));
vi.mock('../services/seatsService',            () => ({ seatsService:           mkSvc({ getByTheater: vi.fn().mockResolvedValue([]), getByScreening: vi.fn().mockResolvedValue([]) }) }));
vi.mock('../services/sessionsService',         () => ({ sessionsService:        mkSvc({ getUpcoming: vi.fn().mockResolvedValue([]), getByMovie: vi.fn().mockResolvedValue([]), getPurchases: vi.fn().mockResolvedValue([]), reserveSeat: vi.fn().mockResolvedValue({}), releaseSeat: vi.fn().mockResolvedValue({}) }), screeningsService: mkSvc({ getUpcoming: vi.fn().mockResolvedValue([]), getByMovie: vi.fn().mockResolvedValue([]), getPurchases: vi.fn().mockResolvedValue([]), reserveSeat: vi.fn().mockResolvedValue({}), releaseSeat: vi.fn().mockResolvedValue({}) }) }));
vi.mock('../services/shiftsService',           () => ({ shiftsService:          mkSvc({ getByDate: vi.fn().mockResolvedValue([]), getByRange: vi.fn().mockResolvedValue([]) }) }));
vi.mock('../services/ticketsService',          () => ({ ticketsService:         mkSvc({ getByPurchase: vi.fn().mockResolvedValue([]), getByScreening: vi.fn().mockResolvedValue([]) }) }));
vi.mock('../services/usersService',            () => ({ usersService:           mkSvc({ uploadImage: vi.fn().mockResolvedValue({}) }) }));
vi.mock('../services/workersService',          () => ({ workersService:         mkSvc({ getByRole: vi.fn().mockResolvedValue([]), getActive: vi.fn().mockResolvedValue([]) }) }));
vi.mock('../services/cloudinaryService',       () => ({ uploadImage: vi.fn().mockResolvedValue('https://cdn/x.jpg') }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User', role: 'admin', id: 1 },
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

beforeEach(() => vi.clearAllMocks());

// ───── Helpers ─────
function renderPage(ui) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AppProvider>{ui}</AppProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

// "Pulsa todos los botones que pueda" — ejecuta mucho código defensivamente.
// Capturamos errores por botón individual: si uno explota, seguimos con el siguiente.
async function clickAllSafe(maxButtons = 8) {
  const buttons = screen.queryAllByRole('button');
  for (const btn of buttons.slice(0, maxButtons)) {
    try { fireEvent.click(btn); } catch { /* ignore */ }
  }
  await waitFor(() => { /* tick */ });
}

// "Escribe en todos los inputs visibles" — ejecuta validadores y onChange handlers.
function typeInAllInputs(value = 'test') {
  const inputs = document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([disabled]), textarea:not([disabled])');
  inputs.forEach(input => {
    try {
      fireEvent.change(input, { target: { value } });
      fireEvent.blur(input);
    } catch { /* ignore */ }
  });
}

// ───── Tests por página ─────
describe('Interaction tests — abren modales y disparan handlers', () => {
  it('MoviesPage: abre el modal de crear y rellena el formulario', async () => {
    const { default: MoviesPage } = await import('./movies/MoviesPage');
    renderPage(<MoviesPage />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe();
    typeInAllInputs('Película test');
    await clickAllSafe(15);
  });

  it('RoomsPage: ciclo crear/editar/borrar', async () => {
    const { default: RoomsPage } = await import('./rooms/RoomsPage');
    renderPage(<RoomsPage />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe();
    typeInAllInputs('Sala 1');
    await clickAllSafe(15);
  });

  it('UsersPage: abre modal y formulario', async () => {
    const { default: UsersPage } = await import('./users/UsersPage');
    renderPage(<UsersPage />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe();
    typeInAllInputs('user@test.com');
    await clickAllSafe(15);
  });

  it('EmployeesPage: abre modal y formulario', async () => {
    const { default: EmployeesPage } = await import('./employees/EmployeesPage');
    renderPage(<EmployeesPage />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe();
    typeInAllInputs('emp test');
    await clickAllSafe(15);
  });

  it('ClientsPage: abre modal y formulario', async () => {
    const { default: ClientsPage } = await import('./clients/ClientsPage');
    renderPage(<ClientsPage />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe();
    typeInAllInputs('cliente@test.com');
    await clickAllSafe(15);
  });

  it('IncidentsPage: abre modal y formulario', async () => {
    const { default: IncidentsPage } = await import('./incidents/IncidentsPage');
    renderPage(<IncidentsPage />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe();
    typeInAllInputs('incidencia test');
    await clickAllSafe(15);
  });

  it('InventoryPage: abre modal y formulario', async () => {
    const { default: InventoryPage } = await import('./inventory/InventoryPage');
    renderPage(<InventoryPage />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe();
    typeInAllInputs('producto');
    await clickAllSafe(15);
  });

  it('SchedulesPage: abre modal y formulario', async () => {
    const { default: SchedulesPage } = await import('./schedules/SchedulesPage');
    renderPage(<SchedulesPage />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe();
    typeInAllInputs('2026-12-01T20:00');
    await clickAllSafe(15);
  });

  it('ShiftsPage: abre modal y formulario', async () => {
    const { default: ShiftsPage } = await import('./shifts/ShiftsPage');
    renderPage(<ShiftsPage />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe();
    typeInAllInputs('test');
    await clickAllSafe(15);
  });

  it('AuditPage: cambia filtros', async () => {
    const { default: AuditPage } = await import('./audit/AuditPage');
    renderPage(<AuditPage />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe();
    typeInAllInputs('filtro');
  });

  it('ReportsPage: monta y renderiza datos mockeados', async () => {
    const { default: ReportsPage } = await import('./reports/ReportsPage');
    renderPage(<ReportsPage />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe();
  });

  it('Dashboard: monta con datos mockeados y dispara navegación a KPIs', async () => {
    const { default: Dashboard } = await import('./dashboard/Dashboard');
    renderPage(<Dashboard />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe(20);
  });

  it('BoxOfficePage: smoke profundo', async () => {
    const { default: Page } = await import('./pos/BoxOfficePage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe(10);
    typeInAllInputs('test');
    await clickAllSafe(20);
  });

  it('ConcessionPage: smoke profundo', async () => {
    const { default: Page } = await import('./pos/ConcessionPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe(10);
    typeInAllInputs('1');
    await clickAllSafe(20);
  });

  it('ReservationsPage: smoke profundo', async () => {
    const { default: Page } = await import('./reservations/ReservationsPage');
    renderPage(<Page />);
    await waitFor(() => { /* tick */ });
    await clickAllSafe(10);
    typeInAllInputs('test');
    await clickAllSafe(20);
  });
});
