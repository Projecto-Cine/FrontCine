import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the `api` module BEFORE importing the services.
// Each function (get, post, etc.) is a vi.fn() returning a resolved promise.
vi.mock('./api', () => ({
  api: {
    get:           vi.fn().mockResolvedValue([]),
    post:          vi.fn().mockResolvedValue({}),
    postFormData:  vi.fn().mockResolvedValue({}),
    put:           vi.fn().mockResolvedValue({}),
    patch:         vi.fn().mockResolvedValue({}),
    delete:        vi.fn().mockResolvedValue(null),
  },
}));

import { api } from './api';
import { moviesService } from './moviesService';
import { authService } from './authService';
import { auditService } from './auditService';
import { clientsService } from './clientsService';
import { dashboardService } from './dashboardService';
import { employeesService } from './employeesService';
import { inventoryService, merchandiseService } from './inventoryService';
import { merchandiseSalesService } from './merchandiseSalesService';
import { reportsService } from './reportsService';
import { reservationsService, purchasesService } from './reservationsService';
import { roomsService, theatersService } from './roomsService';
import { salesService } from './salesService';
import { seatsService } from './seatsService';
import { sessionsService, screeningsService } from './sessionsService';
import { shiftsService } from './shiftsService';
import { ticketsService } from './ticketsService';
import { usersService } from './usersService';
import { workersService } from './workersService';

beforeEach(() => {
  // Reset the call counts between tests to avoid contamination.
  vi.clearAllMocks();
});

// ───── moviesService ─────
describe('moviesService', () => {
  it('getAll → GET /movies', () => {
    moviesService.getAll();
    expect(api.get).toHaveBeenCalledWith('/movies');
  });
  it('getActive → GET /movies/active', () => {
    moviesService.getActive();
    expect(api.get).toHaveBeenCalledWith('/movies/active');
  });
  it('getById interpolates the id', () => {
    moviesService.getById(7);
    expect(api.get).toHaveBeenCalledWith('/movies/7');
  });
  it('create → POST with body', () => {
    moviesService.create({ title: 'Dune' });
    expect(api.post).toHaveBeenCalledWith('/movies', { title: 'Dune' });
  });
  it('createFormData → postFormData', () => {
    const fd = new FormData();
    moviesService.createFormData(fd);
    expect(api.postFormData).toHaveBeenCalledWith('/movies', fd);
  });
  it('update → PUT with id and body', () => {
    moviesService.update(3, { title: 'X' });
    expect(api.put).toHaveBeenCalledWith('/movies/3', { title: 'X' });
  });
  it('remove → DELETE with id', () => {
    moviesService.remove(3);
    expect(api.delete).toHaveBeenCalledWith('/movies/3');
  });
});

// ───── authService ─────
describe('authService', () => {
  it('login → POST /auth/login with email and password', () => {
    authService.login('a@b.com', 'pw');
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pw' });
  });
});

// ───── auditService ─────
describe('auditService', () => {
  it('getAll without params', () => {
    auditService.getAll();
    expect(api.get).toHaveBeenCalledWith('/audit-logs');
  });
  it('getAll with params builds the query string', () => {
    auditService.getAll({ page: 1, size: 10 });
    expect(api.get).toHaveBeenCalledWith('/audit-logs?page=1&size=10');
  });
});

// ───── clientsService ─────
describe('clientsService', () => {
  it('getAll, getById, create, update, remove', () => {
    clientsService.getAll();
    expect(api.get).toHaveBeenCalledWith('/clients');

    clientsService.getById(2);
    expect(api.get).toHaveBeenCalledWith('/clients/2');

    clientsService.create({ name: 'Ana' });
    expect(api.post).toHaveBeenCalledWith('/users', { name: 'Ana' });

    clientsService.update(2, { name: 'B' });
    expect(api.put).toHaveBeenCalledWith('/clients/2', { name: 'B' });

    clientsService.remove(2);
    expect(api.delete).toHaveBeenCalledWith('/clients/2');
  });
  it('search encodes special characters (encodeURIComponent)', () => {
    clientsService.search('a b&c');
    expect(api.get).toHaveBeenCalledWith('/clients/search?q=a%20b%26c');
  });
});

// ───── dashboardService ─────
describe('dashboardService', () => {
  it('get → /dashboard', () => {
    dashboardService.get();
    expect(api.get).toHaveBeenCalledWith('/dashboard');
  });
  it('getPurchases → /purchases', () => {
    dashboardService.getPurchases();
    expect(api.get).toHaveBeenCalledWith('/purchases');
  });
});

// ───── employeesService ─────
describe('employeesService', () => {
  it('full CRUD points at /employees', () => {
    employeesService.getAll();
    employeesService.getById(1);
    employeesService.create({ name: 'A' });
    employeesService.update(1, { name: 'B' });
    employeesService.remove(1);

    expect(api.get).toHaveBeenCalledWith('/employees');
    expect(api.get).toHaveBeenCalledWith('/employees/1');
    expect(api.post).toHaveBeenCalledWith('/employees', { name: 'A' });
    expect(api.put).toHaveBeenCalledWith('/employees/1', { name: 'B' });
    expect(api.delete).toHaveBeenCalledWith('/employees/1');
  });
});

// ───── inventoryService / merchandiseService ─────
describe('inventoryService', () => {
  it('points at /merchandise', () => {
    inventoryService.getAll();
    expect(api.get).toHaveBeenCalledWith('/merchandise');
  });
  it('inventoryService === merchandiseService (alias)', () => {
    expect(inventoryService).toBe(merchandiseService);
  });
  it('CRUD: getById, create, update, remove', () => {
    inventoryService.getById(1);
    inventoryService.create({ name: 'P' });
    inventoryService.update(1, { name: 'Q' });
    inventoryService.remove(1);
    expect(api.get).toHaveBeenCalledWith('/merchandise/1');
    expect(api.post).toHaveBeenCalledWith('/merchandise', { name: 'P' });
    expect(api.put).toHaveBeenCalledWith('/merchandise/1', { name: 'Q' });
    expect(api.delete).toHaveBeenCalledWith('/merchandise/1');
  });
});

// ───── merchandiseSalesService ─────
describe('merchandiseSalesService', () => {
  it('CRUD points at /merchandisesales', () => {
    merchandiseSalesService.getAll();
    merchandiseSalesService.getById(1);
    merchandiseSalesService.create({ q: 1 });
    merchandiseSalesService.update(1, { q: 2 });
    merchandiseSalesService.remove(1);
    expect(api.get).toHaveBeenCalledWith('/merchandisesales');
    expect(api.get).toHaveBeenCalledWith('/merchandisesales/1');
    expect(api.post).toHaveBeenCalledWith('/merchandisesales', { q: 1 });
    expect(api.put).toHaveBeenCalledWith('/merchandisesales/1', { q: 2 });
    expect(api.delete).toHaveBeenCalledWith('/merchandisesales/1');
  });
});

// ───── reportsService ─────
describe('reportsService', () => {
  it('salesWeek → /reports/sales-week', () => {
    reportsService.salesWeek();
    expect(api.get).toHaveBeenCalledWith('/reports/sales-week');
  });
  it('occupancy → /reports/occupancy', () => {
    reportsService.occupancy();
    expect(api.get).toHaveBeenCalledWith('/reports/occupancy');
  });
});

// ───── reservationsService / purchasesService ─────
describe('reservationsService', () => {
  it('reservationsService === purchasesService (alias)', () => {
    expect(reservationsService).toBe(purchasesService);
  });
  it('CRUD + actions (pay, confirm, cancel)', () => {
    reservationsService.getAll();
    reservationsService.getById(1);
    reservationsService.getByUser(5);
    reservationsService.getByScreening(9);
    reservationsService.create({ x: 1 });
    reservationsService.update(1, { x: 2 });
    reservationsService.pay(1, { paymentMethod: 'CARD' });
    reservationsService.pay(1); // no body → must send {}
    reservationsService.confirm(1);
    reservationsService.cancel(1);
    reservationsService.remove(1);

    expect(api.get).toHaveBeenCalledWith('/purchases');
    expect(api.get).toHaveBeenCalledWith('/purchases/1');
    expect(api.get).toHaveBeenCalledWith('/purchases/user/5');
    expect(api.get).toHaveBeenCalledWith('/purchases/screening/9');
    expect(api.post).toHaveBeenCalledWith('/purchases', { x: 1 });
    expect(api.put).toHaveBeenCalledWith('/purchases/1', { x: 2 });
    expect(api.post).toHaveBeenCalledWith('/purchases/1/confirm', { paymentMethod: 'CARD' });
    expect(api.post).toHaveBeenCalledWith('/purchases/1/confirm', {});
    expect(api.post).toHaveBeenCalledWith('/purchases/1/cancel', {});
    expect(api.delete).toHaveBeenCalledWith('/purchases/1');
  });
});

// ───── roomsService / theatersService ─────
describe('roomsService', () => {
  it('roomsService === theatersService (alias)', () => {
    expect(roomsService).toBe(theatersService);
  });
  it('points at /theaters', () => {
    roomsService.getAll();
    roomsService.getById(1);
    roomsService.getSeats(1);
    roomsService.create({ name: 'A' });
    roomsService.update(1, { name: 'B' });
    roomsService.remove(1);
    expect(api.get).toHaveBeenCalledWith('/theaters');
    expect(api.get).toHaveBeenCalledWith('/theaters/1');
    expect(api.get).toHaveBeenCalledWith('/theaters/1/seats');
    expect(api.post).toHaveBeenCalledWith('/theaters', { name: 'A' });
    expect(api.put).toHaveBeenCalledWith('/theaters/1', { name: 'B' });
    expect(api.delete).toHaveBeenCalledWith('/theaters/1');
  });
});

// ───── salesService ─────
describe('salesService', () => {
  it('createPurchase, confirmPurchase, cancelPurchase', () => {
    salesService.createPurchase({ a: 1 });
    salesService.confirmPurchase(1);
    salesService.cancelPurchase(1);
    expect(api.post).toHaveBeenCalledWith('/purchases', { a: 1 });
    expect(api.post).toHaveBeenCalledWith('/purchases/1/confirm', {});
    expect(api.post).toHaveBeenCalledWith('/purchases/1/cancel', {});
  });
  it('createMerchandiseSale, createTicketSale, createConcessionSale', () => {
    salesService.createMerchandiseSale({ x: 1 });
    salesService.createTicketSale({ y: 2 });
    salesService.createConcessionSale({ z: 3 });
    expect(api.post).toHaveBeenCalledWith('/merchandisesales', { x: 1 });
    expect(api.post).toHaveBeenCalledWith('/purchases', { y: 2 });
    expect(api.post).toHaveBeenCalledWith('/merchandise/sales', { z: 3 });
  });
});

// ───── seatsService ─────
describe('seatsService', () => {
  it('getAll with and without params', () => {
    seatsService.getAll();
    expect(api.get).toHaveBeenCalledWith('/seats');
    seatsService.getAll({ theater: 1 });
    expect(api.get).toHaveBeenCalledWith('/seats?theater=1');
  });
  it('remaining CRUD and queries', () => {
    seatsService.getById(1);
    seatsService.getByTheater(2);
    seatsService.getByScreening(3);
    seatsService.create({ row: 1 });
    seatsService.update(1, { row: 2 });
    seatsService.remove(1);
    expect(api.get).toHaveBeenCalledWith('/seats/1');
    expect(api.get).toHaveBeenCalledWith('/theaters/2/seats');
    expect(api.get).toHaveBeenCalledWith('/screenings/3/seats');
    expect(api.post).toHaveBeenCalledWith('/seats', { row: 1 });
    expect(api.put).toHaveBeenCalledWith('/seats/1', { row: 2 });
    expect(api.delete).toHaveBeenCalledWith('/seats/1');
  });
});

// ───── sessionsService / screeningsService ─────
describe('sessionsService', () => {
  it('sessionsService === screeningsService (alias)', () => {
    expect(sessionsService).toBe(screeningsService);
  });
  it('all queries and actions', () => {
    sessionsService.getAll();
    sessionsService.getAll({ from: '2026-01-01' });
    sessionsService.getUpcoming();
    sessionsService.getById(1);
    sessionsService.getByMovie(2);
    sessionsService.getPurchases(1);
    sessionsService.create({ x: 1 });
    sessionsService.update(1, { x: 2 });
    sessionsService.remove(1);
    sessionsService.reserveSeat(1, 5);
    sessionsService.releaseSeat(1, 5);

    expect(api.get).toHaveBeenCalledWith('/screenings');
    expect(api.get).toHaveBeenCalledWith('/screenings?from=2026-01-01');
    expect(api.get).toHaveBeenCalledWith('/screenings/upcoming');
    expect(api.get).toHaveBeenCalledWith('/screenings/1');
    expect(api.get).toHaveBeenCalledWith('/screenings/movie/2');
    expect(api.get).toHaveBeenCalledWith('/screenings/1/purchases');
    expect(api.post).toHaveBeenCalledWith('/screenings', { x: 1 });
    expect(api.put).toHaveBeenCalledWith('/screenings/1', { x: 2 });
    expect(api.delete).toHaveBeenCalledWith('/screenings/1');
    expect(api.post).toHaveBeenCalledWith('/screenings/1/seats/5/reserve', {});
    expect(api.post).toHaveBeenCalledWith('/screenings/1/seats/5/release', {});
  });
});

// ───── shiftsService ─────
describe('shiftsService', () => {
  it('CRUD and filters by date / range', () => {
    shiftsService.getAll();
    shiftsService.getById(1);
    shiftsService.getByDate('2026-05-15');
    shiftsService.getByRange('2026-05-01', '2026-05-31');
    shiftsService.create({ x: 1 });
    shiftsService.update(1, { x: 2 });
    shiftsService.remove(1);
    expect(api.get).toHaveBeenCalledWith('/shifts');
    expect(api.get).toHaveBeenCalledWith('/shifts/1');
    expect(api.get).toHaveBeenCalledWith('/shifts/date/2026-05-15');
    expect(api.get).toHaveBeenCalledWith('/shifts/range?from=2026-05-01&to=2026-05-31');
    expect(api.post).toHaveBeenCalledWith('/shifts', { x: 1 });
    expect(api.put).toHaveBeenCalledWith('/shifts/1', { x: 2 });
    expect(api.delete).toHaveBeenCalledWith('/shifts/1');
  });
});

// ───── ticketsService ─────
describe('ticketsService', () => {
  it('queries with and without params', () => {
    ticketsService.getAll();
    ticketsService.getAll({ status: 'PAID' });
    ticketsService.getByPurchase(1);
    ticketsService.getByScreening(2);
    ticketsService.getById(3);
    expect(api.get).toHaveBeenCalledWith('/tickets');
    expect(api.get).toHaveBeenCalledWith('/tickets?status=PAID');
    expect(api.get).toHaveBeenCalledWith('/tickets?purchaseId=1');
    expect(api.get).toHaveBeenCalledWith('/tickets?screeningId=2');
    expect(api.get).toHaveBeenCalledWith('/tickets/3');
  });
});

// ───── usersService ─────
describe('usersService', () => {
  it('CRUD + uploadImage uses postFormData', () => {
    usersService.getAll();
    usersService.getById(1);
    usersService.create({ x: 1 });
    usersService.update(1, { x: 2 });
    const fd = new FormData();
    usersService.uploadImage(1, fd);
    usersService.remove(1);
    expect(api.get).toHaveBeenCalledWith('/users');
    expect(api.get).toHaveBeenCalledWith('/users/1');
    expect(api.post).toHaveBeenCalledWith('/users', { x: 1 });
    expect(api.put).toHaveBeenCalledWith('/users/1', { x: 2 });
    expect(api.postFormData).toHaveBeenCalledWith('/users/1/image', fd);
    expect(api.delete).toHaveBeenCalledWith('/users/1');
  });
});

// ───── workersService ─────
describe('workersService', () => {
  it('CRUD + getByRole + getActive', () => {
    workersService.getAll();
    workersService.getById(1);
    workersService.create({ x: 1 });
    workersService.update(1, { x: 2 });
    workersService.remove(1);
    workersService.getByRole('admin');
    workersService.getActive();
    expect(api.get).toHaveBeenCalledWith('/employees');
    expect(api.get).toHaveBeenCalledWith('/employees/1');
    expect(api.post).toHaveBeenCalledWith('/employees', { x: 1 });
    expect(api.put).toHaveBeenCalledWith('/employees/1', { x: 2 });
    expect(api.delete).toHaveBeenCalledWith('/employees/1');
    expect(api.get).toHaveBeenCalledWith('/employees/role/admin');
    expect(api.get).toHaveBeenCalledWith('/employees/active');
  });
});
