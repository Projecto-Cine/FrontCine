<p align="center">
  <img src="./src/assets/logoLumen.png" alt="Lumen Cinema Logo" width="180"/>
</p>

<h1 align="center">🎬 Lumen Cinema</h1>

<p align="center">
  <strong>Backoffice Intranet para la gestión integral de un cine moderno</strong>
</p>

<p align="center">
  Sistema completo de operación cinematográfica desarrollado con React + Vite.<br/>
  Incluye POS, reservas, analytics, inventario, RRHH, accesibilidad, internacionalización, pagos Stripe, QR, y más.
</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/React_Router-7.x-CA4245?logo=reactrouter&logoColor=white"/>
  <img src="https://img.shields.io/badge/Recharts-3.x-22C55E"/>
  <img src="https://img.shields.io/badge/Stripe-Enabled-635BFF?logo=stripe&logoColor=white"/>
  <img src="https://img.shields.io/badge/i18n-ES%20%7C%20EN-orange"/>
  <img src="https://img.shields.io/badge/Accessibility-WCAG_AA-2EA043"/>
  <img src="https://img.shields.io/badge/Status-En%20Desarrollo-yellow"/>
</p>

---

# 📚 Tabla de contenidos

- [✨ Características principales](#-características-principales)
- [🧱 Stack tecnológico](#-stack-tecnológico)
- [🏗️ Arquitectura](#️-arquitectura)
- [📁 Estructura del proyecto](#-estructura-del-proyecto)
- [🚀 Instalación](#-instalación)
- [⚙️ Variables de entorno](#️-variables-de-entorno)
- [🔐 Autenticación y roles](#-autenticación-y-roles)
- [🧭 Rutas del sistema](#-rutas-del-sistema)
- [🌍 Internacionalización](#-internacionalización)
- [♿ Accesibilidad](#-accesibilidad)
- [⌨️ Atajos de teclado](#️-atajos-de-teclado)
- [🧪 Modo demo](#-modo-demo)
- [🔌 Integración backend](#-integración-backend)
- [📦 Scripts disponibles](#-scripts-disponibles)
- [🧠 Características destacadas](#-características-destacadas)

---

# ✨ Características principales

## 🏪 Punto de Venta (POS)

### 🎟️ Taquilla
- Selección de sesiones con filtro por fecha
- Mapa interactivo de butacas con distinción STANDARD / VIP
- Suplemento VIP (+1.00 € sobre el precio base)
- Gestión de tipos de entrada: CHILD, STUDENT, ADULT, SENIOR
- Búsqueda y registro rápido de clientes
- Pago con tarjeta (Stripe), efectivo y QR
- Generación y visualización de códigos QR por ticket
- Impresión de recibo
- Modal de pago Stripe con tema oscuro

### 🍿 Concesiones
- Grid de productos por categorías (Comida, Bebida, Merchandising)
- Carrito dinámico con gestión de cantidades
- Cálculo automático de cambio en efectivo
- CRUD completo de productos con carga de imagen
- Finalización de venta con tarjeta o efectivo

### 🔄 Devoluciones
- Procesamiento de devoluciones de entradas y merchandising
- Búsqueda por código QR
- Impresión de recibo de devolución

---

## 📊 Dashboard & Analytics

- KPIs animados en tiempo real (ingresos del día, tickets, ocupación, incidencias abiertas)
- Gráfico de ingresos semanales (barras)
- Gráfico de ocupación por sala (líneas)
- Gráfico de incidencias por categoría (tarta)
- Top películas en cartelera
- Proyecciones activas ahora
- Componente de tarjetas KPI con contador animado (`useCountUp`)
- Alertas operativas
- Exportación de reportes a CSV

---

## 🎞️ Gestión de contenido

| Módulo | Funcionalidades |
|---|---|
| 🎬 Películas | CRUD, posters Cloudinary, filtros, caché local de posters, formato y age rating |
| 🏛️ Salas | CRUD, tipos STANDARD / IMAX / 4DX / VIP / DOLBY / 3D, capacidad |
| 🕒 Horarios | Programación de sesiones con filtro por fecha, selector película/sala |
| 🎫 Reservas | Estados (PENDING / PAID / CONFIRMED / CANCELLED / REFUNDED), pagos, cancelaciones, QR |

---

## 🛠️ Gestión operativa

| Módulo | Funcionalidades |
|---|---|
| 🚨 Incidencias | CRUD, prioridades (critical / high / medium / low), estados, categorías, asignación, KPIs |
| 📦 Inventario | CRUD, categorías, alertas de stock mínimo y sin stock, pedidos a proveedores, seguimiento |
| 📈 Reportes | Analytics avanzados, gráficos interactivos Recharts |

---

## 👥 Recursos Humanos

| Módulo | Funcionalidades |
|---|---|
| 👨‍💼 Empleados | CRUD, roles, estado activo/inactivo |
| 📅 Turnos | Calendario semanal con bloques M/T/N, asignación drag de empleados, descarga como PNG, auto-guardado |
| 👤 Clientes | CRUD, búsqueda, registro rápido, insignias de estudiante y fidelidad, contador de visitas |

---

## 👑 Administración

| Módulo | Funcionalidades |
|---|---|
| 👥 Usuarios | CRUD completo, roles del sistema (ADMIN / SUPERVISOR / OPERATOR / TICKET / MAINTENANCE / READONLY / CLIENT) |
| 📋 Auditoría | Visor de logs con filtros por severidad, usuario y acción; iconos de severidad |
| 🔐 RBAC | Control de acceso basado en roles con 4 roles de empleado |

---

## 🌍 Internacionalización

- Español 🇪🇸 / Inglés 🇬🇧
- Detección automática del idioma del navegador
- Formateo Intl (fecha, hora, número, moneda)
- Traducciones dinámicas con resolvedor dot-path
- Persistencia en localStorage

---

## ♿ Accesibilidad

- Navegación completa por teclado
- Focus trap en modales
- ARIA labels y roles
- Widget flotante de accesibilidad:
  - Alto contraste
  - Escalado tipográfico (normal / large / xlarge)
  - Subrayado de enlaces
  - Text-to-speech
  - Tema oscuro / claro
- Skip to content
- Screen Reader API
- Persistencia de preferencias en localStorage

---

## ⌨️ Atajos de teclado

| Atajo | Acción |
|---|---|
| `Ctrl + K` | Abrir paleta de comandos (búsqueda difusa de páginas) |
| `Ctrl + B` | Colapsar/expandir sidebar |
| `Alt + 1-9` | Navegar a páginas por número |
| `?` | Abrir modal de atajos |
| `F2` | Editar registro seleccionado |
| `F4` | Recargar datos |
| `F5` | Refrescar página |

---

# 🧱 Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Frontend | React 19 |
| Bundler | Vite 8 |
| Routing | React Router 7 |
| Charts | Recharts 3 |
| Pagos | Stripe (@stripe/react-stripe-js, @stripe/stripe-js) |
| Iconos | Lucide React |
| QR | qrcode.react |
| Estilos | CSS Modules |
| Uploads | Cloudinary |
| Estado global | Context API (Auth, App, Language) |
| Testing | Vitest 4 |
| Linter | ESLint 10 |

---

# 🏗️ Arquitectura

## Flujo principal

```txt
BrowserRouter
 └── AuthProvider
      └── LanguageProvider
           └── AppProvider
                └── Routes (protegidas por RoleRoute)
                     ├── /login (pública)
                     └── MainLayout (autenticado)
                          ├── Sidebar (roles condicionales)
                          ├── Header (reloj, idioma, atajos)
                          ├── Outlet (página activa)
                          ├── StatusBar (online/offline)
                          ├── Toasts (notificaciones)
                          ├── CommandPalette (Ctrl+K)
                          └── AccessibilityWidget
```

## Arquitectura frontend

```txt
pages/
 ├── auth/        → Login
 ├── dashboard/   → Dashboard
 ├── pos/         → BoxOffice, Concession, Refunds
 ├── movies/      → MoviesPage
 ├── rooms/       → RoomsPage
 ├── schedules/   → SchedulesPage
 ├── reservations/→ ReservationsPage
 ├── incidents/   → IncidentsPage
 ├── reports/     → ReportsPage
 ├── inventory/   → InventoryPage
 ├── shifts/      → ShiftsPage
 ├── clients/     → ClientsPage
 ├── employees/   → EmployeesPage
 ├── users/       → UsersPage
 └── audit/       → AuditPage

components/
 ├── shared/      → DataTable, KPICard, SeatMap, Skeleton, Toasts, etc.
 ├── ui/          → Button, Badge, Modal, LanguageSwitcher
 └── accessibility/ → AccessibilityWidget

contexts/         → AuthContext, AppContext
i18n/             → LanguageContext, es.js, en.js
hooks/            → useCountUp, useMovies
services/         → api.js, authService, moviesService, etc. (23 servicios)
```

---

# 📁 Estructura del proyecto

```txt
FrontCine/
│
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── shared/
│   │   ├── ui/
│   │   └── accessibility/
│   ├── contexts/
│   ├── data/
│   ├── hooks/
│   ├── i18n/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── package.json
├── vite.config.js
└── README.md
```

---

# 🚀 Instalación

**Requisitos:**

- Node.js >= 18
- npm >= 9

---

## Clonar proyecto

```bash
git clone <repo-url>
cd FrontCine
```

## Instalar dependencias

```bash
npm install
```

## Ejecutar entorno desarrollo

```bash
npm run dev
```

## Abrir:

```bash
http://localhost:5173
```

## Build producción

```bash
npm run build
```

## Preview producción

```bash
npm run preview
```

---

# ⚙️ Variables de entorno

## Crear `.env`:

```env
VITE_API_URL=http://localhost:8080/api
VITE_API_TIMEOUT=10000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

# 🔐 Autenticación y roles

## Sistema de autenticación

- JWT Authentication
- Persistencia en localStorage (`lumen_token`, `lumen_user`)
- Restauración automática de sesión al recargar
- Logout automático por expiración o 401
- Detección de modo dev (limpia sesión al recargar en desarrollo)

## Roles de empleado disponibles

| Rol | Display | Acceso |
|---|---|---|
| `MANAGEMENT` | GERENCIA | Acceso completo a todas las rutas |
| `CASHIER` | CAJERO | POS (taquilla, concesiones), reservas |
| `CLEANING` | LIMPIEZA | Turnos |
| `MAINTENANCE` | MANTENIMIENTO | Incidencias, turnos |

- Redirección por defecto según rol: GERENCIA → `/`, CAJERO → `/box-office`, LIMPIEZA/MANTENIMIENTO → `/shifts`
- Componente `RoleRoute` que protege rutas según permisos del rol

## Usuarios demo

| Usuario | Password |
|---|---|
| gerencia@lumen.es | lumen2026 |
| cajero@lumen.es | lumen2026 |
| limpieza@lumen.es | lumen2026 |
| mantenimiento@lumen.es | lumen2026 |

---

# 🧭 Rutas del sistema

| Ruta | Página | Roles |
|---|---|---|
| `/` | Dashboard | Todos |
| `/box-office` | POS Taquilla | GERENCIA, CAJERO |
| `/concession` | POS Concesiones | GERENCIA, CAJERO |
| `/refunds` | Devoluciones | GERENCIA, CAJERO |
| `/movies` | Películas | GERENCIA |
| `/rooms` | Salas | GERENCIA |
| `/schedules` | Horarios | GERENCIA |
| `/reservations` | Reservas | GERENCIA, CAJERO |
| `/incidents` | Incidencias | GERENCIA, MANTENIMIENTO |
| `/reports` | Reportes | GERENCIA |
| `/inventory` | Inventario | GERENCIA |
| `/shifts` | Turnos | Todos |
| `/clients` | Clientes | GERENCIA |
| `/employees` | Empleados | GERENCIA |
| `/users` | Usuarios | GERENCIA |
| `/audit` | Auditoría | GERENCIA |

---

# 🌍 Internacionalización

```jsx
const { t, fmt } = useLanguage();

t('common.save');
fmt.currency(18.5);
fmt.date(new Date());
```

## Características

- Traducción ES/EN con ~500 líneas por idioma
- Intl API para formateo regional
- Persistencia automática en localStorage
- Detección del idioma del navegador

---

# ♿ Accesibilidad

Lumen Cinema sigue buenas prácticas modernas de accesibilidad:

- ✅ Navegación por teclado
- ✅ Compatibilidad con screen readers
- ✅ Focus management en modales
- ✅ Contraste accesible
- ✅ Preferencias persistentes
- ✅ ARIA labels
- ✅ Skip navigation
- ✅ **Widget de accesibilidad flotante:**
  - Alto contraste
  - Escalado tipográfico (3 niveles)
  - Text-to-speech
  - Temas claro/oscuro
  - Subrayado de enlaces

---

# ⌨️ Atajos de teclado

Pulsa `?` en cualquier pantalla para ver el modal completo de atajos.

| Atajo | Acción |
|---|---|
| `Ctrl + K` | Paleta de comandos (búsqueda difusa) |
| `Ctrl + B` | Alternar sidebar |
| `Alt + 1-9` | Navegación rápida a páginas |
| `F2` | Editar |
| `F4` | Recargar |
| `F5` | Refrescar |

---

# 🧪 Modo demo

El sistema funciona sin backend gracias a mock data y detección de conexión:

```txt
src/services/   → Fallback cuando el backend no responde
src/contexts/   → Estado offline
```

## Características del modo offline

- 📶 Indicador de estado de conexión en StatusBar
- 🎬 Películas con datos de ejemplo
- 🎫 Reservas de demostración
- 👥 Usuarios de muestra
- 🍿 Productos de concesión
- 📦 Inventario de prueba
- 📊 Analytics simulados
- 💰 Ventas de demostración

---

# 🔌 Integración backend

Preparado para backend Spring Boot en `http://localhost:8080/api`:

```txt
/api/auth
/api/movies
/api/theaters
/api/screenings
/api/purchases
/api/users
/api/seats
/api/employees
/api/shifts
/api/merchandise
/api/merchandisesales
/api/merchandise/sales
/api/incidents
/api/dashboard
/api/reports
/api/payments
/api/clients
```

## Características

- Cliente HTTP centralizado con timeout configurable
- Bearer Token automático desde AuthContext
- Manejo global de errores (401 → redirect a login)
- Hooks reutilizables (`useMovies`)
- 23 servicios desacoplados por módulo
- `backendModel.js` con mapeo de recursos de la API

---

# 📦 Scripts disponibles

```bash
npm run dev          # Entorno de desarrollo
npm run build        # Build producción
npm run preview      # Preview producción
npm run lint         # Linter ESLint
npm run test         # Tests unitarios (Vitest)
npm run test:watch   # Tests en modo watch
```

---

# 🧠 Características destacadas

- ✅ Arquitectura escalable con Context API
- ✅ POS completo (taquilla, concesiones, devoluciones)
- ✅ Mapa interactivo de butacas con VIP
- ✅ Dashboard analítico con KPIs animados
- ✅ Pagos con Stripe
- ✅ Generación de códigos QR
- ✅ Impresión de recibos
- ✅ Sistema de notificaciones toast
- ✅ Paleta de comandos (Ctrl+K)
- ✅ Widget de accesibilidad avanzado
- ✅ Internacionalización ES/EN
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Calendario de turnos drag & drop
- ✅ Gestión de inventario con alertas
- ✅ Sistema de fidelización de clientes
- ✅ Visor de logs de auditoría
- ✅ Detección online/offline
- ✅ Atajos de teclado globales
- ✅ Responsive Design
- ✅ Gestión integral de cine

---

# ❤️ Autor

<p align="center">
  Desarrollado con pasión para la gestión moderna de cines 🎬
</p>
