<p align="center">
  <img src="./src/assets/logoLumen.png" alt="Lumen Cinema Logo" width="180"/>
</p>

<h1 align="center">Lumen Cinema — Frontend</h1>

<p align="center">
  <strong>Backoffice intranet para la gestión integral de un cine moderno</strong><br/>
  React + Vite · Spring Boot backend · JWT · CSS Modules
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/React_Router-7.x-CA4245?logo=reactrouter&logoColor=white"/>
  <img src="https://img.shields.io/badge/Recharts-3.x-22C55E"/>
  <img src="https://img.shields.io/badge/Stripe-Enabled-635BFF?logo=stripe&logoColor=white"/>
  <img src="https://img.shields.io/badge/i18n-ES%20%7C%20EN-orange"/>
  <img src="https://img.shields.io/badge/Status-En%20Desarrollo-yellow"/>
</p>

---

## Tabla de contenidos

- [Características principales](#características-principales)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y arranque](#instalación-y-arranque)
- [Variables de entorno](#variables-de-entorno)
- [Conexión con el backend](#conexión-con-el-backend)
- [Roles y acceso](#roles-y-acceso)
- [Rutas del sistema](#rutas-del-sistema)
- [Módulos implementados](#módulos-implementados)
- [Internacionalización](#internacionalización)
- [Scripts disponibles](#scripts-disponibles)

---

## Características principales

### POS — Taquilla (`/box-office`)
- Búsqueda y selección de sesiones activas
- Mapa interactivo de butacas con selección múltiple
- Tipos de entrada: adulto, estudiante, senior, infantil
- Búsqueda de clientes socios con identificación en tiempo real
- **Descuento de fidelidad automático**: −10 % en la compra número 11 (tras 10 compras anuales), para todos los tipos de entrada. El contador se resetea tras aplicar el descuento
- Pago con tarjeta, efectivo y cálculo de cambio
- Generación de tickets con código QR
- Integración Stripe para pagos con tarjeta

### POS — Caja / Concesiones (`/concession`)
- Grid de productos organizados por categorías (Comida, Bebida, Merchandising)
- Carrito dinámico con límite por stock disponible
- **Descuento de stock en tiempo real**: al confirmar una venta se descuenta el inventario usando el `remainingStock` devuelto por el backend
- **Sincronización automática con Inventario**: al completar una venta se dispara el evento `merchandise:updated` y la pantalla de inventario se actualiza al instante, sin recargar
- Impresión automática del ticket al cobrar (logo LUMEN CINEMA, sin emojis, en castellano)
- Aviso de stock bajo cuando un producto llega a su mínimo configurado
- Gestión completa de productos (CRUD) para GERENCIA y CAJERO
- Atajos de teclado: `F2` buscar · `F4` cobrar · `F5` nueva venta · `Esc` vaciar carrito
- Subida de imágenes a Cloudinary

### Dashboard (`/`)
- KPIs en tiempo real: ingresos, entradas vendidas, ocupación, incidencias activas
- Gráficos de tendencias de ingresos y ocupación por sala
- Top películas y productos más vendidos
- Alertas operativas automáticas
- Exportación de reportes en CSV

### Películas (`/movies`)
- CRUD completo con validación de formulario
- Subida de pósters a Cloudinary o por URL
- Campos: título, director, año, género, duración, idioma, **formato** (2D / 3D / IMAX / 4DX / IMAX 3D / 2D·3D), clasificación por edad, estado activo/inactivo
- Eliminación individual y en bloque
- Vista de detalle por película

### Salas (`/rooms`)
- Gestión de capacidad y estado de cada sala
- Visualización de ocupación

### Horarios (`/schedules`)
- Programación de sesiones por sala y película
- Vista de cuadrante semanal

### Reservas (`/reservations`)
- Estados: PENDING, PAID, CANCELLED
- Cancelación de reservas con actualización en tiempo real
- Código QR por reserva
- Solo carga reservas activas (PENDING + PAID), excluyendo canceladas

### Inventario (`/inventory`)
- Tabla de artículos con cantidad, stock mínimo, proveedor y precio/unidad
- Indicador de estado: OK / Stock bajo / Sin stock
- **Actualización en tiempo real** al recibir el evento `merchandise:updated` desde Caja
- CRUD de artículos
- Filtro por categoría

### Incidencias (`/incidents`)
- Registro con prioridad (crítica, alta, media, baja) y categoría
- Asignación a empleados de los roles: MANTENIMIENTO, LIMPIEZA, CAJERO, ADMIN, GERENCIA
- Cambio de estado: Abierta → En progreso → Resuelta
- KPIs: abiertas, en progreso, resueltas, críticas activas
- Filtro por estado

### Clientes (`/clients`)
- Lista de socios registrados (filtra usuarios guest/anónimos)
- Indicador de fidelidad: muestra si el cliente es socio y si tiene descuento disponible (≥ 10 visitas anuales)
- Detalle con visitas anuales (X/10) y banner de descuento activo

### Empleados (`/employees`)
- CRUD de empleados por rol
- Gestión de estados

### Turnos (`/shifts`)
- Calendario de turnos por empleado
- Vista semanal

### Reportes (`/reports`)
- Analytics avanzados: ventas, ocupación, rendimiento por película
- Exportación CSV

### Auditoría (`/audit`)
- Registro de acciones del sistema

### Devoluciones (`/refunds`)
- Gestión de devoluciones de entradas

---

## Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Framework | React 19 |
| Bundler | Vite 8 |
| Routing | React Router 7 |
| Estilos | CSS Modules (sin frameworks externos) |
| Iconos | Lucide React |
| Gráficos | Recharts |
| Pagos | Stripe |
| QR | qrcode.react |
| Imágenes | Cloudinary |
| Estado global | Context API (Auth, App, Language) |
| HTTP | Fetch nativo con cliente centralizado (`api.js`) |
| i18n | Sistema propio con `useLanguage` |
| Tests | Vitest |
| Linter | ESLint |

---

## Estructura del proyecto

```
FrontCine/
├── public/
├── src/
│   ├── assets/              # Logo y recursos estáticos
│   ├── components/
│   │   ├── shared/          # PageHeader, DataTable, KPICard, Skeleton…
│   │   └── ui/              # Button, Modal, Badge, Input…
│   ├── contexts/
│   │   ├── AuthContext.jsx  # JWT, sesión, rol del usuario
│   │   ├── AppContext.jsx   # Toast notifications
│   │   └── LanguageContext.jsx
│   ├── i18n/                # Traducciones ES / EN
│   ├── layouts/             # Layout principal con sidebar y header
│   ├── pages/
│   │   ├── auth/            # Login
│   │   ├── dashboard/       # Dashboard con KPIs y gráficos
│   │   ├── pos/             # BoxOfficePage, ConcessionPage, RefundsPage
│   │   ├── movies/          # Gestión de películas
│   │   ├── rooms/           # Gestión de salas
│   │   ├── schedules/       # Programación de sesiones
│   │   ├── reservations/    # Reservas y QR
│   │   ├── clients/         # Socios y fidelización
│   │   ├── employees/       # Empleados y roles
│   │   ├── shifts/          # Turnos
│   │   ├── incidents/       # Incidencias operativas
│   │   ├── inventory/       # Stock y proveedores
│   │   ├── reports/         # Analytics
│   │   ├── users/           # Administración de usuarios
│   │   └── audit/           # Auditoría
│   ├── services/
│   │   ├── api.js           # Cliente HTTP centralizado con JWT
│   │   ├── authService.js
│   │   ├── moviesService.js
│   │   ├── salesService.js
│   │   ├── inventoryService.js
│   │   ├── clientsService.js
│   │   ├── incidentsService.js
│   │   ├── reservationsService.js
│   │   └── …
│   ├── App.jsx
│   └── main.jsx
├── .env
├── vite.config.js
└── package.json
```

---

## Instalación y arranque

**Requisitos:** Node.js ≥ 18 · npm ≥ 9

```bash
# Clonar el repositorio
git clone <repo-url>
cd FrontCine

# Instalar dependencias
npm install

# Arrancar en desarrollo
npm run dev
```

La app abre en `http://localhost:5173`. El backend debe estar corriendo en `http://localhost:8080`.

```bash
# Build de producción
npm run build

# Preview del build
npm run preview
```

---

## Variables de entorno

Crear un fichero `.env` en la raíz del proyecto:

```env
# Cloudinary — subida de imágenes (pósters y productos)
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset_unsigned
```

El proxy de Vite redirige automáticamente `/api/*` → `http://localhost:8080/api/*`, por lo que no es necesario configurar la URL del backend para desarrollo.

Para producción, añadir:
```env
VITE_API_URL=https://tu-backend.com/api
```

---

## Conexión con el backend

El cliente HTTP centralizado (`src/services/api.js`) añade automáticamente:
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (leído de `localStorage`)

Si cualquier endpoint devuelve `401`, el token se elimina y se redirige al login automáticamente.

### Endpoints principales consumidos

| Servicio | Endpoints |
|---|---|
| Auth | `POST /api/auth/login` · `POST /api/auth/employee-login` |
| Películas | `GET/POST /api/movies` · `PUT/DELETE /api/movies/:id` |
| Salas | `GET/POST /api/rooms` · `PUT/DELETE /api/rooms/:id` |
| Horarios | `GET/POST /api/schedules` |
| Reservas | `GET /api/reservations` · `POST /api/reservations/:id/cancel` |
| Compras | `POST /api/purchases` · `POST /api/purchases/:id/confirm` |
| Merchandise | `GET/POST /api/merchandise` · `PUT/DELETE /api/merchandise/:id` |
| Ventas caja | `POST /api/merchandisesales` (devuelve `remainingStock`) |
| Clientes | `GET /api/clients?member=true` · `GET /api/clients/:id` |
| Empleados | `GET/POST /api/employees` |
| Incidencias | `GET/POST /api/incidents` · `PUT/DELETE /api/incidents/:id` |
| Turnos | `GET /api/shifts` |
| Dashboard | `GET /api/dashboard` |
| Reportes | `GET /api/reports/*` |

---

## Roles y acceso

| Rol | Descripción |
|---|---|
| `GERENCIA` | Acceso completo a todos los módulos |
| `ADMIN` | Acceso completo, gestión de usuarios |
| `CAJERO` | Taquilla, caja, incidencias |
| `MANTENIMIENTO` | Incidencias |
| `LIMPIEZA` | Incidencias |
| `CLIENTE` | Portal cliente (reservas) |

La protección de rutas se gestiona en el router según el rol del JWT.

---

## Rutas del sistema

| Ruta | Módulo |
|---|---|
| `/login` | Autenticación |
| `/` | Dashboard |
| `/box-office` | POS Taquilla |
| `/concession` | POS Caja / Concesiones |
| `/refunds` | Devoluciones |
| `/movies` | Películas |
| `/rooms` | Salas |
| `/schedules` | Horarios |
| `/reservations` | Reservas |
| `/clients` | Clientes / Socios |
| `/employees` | Empleados |
| `/shifts` | Turnos |
| `/incidents` | Incidencias |
| `/inventory` | Inventario |
| `/reports` | Reportes |
| `/users` | Usuarios |
| `/audit` | Auditoría |

---

## Módulos implementados

### Sistema de fidelización
- El backend calcula `fidelityDiscountEligible = annualVisits >= 10`
- La taquilla aplica −10 % sobre **todos** los tipos de entrada en la compra 11
- El descuento se muestra en el carrito y en el toast de confirmación (`discountApplied` + `discountAmount`)
- El contador se resetea tras aplicar el descuento

### Stock en tiempo real
- Al completar una venta en Caja, el frontend actualiza el stock local usando el `remainingStock` exacto que devuelve el backend
- Se dispara el evento `merchandise:updated` que hace que la pantalla de Inventario recargue los datos del backend automáticamente, sin necesidad de navegar o recargar la página

### Impresión de tickets
- En Concesiones, el ticket se imprime automáticamente al cobrar (600 ms de delay para asegurar que el modal está renderizado)
- El ticket impreso incluye cabecera LUMEN CINEMA, fecha, hora, lista de productos y total
- En pantalla los emojis son visibles; en la impresión se ocultan (`@media print`)

---

## Internacionalización

```js
const { t } = useLanguage();

t('movies.col.format')   // → "Formato" / "Format"
t('common.save')         // → "Guardar" / "Save"
```

- Idiomas: Español / Inglés
- Detección y persistencia automática en `localStorage`
- Formateo de fechas, moneda y números con `Intl` API

---

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo con HMR
npm run build     # Build de producción
npm run preview   # Preview del build generado
npm run lint      # ESLint
npm run test      # Tests con Vitest
```

---

<p align="center">
  Desarrollado por el equipo Lumen Cinema · Proyecto Final DAW
</p>
