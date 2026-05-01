# Lumen Cinema — Frontend (Backoffice Intranet)

Aplicación React interna para la gestión operativa del cine Lumen. Incluye POS de taquilla y concesión, cuadrante de turnos, gestión de películas, salas, horarios, reservas, incidencias, inventario, informes, usuarios y auditoría.

---

## Stack técnico

| Herramienta | Versión |
|---|---|
| React | 19.x |
| Vite | 8.x |
| React Router DOM | 7.x |
| recharts | 3.x |
| lucide-react | 1.x |
| qrcode.react | 4.x |
| CSS Modules | — |

---

## Arrancar en local

```bash
cd FrontCine
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ listo para producción
npm run preview    # sirve el build en local
```

---

## Variables de entorno

Crear `.env` en la raíz de `FrontCine/`:

```env
VITE_API_URL=http://localhost:8080/api
VITE_API_TIMEOUT=10000
```

> En producción crear `.env.production` con la URL real.

---

## Estructura del proyecto

```
FrontCine/
├── public/
├── src/
│   ├── assets/
│   │   └── logoLumen.png
│   ├── components/
│   │   ├── shared/
│   │   │   ├── DataTable.jsx       # Tabla (sort, search, paginación cliente)
│   │   │   ├── KPICard.jsx         # Tarjeta de métrica
│   │   │   ├── SeatMap.jsx         # Mapa de butacas interactivo
│   │   │   └── PageHeader.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Badge.jsx
│   │       └── Modal.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx         # ← Login, rol, permisos
│   │   └── AppContext.jsx          # Estado UI (sidebar, toasts)
│   ├── data/
│   │   └── mockData.js             # ← SUSTITUIR POR LLAMADAS API
│   ├── services/                   # ← CREADOS PARA LA INTEGRACIÓN
│   │   ├── api.js                  # Cliente HTTP base (fetch + auth header)
│   │   ├── authService.js
│   │   ├── moviesService.js
│   │   ├── roomsService.js
│   │   ├── sessionsService.js
│   │   ├── reservationsService.js
│   │   ├── incidentsService.js
│   │   ├── inventoryService.js
│   │   ├── usersService.js
│   │   ├── auditService.js
│   │   ├── reportsService.js
│   │   └── salesService.js
│   ├── hooks/                      # ← CREADOS PARA LA INTEGRACIÓN
│   │   ├── useMovies.js
│   │   ├── useRooms.js
│   │   ├── useSessions.js
│   │   ├── useReservations.js
│   │   ├── useIncidents.js
│   │   ├── useInventory.js
│   │   ├── useUsers.js
│   │   ├── useAuditLogs.js
│   │   └── useReports.js
│   ├── layouts/
│   │   ├── MainLayout.jsx
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── movies/MoviesPage.jsx
│   │   ├── rooms/RoomsPage.jsx
│   │   ├── schedules/SchedulesPage.jsx
│   │   ├── reservations/ReservationsPage.jsx
│   │   ├── incidents/IncidentsPage.jsx
│   │   ├── reports/ReportsPage.jsx
│   │   ├── inventory/InventoryPage.jsx
│   │   ├── users/UsersPage.jsx
│   │   ├── audit/AuditPage.jsx
│   │   ├── cuadrante/CuadrantePage.jsx
│   │   └── pos/
│   │       ├── TaquillaPage.jsx
│   │       └── CajaPage.jsx
│   ├── App.jsx
│   └── index.css                   # Design system (variables CSS)
```

---

## Rutas

| Ruta | Página |
|---|---|
| `/login` | Login |
| `/` | Dashboard |
| `/taquilla` | POS Taquilla |
| `/caja` | POS Concesión |
| `/peliculas` | Películas |
| `/salas` | Salas |
| `/horarios` | Sesiones/Horarios |
| `/reservas` | Reservas |
| `/incidencias` | Incidencias |
| `/inventario` | Inventario |
| `/informes` | Informes |
| `/cuadrante` | Cuadrante de turnos |
| `/usuarios` | Usuarios (solo admin) |
| `/auditoria` | Auditoría (solo admin) |

---

## Roles y permisos

`role` debe ser uno de: `admin | supervisor | operator | ticket | maintenance | readonly`

```js
// AuthContext — can(action) devuelve true/false
can('read')               // todos excepto sin sesión
can('create')             // admin, supervisor, operator
can('update')             // admin, supervisor, operator
can('approve')            // admin, supervisor
can('create_reservation') // ticket
can('create_incident')    // maintenance
```

---

## Cuentas de demo (mock actual)

| Username | Rol | Password |
|---|---|---|
| `admin1` | Administrador | `lumen2024` |
| `supervisor1` | Supervisor | `lumen2024` |
| `operador1` | Operador | `lumen2024` |
| `taquilla1` | Taquilla | `lumen2024` |
| `mantenimiento1` | Mantenimiento | `lumen2024` |
| `auditor1` | Consulta | `lumen2024` |

---

---

# Guía de integración Backend

## CORS — configuración requerida en el servidor

El servidor debe responder con estas cabeceras en **todos** los endpoints (incluido `OPTIONS`):

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

Para producción, cambiar el origen al dominio real del frontend.

Si el backend es **Spring Boot**:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:5173")
            .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```

Si el backend es **Node/Express**:

```js
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));
```

---

## Cliente HTTP base — `src/services/api.js`

Ya creado en el proyecto. Añade el token JWT a todas las peticiones y centraliza el manejo de errores:

```js
// src/services/api.js
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('lumen_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('lumen_token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get:    (path)         => request(path),
  post:   (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)   => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)         => request(path, { method: 'DELETE' }),
};
```

---

## Autenticación — `src/services/authService.js`

```js
import { api } from './api';

export const authService = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  // Respuesta esperada: { user: {...}, token: string }

  logout: () =>
    api.post('/auth/logout', {}),

  me: () =>
    api.get('/auth/me'),
  // Para restaurar sesión desde token guardado
};
```

**Integrar en `AuthContext.jsx`** — reemplazar la función `login`:

```js
import { authService } from '../services/authService';

const login = async (username, password) => {
  try {
    const { user, token } = await authService.login(username, password);
    localStorage.setItem('lumen_token', token);
    setUser(user);
    return true;
  } catch {
    setError('Credenciales inválidas o cuenta desactivada.');
    return false;
  }
};
```

**Forma del objeto `user`:**

```json
{
  "id": 1,
  "name": "Administrador Sistema",
  "username": "admin1",
  "email": "admin@lumen.es",
  "role": "admin",
  "status": "active"
}
```

---

## Servicios por módulo

### `src/services/moviesService.js`

```js
import { api } from './api';
export const moviesService = {
  getAll:  ()           => api.get('/movies'),
  create:  (data)       => api.post('/movies', data),
  update:  (id, data)   => api.put(`/movies/${id}`, data),
  remove:  (id)         => api.delete(`/movies/${id}`),
};
```

**Endpoint:** `GET /api/movies` → `Movie[]`

```json
{
  "id": 1, "title": "Dune: Parte Dos", "duration": 166,
  "genre": "Ciencia ficción", "language": "ES", "format": "IMAX",
  "rating": "PG-13", "status": "active", "director": "Denis Villeneuve",
  "year": 2024, "poster": null
}
```

`status`: `active | upcoming | inactive`

---

### `src/services/roomsService.js`

```js
import { api } from './api';
export const roomsService = {
  getAll:  ()           => api.get('/rooms'),
  create:  (data)       => api.post('/rooms', data),
  update:  (id, data)   => api.put(`/rooms/${id}`, data),
  remove:  (id)         => api.delete(`/rooms/${id}`),
};
```

**Endpoint:** `GET /api/rooms` → `Room[]`

```json
{
  "id": 1, "name": "Sala 1 — IMAX", "capacity": 280,
  "format": "IMAX", "status": "active", "screen": "Pantalla curva 28m",
  "audio": "Dolby Atmos", "seats_available": 280,
  "last_maintenance": "2024-04-10"
}
```

`status`: `active | maintenance | inactive`

---

### `src/services/sessionsService.js`

```js
import { api } from './api';
export const sessionsService = {
  getAll:       (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/sessions${q ? '?' + q : ''}`);
  },
  create:  (data)       => api.post('/sessions', data),
  update:  (id, data)   => api.put(`/sessions/${id}`, data),
  remove:  (id)         => api.delete(`/sessions/${id}`),
};
```

**Endpoint:** `GET /api/sessions` → `Session[]`

```json
{
  "id": 1, "movie_id": 1, "room_id": 1,
  "date": "2024-04-30", "time": "16:00", "end_time": "18:46",
  "capacity": 280, "sold": 241,
  "status": "active", "price": 18.50
}
```

`status`: `active | full | scheduled | cancelled`

> **Clave para TaquillaPage:** el frontend usa `session.sold` + `room.capacity` para el mapa de butacas. Mantener `sold` actualizado en tiempo real es importante para la ocupación.

---

### `src/services/reservationsService.js`

```js
import { api } from './api';
export const reservationsService = {
  getAll:  ()           => api.get('/reservations'),
  create:  (data)       => api.post('/reservations', data),
  update:  (id, data)   => api.put(`/reservations/${id}`, data),
  remove:  (id)         => api.delete(`/reservations/${id}`),
};
```

```json
{
  "id": "RES-2024-0001", "session_id": 1,
  "client": "María García", "email": "mgarcia@email.com",
  "seats": ["A12", "A13"], "amount": 37.00,
  "payment": "card", "status": "confirmed",
  "created_at": "2024-04-28T10:23:00Z"
}
```

`payment`: `card | cash | online` · `status`: `confirmed | pending | cancelled | refunded`

---

### `src/services/incidentsService.js`

```js
import { api } from './api';
export const incidentsService = {
  getAll:  ()           => api.get('/incidents'),
  create:  (data)       => api.post('/incidents', data),
  update:  (id, data)   => api.put(`/incidents/${id}`, data),
  remove:  (id)         => api.delete(`/incidents/${id}`),
};
```

```json
{
  "id": "INC-001", "title": "Proyector Sala 2 — parpadeo",
  "category": "Técnico", "priority": "high", "status": "open",
  "room": "Sala 2 — 4DX", "reported_by": "operador2",
  "assigned_to": "mantenimiento1",
  "created_at": "2024-04-30T07:30:00Z",
  "updated_at": "2024-04-30T08:15:00Z",
  "description": "El proyector 4DX presenta parpadeo..."
}
```

`priority`: `low | medium | high | critical` · `status`: `open | in_progress | resolved`

---

### `src/services/inventoryService.js`

```js
import { api } from './api';
export const inventoryService = {
  getAll:  ()           => api.get('/inventory'),
  create:  (data)       => api.post('/inventory', data),
  update:  (id, data)   => api.put(`/inventory/${id}`, data),
  remove:  (id)         => api.delete(`/inventory/${id}`),
};
```

```json
{
  "id": 1, "name": "Bombilla proyector IMAX",
  "category": "Técnico", "quantity": 3, "min_stock": 2,
  "unit": "ud", "location": "Almacén técnico A",
  "supplier": "Christie Digital",
  "last_order": "2024-03-15", "price_unit": 1200.00
}
```

---

### `src/services/usersService.js`

```js
import { api } from './api';
export const usersService = {
  getAll:  ()           => api.get('/users'),
  create:  (data)       => api.post('/users', data),
  update:  (id, data)   => api.put(`/users/${id}`, data),
  remove:  (id)         => api.delete(`/users/${id}`),
};
```

```json
{
  "id": 1, "name": "Administrador Sistema",
  "username": "admin1", "email": "admin@lumen.es",
  "role": "admin", "status": "active",
  "last_login": "2024-04-30T08:00:00Z",
  "created_at": "2023-01-15"
}
```

---

### `src/services/auditService.js`

```js
import { api } from './api';
export const auditService = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/audit-logs${q ? '?' + q : ''}`);
  },
};
```

```json
{
  "id": 1, "user": "admin1", "action": "UPDATE",
  "resource": "Película #4",
  "detail": "Cambio de estado: upcoming → active",
  "ip": "192.168.1.10",
  "timestamp": "2024-04-30T08:05:44Z",
  "severity": "info"
}
```

`action`: `LOGIN | LOGIN_FAIL | CREATE | UPDATE | DELETE | PERMISSION | CONFIG`
`severity`: `info | warning | danger`

---

### `src/services/reportsService.js`

```js
import { api } from './api';
export const reportsService = {
  salesWeek:   () => api.get('/reports/sales-week'),
  occupancy:   () => api.get('/reports/occupancy'),
  kpis:        () => api.get('/reports/kpis'),
};
```

**`GET /api/reports/sales-week`**
```json
[{ "day": "Lun", "ventas": 4200, "entradas": 312 }, ...]
```

**`GET /api/reports/occupancy`**
```json
[{ "sala": "IMAX", "pct": 86 }, ...]
```

**`GET /api/reports/kpis`**
```json
{
  "revenue_today": 8420.50,
  "tickets_today": 624,
  "occupancy_avg": 74,
  "incidents_open": 3
}
```

---

### `src/services/salesService.js`

```js
import { api } from './api';
export const salesService = {
  createTicketSale:     (data) => api.post('/sales/tickets', data),
  createConcessionSale: (data) => api.post('/sales/concession', data),
};
```

**`POST /api/sales/tickets`**
```json
{
  "session_id": 1,
  "seats": ["A05", "A06"],
  "ticket_type": "adulto",
  "format_extra": "imax",
  "unit_price": 18.50,
  "surcharge": 5.00,
  "total": 47.00,
  "payment_method": "card",
  "cashier_id": 5
}
```

**`POST /api/sales/concession`**
```json
{
  "items": [{ "product_id": "p2", "name": "Palomitas M", "qty": 2, "unit_price": 4.50 }],
  "total": 9.00,
  "payment_method": "cash",
  "cash_given": 10.00,
  "change": 1.00,
  "cashier_id": 5
}
```

---

## Hooks de datos — `src/hooks/`

Patrón genérico. Todos los hooks siguen la misma estructura:

```js
// src/hooks/useMovies.js
import { useState, useEffect, useCallback } from 'react';
import { moviesService } from '../services/moviesService';
import { MOVIES } from '../data/mockData';   // ← eliminar al conectar API

const USE_MOCK = !import.meta.env.VITE_API_URL;

export function useMovies() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = USE_MOCK ? MOVIES : await moviesService.getAll();
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (movie) => {
    const created = USE_MOCK
      ? { ...movie, id: Date.now() }
      : await moviesService.create(movie);
    setData(prev => [...prev, created]);
    return created;
  };

  const update = async (id, changes) => {
    const updated = USE_MOCK
      ? { ...data.find(m => m.id === id), ...changes }
      : await moviesService.update(id, changes);
    setData(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  };

  const remove = async (id) => {
    if (!USE_MOCK) await moviesService.remove(id);
    setData(prev => prev.filter(m => m.id !== id));
  };

  return { data, loading, error, reload: load, create, update, remove };
}
```

El mismo patrón aplica a: `useRooms`, `useSessions`, `useReservations`, `useIncidents`, `useInventory`, `useUsers`, `useAuditLogs`, `useReports`.

**Cómo usar en una página:**

```jsx
// Antes (mock directo)
import { MOVIES } from '../../data/mockData';

// Después (con hook)
import { useMovies } from '../../hooks/useMovies';

export default function MoviesPage() {
  const { data: movies, loading, error, create, update, remove } = useMovies();
  if (loading) return <div>Cargando...</div>;
  if (error)   return <div>Error: {error}</div>;
  // ...
}
```

---

## Paginación servidor (opcional)

El `DataTable` actual pagina en cliente. Para paginar en servidor, el endpoint debe aceptar:

```
GET /api/movies?page=1&limit=20&search=dune&sort=title&order=asc
```

Y responder:

```json
{
  "data": [...],
  "total": 87,
  "page": 1,
  "limit": 20
}
```

---

## Mapa de sustitución (qué y dónde)

| Archivo mock | Páginas que lo consumen | Servicio sustituto |
|---|---|---|
| `MOVIES` | MoviesPage, TaquillaPage, Dashboard | `moviesService` |
| `ROOMS` | RoomsPage, TaquillaPage, SeatMap | `roomsService` |
| `SESSIONS` | SchedulesPage, TaquillaPage, ReservationsPage | `sessionsService` |
| `RESERVATIONS` | ReservationsPage | `reservationsService` |
| `INCIDENTS` | IncidentsPage | `incidentsService` |
| `INVENTORY` | InventoryPage | `inventoryService` |
| `USERS` | UsersPage, AuthContext, CuadrantePage | `usersService` |
| `AUDIT_LOGS` | AuditPage | `auditService` |
| `SALES_WEEK`, `OCCUPANCY_BY_ROOM` | ReportsPage, Dashboard | `reportsService` |
| `TICKET_TYPES` | TaquillaPage | Estático o `GET /api/ticket-types` |
| `CONCESSION_PRODUCTS` | CajaPage | Estático o `GET /api/products` |

---

## Orden de integración sugerido

1. **CORS** — sin esto nada llega al frontend desde otra origin.
2. **Auth** (`POST /auth/login`) — bloquea todo lo demás hasta que funcione.
3. **Películas + Salas + Sesiones** — base del módulo de Taquilla (el más crítico).
4. **Reservas** — depende de sesiones.
5. **Ventas** (`POST /sales/tickets`, `POST /sales/concession`) — cierre del flujo POS.
6. **Incidencias, Inventario, Usuarios, Auditoría** — en paralelo.
7. **Informes / KPIs** — últimos, necesitan agregados del lado servidor.
