export const TICKET_TYPES = [
  { id: 'adulto',     label: 'Adulto',          price: 13.50, color: 'accent' },
  { id: 'reducida',   label: 'Reducida',         price: 9.00,  color: 'cyan'   },
  { id: 'estudiante', label: 'Estudiante',        price: 8.00,  color: 'purple' },
  { id: 'infantil',   label: 'Infantil (<12)',    price: 7.00,  color: 'green'  },
  { id: 'imax',       label: 'IMAX +',           price: 5.00,  color: 'yellow', extra: true },
  { id: '4dx',        label: '4DX +',            price: 6.50,  color: 'red',    extra: true },
  { id: 'vip',        label: 'VIP +',            price: 8.00,  color: 'purple', extra: true },
];

export const CONCESSION_PRODUCTS = [
  // Palomitas
  { id: 'p1', name: 'Palomitas S',       category: 'Palomitas', price: 3.50, emoji: '🍿', stock: 99 },
  { id: 'p2', name: 'Palomitas M',       category: 'Palomitas', price: 4.50, emoji: '🍿', stock: 99 },
  { id: 'p3', name: 'Palomitas L',       category: 'Palomitas', price: 5.50, emoji: '🍿', stock: 99 },
  { id: 'p4', name: 'Palomitas XL',      category: 'Palomitas', price: 6.50, emoji: '🍿', stock: 99 },
  { id: 'p5', name: 'Palomitas Dulces M',category: 'Palomitas', price: 5.00, emoji: '🍿', stock: 99 },
  // Bebidas
  { id: 'b1', name: 'Coca-Cola 500ml',   category: 'Bebidas',   price: 3.80, emoji: '🥤', stock: 99 },
  { id: 'b2', name: 'Pepsi 500ml',       category: 'Bebidas',   price: 3.50, emoji: '🥤', stock: 99 },
  { id: 'b3', name: 'Agua 500ml',        category: 'Bebidas',   price: 2.00, emoji: '💧', stock: 99 },
  { id: 'b4', name: 'Zumo Naranja',      category: 'Bebidas',   price: 3.20, emoji: '🍊', stock: 99 },
  { id: 'b5', name: 'Cerveza 330ml',     category: 'Bebidas',   price: 4.00, emoji: '🍺', stock: 99 },
  { id: 'b6', name: 'Café Solo',         category: 'Bebidas',   price: 1.80, emoji: '☕', stock: 99 },
  { id: 'b7', name: 'Café con Leche',    category: 'Bebidas',   price: 2.20, emoji: '☕', stock: 99 },
  { id: 'b8', name: 'Smoothie Fresas',   category: 'Bebidas',   price: 4.50, emoji: '🍓', stock: 99 },
  // Snacks
  { id: 's1', name: 'Nachos + Salsa',    category: 'Snacks',    price: 4.50, emoji: '🌮', stock: 99 },
  { id: 's2', name: 'Hot Dog',           category: 'Snacks',    price: 5.00, emoji: '🌭', stock: 99 },
  { id: 's3', name: 'Gominolas 100g',    category: 'Snacks',    price: 2.50, emoji: '🍬', stock: 99 },
  { id: 's4', name: 'Chocolate M&M',     category: 'Snacks',    price: 2.80, emoji: '🍫', stock: 99 },
  { id: 's5', name: 'Patatas Fritas',    category: 'Snacks',    price: 3.00, emoji: '🥔', stock: 99 },
  { id: 's6', name: 'Croissant',         category: 'Snacks',    price: 2.20, emoji: '🥐', stock: 99 },
  // Combos
  { id: 'c1', name: 'Combo Dúo',        category: 'Combos',    price: 11.50, emoji: '🎁', stock: 99, desc: 'Palomitas M + Bebida L' },
  { id: 'c2', name: 'Combo Clásico',    category: 'Combos',    price: 14.50, emoji: '🎁', stock: 99, desc: 'Palomitas L + 2 Bebidas' },
  { id: 'c3', name: 'Combo Familiar',   category: 'Combos',    price: 22.00, emoji: '🎁', stock: 99, desc: 'Palomitas XL + 4 Bebidas' },
  { id: 'c4', name: 'Combo VIP',        category: 'Combos',    price: 18.00, emoji: '⭐', stock: 99, desc: 'Palomitas XL + 2 Cervezas + Nachos' },
];

export const MOVIES = [
  { id: 1, title: 'Dune: Parte Dos', duration: 166, genre: 'Ciencia ficción', language: 'ES', format: 'IMAX', rating: 'PG-13', status: 'active', poster: null, director: 'Denis Villeneuve', year: 2024 },
  { id: 2, title: 'Oppenheimer', duration: 180, genre: 'Drama/Historia', language: 'VO', format: '4DX', rating: 'R', status: 'active', poster: null, director: 'Christopher Nolan', year: 2023 },
  { id: 3, title: 'Poor Things', duration: 141, genre: 'Drama', language: 'VO', format: '2D', rating: 'R', status: 'active', poster: null, director: 'Yorgos Lanthimos', year: 2023 },
  { id: 4, title: 'Kung Fu Panda 4', duration: 94, genre: 'Animación', language: 'ES', format: '3D', rating: 'PG', status: 'active', poster: null, director: 'Mike Mitchell', year: 2024 },
  { id: 5, title: 'Civil War', duration: 109, genre: 'Thriller', language: 'VO', format: '2D', rating: 'R', status: 'active', poster: null, director: 'Alex Garland', year: 2024 },
  { id: 6, title: 'Furiosa', duration: 148, genre: 'Acción', language: 'ES', format: 'IMAX', rating: 'R', status: 'active', poster: null, director: 'George Miller', year: 2024 },
  { id: 7, title: 'Inside Out 2', duration: 100, genre: 'Animación', language: 'ES', format: '3D', rating: 'PG', status: 'active', poster: null, director: 'Kelsey Mann', year: 2024 },
  { id: 8, title: 'Alien: Romulus', duration: 119, genre: 'Terror/Sci-Fi', language: 'VO', format: '4DX', rating: 'R', status: 'active', poster: null, director: 'Fede Álvarez', year: 2024 },
  { id: 9, title: 'Deadpool & Wolverine', duration: 127, genre: 'Acción', language: 'ES', format: 'IMAX', rating: 'R', status: 'active', poster: null, director: 'Shawn Levy', year: 2024 },
  { id: 10, title: 'The Substance', duration: 141, genre: 'Terror/Drama', language: 'VO', format: '2D', rating: 'R', status: 'active', poster: null, director: 'Coralie Fargeat', year: 2024 },
  { id: 11, title: 'Nosferatu', duration: 132, genre: 'Terror', language: 'VO', format: '2D', rating: 'R', status: 'active', poster: null, director: 'Robert Eggers', year: 2024 },
  { id: 12, title: 'Conclave', duration: 120, genre: 'Drama/Thriller', language: 'VO', format: '2D', rating: 'PG-13', status: 'active', poster: null, director: 'Edward Berger', year: 2024 },
  { id: 13, title: 'El Señor de los Anillos: Caza del Anillo', duration: 155, genre: 'Fantasía', language: 'ES', format: 'IMAX', rating: 'PG-13', status: 'upcoming', poster: null, director: 'Peter Jackson', year: 2025 },
  { id: 14, title: 'Misión: Imposible 8', duration: 145, genre: 'Acción', language: 'ES', format: '4DX', rating: 'PG-13', status: 'upcoming', poster: null, director: 'Christopher McQuarrie', year: 2025 },
  { id: 15, title: 'Avatar 3', duration: 190, genre: 'Ciencia ficción', language: 'ES', format: 'IMAX 3D', rating: 'PG-13', status: 'upcoming', poster: null, director: 'James Cameron', year: 2025 },
];

export const ROOMS = [
  { id: 1, name: 'Sala 1 — IMAX', capacity: 280, format: 'IMAX', status: 'active', screen: 'Pantalla curva 28m', audio: 'Dolby Atmos', seats_available: 280, last_maintenance: '2024-04-10' },
  { id: 2, name: 'Sala 2 — 4DX', capacity: 120, format: '4DX', status: 'active', screen: 'Pantalla plana 18m', audio: '4DX Sound', seats_available: 120, last_maintenance: '2024-04-15' },
  { id: 3, name: 'Sala 3 — Premium', capacity: 180, format: '2D/3D', status: 'active', screen: 'Pantalla plana 22m', audio: 'Dolby Digital 7.1', seats_available: 180, last_maintenance: '2024-03-28' },
  { id: 4, name: 'Sala 4 — Estándar', capacity: 220, format: '2D', status: 'active', screen: 'Pantalla plana 20m', audio: 'Dolby Digital 5.1', seats_available: 220, last_maintenance: '2024-04-01' },
  { id: 5, name: 'Sala 5 — Estándar', capacity: 200, format: '2D/3D', status: 'maintenance', screen: 'Pantalla plana 20m', audio: 'Dolby Digital 5.1', seats_available: 0, last_maintenance: '2024-04-29' },
  { id: 6, name: 'Sala 6 — VIP', capacity: 60, format: '2D', status: 'active', screen: 'Pantalla plana 14m', audio: 'Dolby Atmos', seats_available: 60, last_maintenance: '2024-04-20' },
];

export const SESSIONS = [
  { id: 1, movie_id: 1, room_id: 1, date: '2024-04-30', time: '16:00', end_time: '18:46', capacity: 280, sold: 241, status: 'active', price: 18.50 },
  { id: 2, movie_id: 2, room_id: 2, date: '2024-04-30', time: '17:00', end_time: '20:00', capacity: 120, sold: 98, status: 'active', price: 22.00 },
  { id: 3, movie_id: 7, room_id: 3, date: '2024-04-30', time: '15:30', end_time: '17:10', capacity: 180, sold: 155, status: 'active', price: 14.00 },
  { id: 4, movie_id: 9, room_id: 4, date: '2024-04-30', time: '18:00', end_time: '20:07', capacity: 220, sold: 187, status: 'active', price: 16.00 },
  { id: 5, movie_id: 10, room_id: 6, date: '2024-04-30', time: '20:30', end_time: '22:51', capacity: 60, sold: 60, status: 'full', price: 28.00 },
  { id: 6, movie_id: 6, room_id: 1, date: '2024-04-30', time: '20:00', end_time: '22:28', capacity: 280, sold: 203, status: 'active', price: 18.50 },
  { id: 7, movie_id: 3, room_id: 3, date: '2024-04-30', time: '19:00', end_time: '21:21', capacity: 180, sold: 132, status: 'active', price: 14.00 },
  { id: 8, movie_id: 8, room_id: 2, date: '2024-04-30', time: '21:15', end_time: '23:14', capacity: 120, sold: 74, status: 'active', price: 22.00 },
  { id: 9, movie_id: 4, room_id: 4, date: '2024-05-01', time: '10:30', end_time: '12:04', capacity: 220, sold: 0, status: 'scheduled', price: 10.00 },
  { id: 10, movie_id: 5, room_id: 3, date: '2024-05-01', time: '16:00', end_time: '17:49', capacity: 180, sold: 0, status: 'scheduled', price: 13.00 },
  { id: 11, movie_id: 11, room_id: 6, date: '2024-05-01', time: '18:30', end_time: '20:42', capacity: 60, sold: 45, status: 'active', price: 28.00 },
  { id: 12, movie_id: 12, room_id: 4, date: '2024-05-01', time: '20:00', end_time: '22:00', capacity: 220, sold: 112, status: 'active', price: 14.50 },
];

export const RESERVATIONS = [
  { id: 'RES-2024-0001', session_id: 1, client: 'María García López', email: 'mgarcia@email.com', seats: ['A12', 'A13'], amount: 37.00, payment: 'card', status: 'confirmed', created_at: '2024-04-28 10:23' },
  { id: 'RES-2024-0002', session_id: 1, client: 'Carlos Martínez', email: 'cmartinez@email.com', seats: ['B05'], amount: 18.50, payment: 'cash', status: 'confirmed', created_at: '2024-04-28 11:05' },
  { id: 'RES-2024-0003', session_id: 2, client: 'Ana Rodríguez', email: 'arodriguez@email.com', seats: ['C03', 'C04', 'C05'], amount: 66.00, payment: 'card', status: 'confirmed', created_at: '2024-04-29 09:14' },
  { id: 'RES-2024-0004', session_id: 3, client: 'Luis Fernández', email: 'lfernandez@email.com', seats: ['D07', 'D08'], amount: 28.00, payment: 'online', status: 'confirmed', created_at: '2024-04-29 14:30' },
  { id: 'RES-2024-0005', session_id: 5, client: 'Elena Sánchez', email: 'esanchez@email.com', seats: ['A01', 'A02'], amount: 56.00, payment: 'card', status: 'confirmed', created_at: '2024-04-27 18:45' },
  { id: 'RES-2024-0006', session_id: 4, client: 'David Torres', email: 'dtorres@email.com', seats: ['F10'], amount: 16.00, payment: 'cash', status: 'cancelled', created_at: '2024-04-28 16:20' },
  { id: 'RES-2024-0007', session_id: 2, client: 'Isabel Moreno', email: 'imoreno@email.com', seats: ['A08', 'A09', 'A10'], amount: 66.00, payment: 'online', status: 'confirmed', created_at: '2024-04-30 08:00' },
  { id: 'RES-2024-0008', session_id: 6, client: 'Pablo Jiménez', email: 'pjimenez@email.com', seats: ['H15', 'H16'], amount: 37.00, payment: 'card', status: 'confirmed', created_at: '2024-04-30 09:12' },
  { id: 'RES-2024-0009', session_id: 7, client: 'Sofía Ruiz', email: 'sruiz@email.com', seats: ['E04'], amount: 14.00, payment: 'cash', status: 'pending', created_at: '2024-04-30 10:33' },
  { id: 'RES-2024-0010', session_id: 8, client: 'Andrés López', email: 'alopez@email.com', seats: ['B11', 'B12'], amount: 44.00, payment: 'online', status: 'confirmed', created_at: '2024-04-30 11:05' },
  { id: 'RES-2024-0011', session_id: 1, client: 'Laura Pérez', email: 'lperez@email.com', seats: ['G20', 'G21', 'G22'], amount: 55.50, payment: 'card', status: 'confirmed', created_at: '2024-04-30 12:00' },
  { id: 'RES-2024-0012', session_id: 3, client: 'Miguel Díaz', email: 'mdiaz@email.com', seats: ['A01', 'A02'], amount: 28.00, payment: 'cash', status: 'refunded', created_at: '2024-04-26 15:20' },
];

export const INCIDENTS = [
  { id: 'INC-001', title: 'Proyector Sala 2 — parpadeo intermitente', category: 'Técnico', priority: 'high', status: 'open', room: 'Sala 2 — 4DX', reported_by: 'operador2', assigned_to: 'mantenimiento1', created_at: '2024-04-30 07:30', updated_at: '2024-04-30 08:15', description: 'El proyector 4DX presenta parpadeo cada ~10 min durante la sesión.' },
  { id: 'INC-002', title: 'Aire acondicionado Sala 5 — avería total', category: 'Infraestructura', priority: 'critical', status: 'in_progress', room: 'Sala 5 — Estándar', reported_by: 'supervisor1', assigned_to: 'mantenimiento1', created_at: '2024-04-29 14:00', updated_at: '2024-04-30 09:00', description: 'HVAC completamente averiado. Sala bloqueada hasta reparación.' },
  { id: 'INC-003', title: 'Butacas filas D-E Sala 4 — mecanismo roto', category: 'Mobiliario', priority: 'medium', status: 'open', room: 'Sala 4 — Estándar', reported_by: 'taquilla1', assigned_to: null, created_at: '2024-04-30 10:00', updated_at: '2024-04-30 10:00', description: '8 butacas en filas D y E con mecanismo reclinable roto.' },
  { id: 'INC-004', title: 'Sistema de pago TPV — error intermitente', category: 'Software', priority: 'high', status: 'resolved', room: 'Taquilla', reported_by: 'taquilla2', assigned_to: 'admin1', created_at: '2024-04-29 11:30', updated_at: '2024-04-30 06:00', description: 'TPV rechazaba pagos con Visa. Resuelto con actualización firmware.' },
  { id: 'INC-005', title: 'Luz de emergencia Pasillo B — fundida', category: 'Seguridad', priority: 'medium', status: 'in_progress', room: 'Pasillo B', reported_by: 'mantenimiento2', assigned_to: 'mantenimiento2', created_at: '2024-04-28 17:00', updated_at: '2024-04-29 09:00', description: 'Luz de emergencia norma UNE. Requiere reposición urgente.' },
  { id: 'INC-006', title: 'Pantalla Sala 3 — mancha esquina inferior', category: 'Técnico', priority: 'low', status: 'open', room: 'Sala 3 — Premium', reported_by: 'operador1', assigned_to: null, created_at: '2024-04-27 21:30', updated_at: '2024-04-27 21:30', description: 'Mancha visible en esquina inferior derecha durante contenido oscuro.' },
  { id: 'INC-007', title: 'Caja registradora Concesión — descuadre', category: 'Operativo', priority: 'medium', status: 'resolved', room: 'Concesión', reported_by: 'taquilla3', assigned_to: 'supervisor1', created_at: '2024-04-26 22:00', updated_at: '2024-04-27 08:30', description: 'Descuadre de €45 en cierre de caja. Revisado y corregido.' },
];

export const USERS = [
  { id: 1, name: 'Administrador Sistema', username: 'admin1', email: 'admin@lumen.es', role: 'admin', status: 'active', last_login: '2024-04-30 08:00', created_at: '2023-01-15' },
  { id: 2, name: 'Carlos Supervisor', username: 'supervisor1', email: 'csupervisor@lumen.es', role: 'supervisor', status: 'active', last_login: '2024-04-30 07:45', created_at: '2023-03-10' },
  { id: 3, name: 'Laura Operadora', username: 'operador1', email: 'loperador@lumen.es', role: 'operator', status: 'active', last_login: '2024-04-30 08:30', created_at: '2023-06-20' },
  { id: 4, name: 'Diego Operador', username: 'operador2', email: 'doperador@lumen.es', role: 'operator', status: 'active', last_login: '2024-04-29 22:15', created_at: '2023-08-05' },
  { id: 5, name: 'Ana Taquilla', username: 'taquilla1', email: 'ataquilla@lumen.es', role: 'ticket', status: 'active', last_login: '2024-04-30 09:00', created_at: '2023-09-12' },
  { id: 6, name: 'Marcos Taquilla', username: 'taquilla2', email: 'mtaquilla@lumen.es', role: 'ticket', status: 'active', last_login: '2024-04-30 09:05', created_at: '2024-01-08' },
  { id: 7, name: 'Raquel Taquilla', username: 'taquilla3', email: 'rtaquilla@lumen.es', role: 'ticket', status: 'inactive', last_login: '2024-04-20 18:00', created_at: '2023-11-14' },
  { id: 8, name: 'Roberto Mantenimiento', username: 'mantenimiento1', email: 'rmant@lumen.es', role: 'maintenance', status: 'active', last_login: '2024-04-30 07:00', created_at: '2023-02-28' },
  { id: 9, name: 'Nuria Mantenimiento', username: 'mantenimiento2', email: 'nmant@lumen.es', role: 'maintenance', status: 'active', last_login: '2024-04-29 23:00', created_at: '2023-07-01' },
  { id: 10, name: 'Pedro Auditor', username: 'auditor1', email: 'pauditor@lumen.es', role: 'readonly', status: 'active', last_login: '2024-04-25 11:30', created_at: '2024-02-15' },
];

export const EMPLOYEE_USERS = [
  { id: 101, name: 'María Gerencia',       email: 'gerencia@lumen.es',      role: 'GERENCIA',      status: 'active' },
  { id: 102, name: 'Javier Cajero',        email: 'cajero@lumen.es',        role: 'CAJERO',        status: 'active' },
  { id: 103, name: 'Carmen Limpieza',      email: 'limpieza@lumen.es',      role: 'LIMPIEZA',      status: 'active' },
  { id: 104, name: 'Roberto Mantenimiento', email: 'mantenimiento@lumen.es', role: 'MANTENIMIENTO', status: 'active' },
];

export const AUDIT_LOGS = [
  { id: 1, user: 'admin1', action: 'LOGIN', resource: 'Sistema', detail: 'Inicio de sesión exitoso', ip: '192.168.1.10', timestamp: '2024-04-30 08:00:12', severity: 'info' },
  { id: 2, user: 'supervisor1', action: 'LOGIN', resource: 'Sistema', detail: 'Inicio de sesión exitoso', ip: '192.168.1.15', timestamp: '2024-04-30 07:45:33', severity: 'info' },
  { id: 3, user: 'admin1', action: 'UPDATE', resource: 'Película #4', detail: 'Cambio de estado: upcoming → active', ip: '192.168.1.10', timestamp: '2024-04-30 08:05:44', severity: 'info' },
  { id: 4, user: 'operador1', action: 'CREATE', resource: 'Sesión #12', detail: 'Nueva sesión creada: Conclave, Sala 4, 01/05 20:00', ip: '192.168.1.22', timestamp: '2024-04-30 08:30:21', severity: 'info' },
  { id: 5, user: 'taquilla1', action: 'CREATE', resource: 'Reserva RES-2024-0011', detail: 'Nueva reserva: Laura Pérez, Sesión #1, 3 asientos', ip: '192.168.1.31', timestamp: '2024-04-30 12:00:05', severity: 'info' },
  { id: 6, user: 'supervisor1', action: 'UPDATE', resource: 'Incidencia INC-002', detail: 'Estado cambiado: open → in_progress, asignado a mantenimiento1', ip: '192.168.1.15', timestamp: '2024-04-30 09:00:18', severity: 'warning' },
  { id: 7, user: 'admin1', action: 'DELETE', resource: 'Reserva RES-2024-0006', detail: 'Reserva cancelada y eliminada: David Torres', ip: '192.168.1.10', timestamp: '2024-04-30 09:30:55', severity: 'warning' },
  { id: 8, user: 'taquilla2', action: 'LOGIN_FAIL', resource: 'Sistema', detail: 'Intento de acceso fallido — contraseña incorrecta', ip: '192.168.1.35', timestamp: '2024-04-29 11:28:00', severity: 'danger' },
  { id: 9, user: 'taquilla2', action: 'LOGIN', resource: 'Sistema', detail: 'Inicio de sesión exitoso tras reintento', ip: '192.168.1.35', timestamp: '2024-04-29 11:29:15', severity: 'info' },
  { id: 10, user: 'admin1', action: 'PERMISSION', resource: 'Usuario #7', detail: 'Estado de cuenta cambiado: active → inactive (taquilla3)', ip: '192.168.1.10', timestamp: '2024-04-28 16:00:00', severity: 'warning' },
  { id: 11, user: 'operador2', action: 'CREATE', resource: 'Incidencia INC-001', detail: 'Nueva incidencia reportada: proyector Sala 2', ip: '192.168.1.28', timestamp: '2024-04-30 07:30:44', severity: 'warning' },
  { id: 12, user: 'admin1', action: 'CONFIG', resource: 'Configuración sistema', detail: 'Cambio en límite de reservas por sesión: 10 → 15', ip: '192.168.1.10', timestamp: '2024-04-28 10:00:00', severity: 'warning' },
];

export const INVENTORY = [
  { id: 1, name: 'Bombilla proyector IMAX Christie', category: 'Técnico', quantity: 3, min_stock: 2, unit: 'ud', location: 'Almacén técnico A', supplier: 'Christie Digital', last_order: '2024-03-15', price_unit: 1200 },
  { id: 2, name: 'Bombilla proyector estándar Barco', category: 'Técnico', quantity: 8, min_stock: 4, unit: 'ud', location: 'Almacén técnico A', supplier: 'Barco', last_order: '2024-02-20', price_unit: 450 },
  { id: 3, name: 'Palomitas maíz — saco 10kg', category: 'Concesión', quantity: 45, min_stock: 20, unit: 'saco', location: 'Almacén concesión', supplier: 'Snack Dist. SL', last_order: '2024-04-25', price_unit: 18 },
  { id: 4, name: 'Vasos cartón L (500ml)', category: 'Concesión', quantity: 1200, min_stock: 500, unit: 'ud', location: 'Almacén concesión', supplier: 'PackPro', last_order: '2024-04-20', price_unit: 0.12 },
  { id: 5, name: 'Vasos cartón XL (750ml)', category: 'Concesión', quantity: 890, min_stock: 400, unit: 'ud', location: 'Almacén concesión', supplier: 'PackPro', last_order: '2024-04-20', price_unit: 0.15 },
  { id: 6, name: 'Rollos papel TPV — 80mm', category: 'Oficina', quantity: 12, min_stock: 10, unit: 'rollo', location: 'Taquilla', supplier: 'Ofimática Sur', last_order: '2024-04-10', price_unit: 2.50 },
  { id: 7, name: 'Gafas 3D RealD', category: 'Técnico', quantity: 320, min_stock: 200, unit: 'ud', location: 'Almacén técnico B', supplier: 'RealD Inc.', last_order: '2024-01-30', price_unit: 8 },
  { id: 8, name: 'Aceite palomitero', category: 'Concesión', quantity: 6, min_stock: 8, unit: 'bidón 5L', location: 'Almacén concesión', supplier: 'Snack Dist. SL', last_order: '2024-04-18', price_unit: 22 },
  { id: 9, name: 'Bolsas palomitas M', category: 'Concesión', quantity: 2800, min_stock: 1000, unit: 'ud', location: 'Almacén concesión', supplier: 'PackPro', last_order: '2024-04-20', price_unit: 0.08 },
  { id: 10, name: 'Cable HDMI 2.1 — 5m', category: 'Técnico', quantity: 4, min_stock: 3, unit: 'ud', location: 'Almacén técnico A', supplier: 'ElectroPro', last_order: '2024-03-01', price_unit: 35 },
  { id: 11, name: 'Tarjetas regalo Lumen €20', category: 'Comercial', quantity: 150, min_stock: 50, unit: 'ud', location: 'Taquilla', supplier: 'Interno', last_order: '2024-04-01', price_unit: 0.50 },
  { id: 12, name: 'Ambientador salas — spray 500ml', category: 'Limpieza', quantity: 18, min_stock: 10, unit: 'ud', location: 'Almacén limpieza', supplier: 'CleanService', last_order: '2024-04-22', price_unit: 6.80 },
];

export const SALES_WEEK = [
  { day: 'Lun', revenue: 3240, tickets: 218 },
  { day: 'Mar', revenue: 2890, tickets: 196 },
  { day: 'Mié', revenue: 4120, tickets: 278 },
  { day: 'Jue', revenue: 3780, tickets: 255 },
  { day: 'Vie', revenue: 6540, tickets: 421 },
  { day: 'Sáb', revenue: 8920, tickets: 589 },
  { day: 'Dom', revenue: 7450, tickets: 492 },
];

export const OCCUPANCY_BY_ROOM = [
  { room: 'Sala 1', pct: 86 },
  { room: 'Sala 2', pct: 82 },
  { room: 'Sala 3', pct: 73 },
  { room: 'Sala 4', pct: 85 },
  { room: 'Sala 5', pct: 0 },
  { room: 'Sala 6', pct: 100 },
];

export const EMPLOYEES = [
  { id: 1,  name: 'Ana García',      email: 'ana@lumen.es',       role: 'CASHIER',    createdAt: '2024-01-15T08:00:00' },
  { id: 2,  name: 'Carlos López',    email: 'carlos@lumen.es',    role: 'CASHIER',    createdAt: '2024-01-20T08:00:00' },
  { id: 3,  name: 'María Rodríguez', email: 'maria@lumen.es',     role: 'MANAGEMENT', createdAt: '2023-11-01T08:00:00' },
  { id: 4,  name: 'David Martínez',  email: 'david@lumen.es',     role: 'MANAGEMENT', createdAt: '2023-12-10T08:00:00' },
  { id: 5,  name: 'Laura Sánchez',   email: 'laura@lumen.es',     role: 'SECURITY',   createdAt: '2024-02-05T08:00:00' },
  { id: 6,  name: 'Pedro Gómez',     email: 'pedro@lumen.es',     role: 'SECURITY',   createdAt: '2024-02-15T08:00:00' },
  { id: 7,  name: 'Elena Díaz',      email: 'elena@lumen.es',     role: 'CLEANING',   createdAt: '2024-03-01T08:00:00' },
  { id: 8,  name: 'Javier Ruiz',     email: 'javier@lumen.es',    role: 'CLEANING',   createdAt: '2024-03-10T08:00:00' },
];

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

const NOW = new Date();
const WEEK_START = getWeekStart(NOW);
let shiftId = 1;

function generateShiftsForDate(empId, empName, empRole, date, shiftType) {
  const times = {
    M: { start: '08:00', end: '16:00' },
    T: { start: '14:00', end: '22:00' },
    N: { start: '18:00', end: '02:00' },
  };
  const t = times[shiftType];
  if (!t || shiftType === 'L') return null;
  return {
    id: shiftId++,
    employeeId: empId,
    employeeName: empName,
    employeeEmail: `${empName.toLowerCase().replace(/\s/g, '.')}@lumen.es`,
    employeeRole: empRole,
    shiftDate: fmtDate(date),
    startTime: t.start,
    endTime: t.end,
    notes: null,
    status: 'SCHEDULED',
    createdAt: fmtDate(NOW) + 'T10:00:00',
  };
}

const SCHEDULE_TEMPLATE = {
  'Ana García':      ['M', 'M', 'T', 'T', 'L', 'M', 'L'],
  'Carlos López':    ['T', 'T', 'L', 'M', 'M', 'L', 'T'],
  'María Rodríguez': ['M', 'M', 'M', 'M', 'L', 'M', 'L'],
  'David Martínez':  ['M', 'L', 'M', 'M', 'T', 'L', 'M'],
  'Laura Sánchez':   ['N', 'N', 'L', 'M', 'T', 'L', 'N'],
  'Pedro Gómez':     ['M', 'T', 'N', 'L', 'M', 'T', 'M'],
  'Elena Díaz':      ['M', 'L', 'N', 'N', 'M', 'M', 'L'],
  'Javier Ruiz':     ['N', 'M', 'M', 'L', 'N', 'N', 'L'],
};

export const SHIFTS = (() => {
  const result = [];
  EMPLOYEES.forEach(emp => {
    const days = SCHEDULE_TEMPLATE[emp.name] || ['M', 'T', 'M', 'T', 'L', 'M', 'L'];
    days.forEach((shiftType, i) => {
      const date = addDays(WEEK_START, i);
      const shift = generateShiftsForDate(emp.id, emp.name, emp.role, date, shiftType);
      if (shift) result.push(shift);
    });
  });
  return result;
})();

export const ROLES = {
  admin: { label: 'Administrador', color: 'red', permissions: ['*'] },
  supervisor: { label: 'Supervisor', color: 'purple', permissions: ['read', 'create', 'update', 'approve'] },
  operator: { label: 'Operador', color: 'accent', permissions: ['read', 'create', 'update'] },
  ticket: { label: 'Taquilla', color: 'cyan', permissions: ['read', 'create_reservation'] },
  maintenance: { label: 'Mantenimiento', color: 'yellow', permissions: ['read', 'create_incident', 'update_incident'] },
  readonly: { label: 'Consulta', color: 'green', permissions: ['read'] },
};
