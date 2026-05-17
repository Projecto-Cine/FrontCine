/**
 * SMOKE TESTS — verify that every page mounts without throwing.
 *
 * Philosophy: these tests are "minimal happy path". They do not assert
 * behavior, only that the component tree renders with empty data. They:
 *   - catch broken imports / refactors
 *   - bump coverage without writing 100 specific tests per page
 *   - give confidence that the whole app boots
 *
 * For each page we mock EVERY service to return [] or {}.
 */
import { describe, it, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderPage } from '../test/helpers';

// ───── Service mocks (global for the whole file) ─────
// Default to []; some services return objects — we cover both.
const mkSvc = (extra = {}) => ({
  getAll:         vi.fn().mockResolvedValue([]),
  getById:        vi.fn().mockResolvedValue({}),
  getActive:      vi.fn().mockResolvedValue([]),
  create:         vi.fn().mockResolvedValue({ id: 1 }),
  createFormData: vi.fn().mockResolvedValue({ id: 1 }),
  update:         vi.fn().mockResolvedValue({ id: 1 }),
  remove:         vi.fn().mockResolvedValue(null),
  ...extra,
});

vi.mock('../services/moviesService',           () => ({ moviesService:          mkSvc() }));
vi.mock('../services/auditService',            () => ({ auditService:           mkSvc() }));
vi.mock('../services/clientsService',          () => ({ clientsService:         mkSvc({ search: vi.fn().mockResolvedValue([]) }) }));
vi.mock('../services/dashboardService',        () => ({ dashboardService:       { get: vi.fn().mockResolvedValue({ totalRevenue: 0, weeklyRevenue: 0, totalPurchases: 0, paidPurchases: 0, activeScreenings: 0, confirmedRoomBookings: 0, totalUsers: 0, activeMovies: 0, unresolvedIncidents: 0 }), getPurchases: vi.fn().mockResolvedValue([]) } }));
vi.mock('../services/employeesService',        () => ({ employeesService:       mkSvc() }));
vi.mock('../services/incidentsService',        () => ({ incidentsService:       mkSvc() }));
vi.mock('../services/inventoryService',        () => ({ inventoryService:       mkSvc(), merchandiseService: mkSvc() }));
vi.mock('../services/merchandiseSalesService', () => ({ merchandiseSalesService: mkSvc() }));
vi.mock('../services/reportsService',          () => ({ reportsService:         { salesWeek: vi.fn().mockResolvedValue([]), occupancy: vi.fn().mockResolvedValue([]) } }));
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

// AuthContext: mock so we always have an authenticated user.
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User', role: 'admin' },
    login: vi.fn(),
    logout: vi.fn(),
    error: '',
    setError: vi.fn(),
    can: () => true,
  }),
  AuthProvider: ({ children }) => children,
}));

// Stripe: short-circuit its lazy load so it does not hang.
vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue({}) }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div>{children}</div>,
  CardElement: () => <div data-testid="card-element" />,
  useStripe: () => ({ confirmCardPayment: vi.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }) }),
  useElements: () => ({ getElement: () => ({}) }),
}));

// QR is not relevant in tests.
vi.mock('qrcode.react', () => ({ QRCodeSVG: () => <div data-testid="qr" /> }));

beforeEach(() => vi.clearAllMocks());

// ───── Helper: renders a page and waits for its useEffect to finish ─────
async function smokeRender(Component, { route } = {}) {
  const result = renderPage(<Component />, { route });
  // Give a microtick so service promises resolve and the matching
  // setStates are flushed.
  await waitFor(() => { /* settle tick */ });
  return result;
}

describe('Smoke tests — every page mounts without error', () => {
  it('Dashboard', async () => {
    const { default: Dashboard } = await import('./dashboard/Dashboard');
    await smokeRender(Dashboard);
  });

  it('AuditPage', async () => {
    const { default: AuditPage } = await import('./audit/AuditPage');
    await smokeRender(AuditPage);
  });

  it('ClientsPage', async () => {
    const { default: ClientsPage } = await import('./clients/ClientsPage');
    await smokeRender(ClientsPage);
  });

  it('EmployeesPage', async () => {
    const { default: EmployeesPage } = await import('./employees/EmployeesPage');
    await smokeRender(EmployeesPage);
  });

  it('IncidentsPage', async () => {
    const { default: IncidentsPage } = await import('./incidents/IncidentsPage');
    await smokeRender(IncidentsPage);
  });

  it('InventoryPage', async () => {
    const { default: InventoryPage } = await import('./inventory/InventoryPage');
    await smokeRender(InventoryPage);
  });

  it('MoviesPage', async () => {
    const { default: MoviesPage } = await import('./movies/MoviesPage');
    await smokeRender(MoviesPage);
  });

  it('ReportsPage', async () => {
    const { default: ReportsPage } = await import('./reports/ReportsPage');
    await smokeRender(ReportsPage);
  });

  it('ReservationsPage', async () => {
    const { default: ReservationsPage } = await import('./reservations/ReservationsPage');
    await smokeRender(ReservationsPage);
  });

  it('RoomsPage', async () => {
    const { default: RoomsPage } = await import('./rooms/RoomsPage');
    await smokeRender(RoomsPage);
  });

  it('SchedulesPage', async () => {
    const { default: SchedulesPage } = await import('./schedules/SchedulesPage');
    await smokeRender(SchedulesPage);
  });

  it('ShiftsPage', async () => {
    const { default: ShiftsPage } = await import('./shifts/ShiftsPage');
    await smokeRender(ShiftsPage);
  });

  it('UsersPage', async () => {
    const { default: UsersPage } = await import('./users/UsersPage');
    await smokeRender(UsersPage);
  });

  it('BoxOfficePage', async () => {
    const { default: BoxOfficePage } = await import('./pos/BoxOfficePage');
    await smokeRender(BoxOfficePage);
  });

  it('ConcessionPage', async () => {
    const { default: ConcessionPage } = await import('./pos/ConcessionPage');
    await smokeRender(ConcessionPage);
  });
});
