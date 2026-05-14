import {
  MOVIES, ROOMS, SESSIONS, RESERVATIONS, INCIDENTS,
  USERS, EMPLOYEE_USERS, AUDIT_LOGS, INVENTORY, SALES_WEEK, OCCUPANCY_BY_ROOM,
  EMPLOYEES, SHIFTS,
} from './mockData';

function clone(x) { return JSON.parse(JSON.stringify(x)); }

let _movies       = clone(MOVIES);
let _rooms        = clone(ROOMS);
let _sessions     = clone(SESSIONS);
let _reservations = clone(RESERVATIONS);
let _incidents    = clone(INCIDENTS);
let _users        = clone(USERS);
let _inventory    = clone(INVENTORY);
let _employees    = clone(EMPLOYEES);
let _shifts       = clone(SHIFTS);
const _auditLogs  = clone(AUDIT_LOGS);

function nextId(arr) { return Math.max(0, ...arr.map(x => Number(x.id) || 0)) + 1; }
function delay()     { return new Promise(r => setTimeout(r, 150)); }
function now()       { return new Date().toISOString().slice(0, 16).replace('T', ' '); }

const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateSeats(session, room) {
  const capacity = room?.capacity ?? session?.capacity ?? 100;
  const sold     = session?.sold ?? 0;
  const COLS     = capacity <= 80 ? 8 : capacity <= 150 ? 12 : capacity <= 220 ? 16 : 20;
  const ROWS     = Math.ceil(capacity / COLS);

  let seed = (session.id * 1664525 + 1013904223) & 0x7fffffff;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff; };
  const indices = Array.from({ length: capacity }, (_, i) => i);
  const toOccupy = Math.min(sold, capacity);
  for (let i = 0; i < toOccupy; i++) {
    const j = i + Math.floor(rand() * (capacity - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const occupiedSet = new Set(indices.slice(0, toOccupy));

  const seats = [];
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    const row = ROW_LETTERS[r] ?? String(r + 1);
    for (let c = 0; c < COLS; c++) {
      if (idx >= capacity) break;
      seats.push({ id: `${session.id}-${row}${String(c + 1).padStart(2, '0')}`, row, number: c + 1, status: occupiedSet.has(idx) ? 'occupied' : 'available' });
      idx++;
    }
  }
  return seats;
}

// Matches a URL pattern like /movies/:id against a path like /movies/3
function match(pattern, rawPath) {
  const path = rawPath.split('?')[0];
  const pp = pattern.split('/');
  const rp = path.split('/');
  if (pp.length !== rp.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = rp[i];
    else if (pp[i] !== rp[i]) return null;
  }
  return params;
}

export async function mockRequest(path, options = {}) {
  await delay();
  const method = (options.method ?? 'GET').toUpperCase();
  let body;
  if (options.body) {
    body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
  }

  let p;

  // AUTH
  if (match('/auth/login', path) && method === 'POST') {
    const u = _users.find(x => x.email === body.email && x.status !== 'inactive');
    if (!u || body.password !== 'lumen2026') { const e = new Error('Credenciales inválidas'); e.status = 401; throw e; }
    return { user: u, token: 'mock-' + u.id };
  }
  if (match('/auth/employee-login', path) && method === 'POST') {
    const u = EMPLOYEE_USERS.find(x => x.email === body.email && x.status !== 'inactive');
    if (!u || body.password !== 'lumen2026') { const e = new Error('Credenciales inválidas'); e.status = 401; throw e; }
    return { user: u, token: 'mock-emp-' + u.id };
  }
  if (match('/auth/me', path)) {
    const id = (options.headers?.Authorization ?? '').replace('Bearer mock-', '');
    return { user: _users.find(x => String(x.id) === id) ?? null };
  }
  if (match('/auth/logout', path)) return null;

  // MOVIES
  if (match('/movies', path)) {
    if (method === 'GET')  return _movies;
    if (method === 'POST') { const item = { ...body, id: nextId(_movies), status: body.status ?? 'active' }; _movies.push(item); return item; }
  }
  p = match('/movies/:id', path);
  if (p) {
    const id = Number(p.id);
    if (method === 'GET')    return _movies.find(x => x.id === id) ?? null;
    if (method === 'PUT')    { _movies = _movies.map(x => x.id === id ? { ...x, ...body } : x); return _movies.find(x => x.id === id); }
    if (method === 'DELETE') { _movies = _movies.filter(x => x.id !== id); return null; }
  }

  // THEATERS (rooms)
  if (match('/theaters', path)) {
    if (method === 'GET')  return _rooms;
    if (method === 'POST') { const item = { ...body, id: nextId(_rooms) }; _rooms.push(item); return item; }
  }
  p = match('/theaters/:id', path);
  if (p) {
    const id = Number(p.id);
    if (method === 'GET')    return _rooms.find(x => x.id === id) ?? null;
    if (method === 'PUT')    { _rooms = _rooms.map(x => x.id === id ? { ...x, ...body } : x); return _rooms.find(x => x.id === id); }
    if (method === 'DELETE') { _rooms = _rooms.filter(x => x.id !== id); return null; }
  }

  // SCREENINGS — /screenings/:id/seats must come before /screenings/:id
  p = match('/screenings/:id/seats', path);
  if (p) {
    const session = _sessions.find(x => x.id === Number(p.id));
    if (!session) return [];
    return generateSeats(session, _rooms.find(r => r.id === session.room_id));
  }
  // Must match before /screenings/:id
  if (match('/screenings/upcoming', path)) {
    if (method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      return _sessions.filter(s => (s.date ?? s.shiftDate ?? '') >= today);
    }
  }
  if (match('/screenings', path)) {
    if (method === 'GET')  return _sessions;
    if (method === 'POST') { const item = { ...body, id: nextId(_sessions), sold: 0 }; _sessions.push(item); return item; }
  }
  p = match('/screenings/:id', path);
  if (p) {
    const id = Number(p.id);
    if (method === 'GET')    return _sessions.find(x => x.id === id) ?? null;
    if (method === 'PUT')    { _sessions = _sessions.map(x => x.id === id ? { ...x, ...body } : x); return _sessions.find(x => x.id === id); }
    if (method === 'DELETE') { _sessions = _sessions.filter(x => x.id !== id); return null; }
  }

  // MERCHANDISE/SALES — must come before /merchandise/:id
  if (match('/merchandise/sales', path) && method === 'POST') {
    return { sale_id: `SALE-${Date.now()}` };
  }

  // PURCHASES (reservations & ticket sales)
  if (match('/purchases', path)) {
    if (method === 'GET')  return _reservations;
    if (method === 'POST') {
      const saleId = `RES-${Date.now()}`;
      const item = { ...body, id: saleId, created_at: now(), status: 'PENDING', tickets: (body.tickets ?? []).map(t => ({ id: `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...t, row: 'A', number: 1, ticketType: t.ticketType ?? 'ADULT' })) };
      _reservations.push(item);
      return { success: true, data: item };
    }
  }
  // Purchase confirm/cancel must match before generic /purchases/:id
  p = match('/purchases/:id/confirm', path);
  if (p && method === 'POST') {
    const id = p.id;
    const item = _reservations.find(x => x.id === id);
    if (item) { item.status = 'confirmed'; }
    return { success: true, data: { ...item, status: 'confirmed' } };
  }
  p = match('/purchases/:id/cancel', path);
  if (p && method === 'POST') {
    const id = p.id;
    const item = _reservations.find(x => x.id === id);
    if (item) { item.status = 'cancelled'; }
    return { success: true, data: { ...item, status: 'cancelled' } };
  }
  p = match('/purchases/:id', path);
  if (p) {
    const id = p.id;
    if (method === 'GET')    return _reservations.find(x => x.id === id) ?? null;
    if (method === 'PUT')    { _reservations = _reservations.map(x => x.id === id ? { ...x, ...body } : x); return _reservations.find(x => x.id === id); }
    if (method === 'DELETE') { _reservations = _reservations.filter(x => x.id !== id); return null; }
  }

  // INCIDENTS
  if (match('/incidents', path)) {
    if (method === 'GET')  return _incidents;
    if (method === 'POST') { const item = { ...body, id: `INC-${Date.now()}`, created_at: now(), updated_at: now() }; _incidents.push(item); return item; }
  }
  p = match('/incidents/:id', path);
  if (p) {
    const id = p.id;
    if (method === 'GET')    return _incidents.find(x => x.id === id) ?? null;
    if (method === 'PUT')    { _incidents = _incidents.map(x => x.id === id ? { ...x, ...body, updated_at: now() } : x); return _incidents.find(x => x.id === id); }
    if (method === 'DELETE') { _incidents = _incidents.filter(x => x.id !== id); return null; }
  }

  // USERS
  if (match('/users', path)) {
    if (method === 'GET')  return _users;
    if (method === 'POST') { const item = { ...body, id: nextId(_users), created_at: now(), status: body.status ?? 'active' }; _users.push(item); return item; }
  }
  p = match('/users/:id', path);
  if (p) {
    const id = Number(p.id);
    if (method === 'GET')    return _users.find(x => x.id === id) ?? null;
    if (method === 'PUT')    { _users = _users.map(x => x.id === id ? { ...x, ...body } : x); return _users.find(x => x.id === id); }
    if (method === 'DELETE') { _users = _users.filter(x => x.id !== id); return null; }
  }

  // EMPLOYEES
  if (match('/employees', path)) {
    if (method === 'GET')  return { success: true, data: _employees };
    if (method === 'POST') { const item = { ...body, id: nextId(_employees), createdAt: now() }; _employees.push(item); return { success: true, data: item }; }
  }
  p = match('/employees/:id', path);
  if (p) {
    const id = Number(p.id);
    if (method === 'GET')    return { success: true, data: _employees.find(x => x.id === id) ?? null };
    if (method === 'PUT')    { _employees = _employees.map(x => x.id === id ? { ...x, ...body } : x); return { success: true, data: _employees.find(x => x.id === id) }; }
    if (method === 'DELETE') { _employees = _employees.filter(x => x.id !== id); return { success: true, data: null }; }
  }

  // SHIFTS
  if (match('/shifts/range', path)) {
    const params = Object.fromEntries(new URLSearchParams(path.split('?')[1] || ''));
    const from = params.from;
    const to = params.to;
    if (method === 'GET') {
      const filtered = _shifts.filter(s => s.shiftDate >= from && s.shiftDate <= to);
      return { success: true, data: filtered };
    }
  }
  p = match('/shifts/date/:date', path);
  if (p) {
    if (method === 'GET') return { success: true, data: _shifts.filter(s => s.shiftDate === p.date) };
  }
  if (match('/shifts', path)) {
    if (method === 'GET')  return { success: true, data: _shifts };
    if (method === 'POST') { const item = { id: nextId(_shifts), ...body, createdAt: now() }; _shifts.push(item); return { success: true, data: item }; }
  }
  p = match('/shifts/:id', path);
  if (p) {
    const id = Number(p.id);
    if (method === 'GET')    return { success: true, data: _shifts.find(x => x.id === id) ?? null };
    if (method === 'PUT')    { _shifts = _shifts.map(x => x.id === id ? { ...x, ...body } : x); return { success: true, data: _shifts.find(x => x.id === id) }; }
    if (method === 'DELETE') { _shifts = _shifts.filter(x => x.id !== id); return { success: true, data: null }; }
  }

  // MERCHANDISE (inventory)
  if (match('/merchandise', path)) {
    if (method === 'GET')  return _inventory;
    if (method === 'POST') { const item = { ...body, id: nextId(_inventory) }; _inventory.push(item); return item; }
  }
  p = match('/merchandise/:id', path);
  if (p) {
    const id = Number(p.id);
    if (method === 'GET')    return _inventory.find(x => x.id === id) ?? null;
    if (method === 'PUT')    { _inventory = _inventory.map(x => x.id === id ? { ...x, ...body } : x); return _inventory.find(x => x.id === id); }
    if (method === 'DELETE') { _inventory = _inventory.filter(x => x.id !== id); return null; }
  }

  // AUDIT LOGS
  if (match('/audit-logs', path)) return _auditLogs;

  // REPORTS
  if (match('/reports/sales-week', path)) return SALES_WEEK;
  if (match('/reports/occupancy', path))  return OCCUPANCY_BY_ROOM;
  if (match('/reports/kpis', path)) {
    const revenue_today   = SALES_WEEK.at(-1)?.revenue ?? 0;
    const tickets_today   = SALES_WEEK.at(-1)?.tickets ?? 0;
    const occupancy_avg   = Math.round(OCCUPANCY_BY_ROOM.reduce((s, r) => s + r.pct, 0) / OCCUPANCY_BY_ROOM.length);
    const incidents_open  = _incidents.filter(i => i.status === 'open' || i.status === 'in_progress').length;
    return { revenue_today, tickets_today, occupancy_avg, incidents_open };
  }

  // SEATS
  if (match('/seats', path)) return [];

  throw new Error(`[mock] Ruta no implementada: ${method} ${path}`);
}
