# Lumen Cinema — Documentación de API Backend

> Versión generada desde el frontend. Todos los endpoints, modelos y reglas de negocio que el frontend consume.

---

## Índice

1. [Configuración general](#1-configuración-general)
2. [Autenticación](#2-autenticación)
3. [Películas — `/movies`](#3-películas--movies)
4. [Salas — `/theaters`](#4-salas--theaters)
5. [Proyecciones — `/screenings`](#5-proyecciones--screenings)
6. [Asientos — `/seats`](#6-asientos--seats)
7. [Compras/Reservas — `/purchases`](#7-comprasreservas--purchases)
8. [Ventas de concesión — `/merchandise/sales`](#8-ventas-de-concesión--merchandisesales)
9. [Incidencias — `/incidents`](#9-incidencias--incidents)
10. [Usuarios — `/users`](#10-usuarios--users)
11. [Inventario/Mercancía — `/merchandise`](#11-inventariomercancía--merchandise)
12. [Informes — `/reports`](#12-informes--reports)
13. [Auditoría — `/audit-logs`](#13-auditoría--audit-logs)
14. [Roles y permisos](#14-roles-y-permisos)
15. [Códigos de error estándar](#15-códigos-de-error-estándar)

---

## 1. Configuración general

### Base URL
```
http://localhost:8080/api
```
Configurable en el frontend mediante la variable de entorno `VITE_API_URL`.

### Headers requeridos en todas las peticiones autenticadas
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Formato de respuesta esperado por el frontend

El frontend acepta cualquiera de estos tres formatos de envelope (unwrap automático):

```json
{ "content": { ... } }
{ "data": { ... } }
{ "payload": { ... } }
```

O directamente el objeto/array sin envelope:
```json
{ ... }
[ ... ]
```

### Comportamiento esperado por código de estado

| Código | Comportamiento en frontend |
|--------|---------------------------|
| `200` | Procesa respuesta normalmente |
| `201` | Procesa respuesta normalmente (creación) |
| `204` | Retorna `null` (no content) |
| `401` | Redirige automáticamente a `/login` y limpia token |
| `4xx/5xx` | Muestra mensaje de error en toast |

---

## 2. Autenticación

### `POST /auth/login`

**Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response `200`:**
```json
{
  "user": {
    "id": "number",
    "name": "string",
    "username": "string",
    "email": "string",
    "role": "ADMIN | SUPERVISOR | OPERATOR | TICKET | MAINTENANCE | READONLY",
    "status": "active | inactive"
  },
  "token": "string"
}
```

> El token se almacena en `localStorage` como `lumen_token` y se envía en cada petición como `Authorization: Bearer <token>`.

> Si `status === "inactive"`, el frontend rechaza el login aunque las credenciales sean correctas. El backend debe permitir que esto sea manejado en cliente, pero también puede devolver `403`.

---

### `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Body:** vacío

**Response `200` o `204`**

---

### `GET /auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "user": {
    "id": "number",
    "name": "string",
    "username": "string",
    "email": "string",
    "role": "string",
    "status": "string"
  }
}
```

---

## 3. Películas — `/movies`

### Modelo completo

```json
{
  "id": "number",
  "title": "string",               // Requerido
  "director": "string",
  "year": "number",
  "genre": "string",               // Ver valores permitidos
  "durationMin": "number",         // Requerido. Duración en minutos
  "language": "ES | VO | VOSE",
  "format": "IMAX | 4DX | 3D | 2D | IMAX 3D | 2D/3D",
  "ageRating": "G | PG | PG-13 | R | NC-17",
  "active": "boolean",             // true = en cartelera, false = baja
  "imageUrl": "string | null",     // URL a imagen del poster
  "description": "string | null"
}
```

**Géneros permitidos:** `Acción`, `Aventura`, `Animación`, `Ciencia Ficción`, `Comedia`, `Drama`, `Fantasia`, `Horror`, `Romance`, `Suspense`, `Thriller`, `Western`

---

### `GET /movies`

**Response `200`:** array de películas
```json
[
  {
    "id": 1,
    "title": "Dune: Parte II",
    "director": "Denis Villeneuve",
    "year": 2024,
    "genre": "Ciencia Ficción",
    "durationMin": 166,
    "language": "VOSE",
    "format": "IMAX",
    "ageRating": "PG-13",
    "active": true,
    "imageUrl": "https://...",
    "description": "..."
  }
]
```

---

### `GET /movies/:id`

**Response `200`:** objeto película (mismo schema)

---

### `POST /movies`

**Body:** objeto película sin `id`

**Response `201`:** objeto película creado con `id`

---

### `POST /movies` (con FormData para imagen)

**Content-Type:** `multipart/form-data`

**Body FormData:**
```
title: string
director: string
year: number
genre: string
durationMin: number
language: string
format: string
ageRating: string
active: boolean
description: string
image: File
```

**Response `201`:** objeto película con `imageUrl` relleno

---

### `POST /movies/:id/image`

Subida de imagen para película ya existente.

**Content-Type:** `multipart/form-data`

**Body FormData:**
```
image: File
```

**Response `200`:**
```json
{
  "imageUrl": "https://..."
}
```

---

### `PUT /movies/:id`

**Body:** objeto película completo (o parcial con los campos a actualizar)

**Response `200`:** objeto película actualizado

---

### `DELETE /movies/:id`

**Response `204`**

---

## 4. Salas — `/theaters`

> El frontend tenía antes el concepto `rooms`, ahora mapea a `/theaters`.

### Modelo completo

```json
{
  "id": "number",
  "name": "string",        // Requerido. Ej: "Sala IMAX", "Sala 4DX"
  "capacity": "number",    // Requerido. Número total de butacas
  "status": "active | maintenance | inactive"
}
```

---

### `GET /theaters`

**Response `200`:** array de salas

---

### `GET /theaters/:id`

**Response `200`:** objeto sala

---

### `POST /theaters`

**Body:**
```json
{
  "name": "string",
  "capacity": "number",
  "status": "active"
}
```

**Response `201`:** objeto sala creado con `id`

---

### `PUT /theaters/:id`

**Body:** objeto sala

**Response `200`:** objeto sala actualizado

---

### `DELETE /theaters/:id`

**Response `204`**

---

## 5. Proyecciones — `/screenings`

> El frontend tenía antes el concepto `sessions`, ahora mapea a `/screenings`.

### Modelo completo

```json
{
  "id": "number",
  "dateTime": "string",       // ISO 8601. Ej: "2024-04-30T16:00:00"
  "price": "number",          // Precio base de la entrada
  "status": "SCHEDULED | ACTIVE | CANCELLED | FULL",
  "movie": {                  // Objeto película embebido (o solo id)
    "id": "number",
    "title": "string",
    "durationMin": "number",
    "format": "string",
    "language": "string",
    "ageRating": "string",
    "imageUrl": "string"
  },
  "theater": {                // Objeto sala embebido (o solo id)
    "id": "number",
    "name": "string",
    "capacity": "number"
  }
}
```

> El frontend espera que `movie` y `theater` vengan como **objetos embebidos** (con al menos `id` y `name`/`title`). Si vienen solo como IDs, el frontend fallará al intentar mostrar `screening.movie.title`.

---

### `GET /screenings`

**Query params opcionales:**
```
date=YYYY-MM-DD         // Filtrar por fecha
movieId=number          // Filtrar por película
theaterId=number        // Filtrar por sala
status=SCHEDULED|ACTIVE|CANCELLED|FULL
```

**Response `200`:** array de proyecciones con movie y theater embebidos

---

### `GET /screenings/:id`

**Response `200`:** objeto proyección

---

### `POST /screenings`

**Body:**
```json
{
  "movieId": "number",
  "theaterId": "number",
  "dateTime": "2024-04-30T16:00:00",
  "price": 13.50,
  "status": "SCHEDULED"
}
```

**Response `201`:** objeto proyección creado (con movie y theater embebidos)

---

### `PUT /screenings/:id`

**Body:** mismo schema que POST

**Response `200`:** objeto proyección actualizado

---

### `DELETE /screenings/:id`

**Response `204`**

---

## 6. Asientos — `/seats`

### Modelo completo

```json
{
  "id": "number",
  "row": "string",           // Fila. Ej: "A", "B", "C"
  "number": "number",        // Número de butaca
  "type": "standard | premium | vip | disabled",
  "status": "available | occupied | reserved | broken",
  "screeningId": "number"    // A qué proyección pertenece
}
```

---

### `GET /screenings/:screeningId/seats`

Endpoint principal que usa el frontend en la pantalla de taquilla para mostrar el mapa de asientos.

**Response `200`:** array de asientos de esa proyección
```json
[
  {
    "id": 1,
    "row": "A",
    "number": 1,
    "type": "standard",
    "status": "available"
  },
  {
    "id": 2,
    "row": "A",
    "number": 2,
    "type": "standard",
    "status": "occupied"
  }
]
```

---

### `GET /seats`

**Query params opcionales:**
```
screeningId=number
status=available|occupied|reserved|broken
```

**Response `200`:** array de asientos

---

### `GET /seats/:id`

**Response `200`:** objeto asiento

---

### `POST /seats`

**Body:**
```json
{
  "row": "string",
  "number": "number",
  "type": "standard",
  "status": "available",
  "screeningId": "number"
}
```

**Response `201`:** objeto asiento creado

---

### `PUT /seats/:id`

**Body:** objeto asiento (útil para marcar como ocupado tras una venta)

**Response `200`:** objeto asiento actualizado

---

### `DELETE /seats/:id`

**Response `204`**

---

## 7. Compras/Reservas — `/purchases`

> El frontend tenía antes el concepto `reservations`, ahora mapea a `/purchases`.

### Modelo completo

```json
{
  "id": "number",
  "status": "CONFIRMED | PENDING | CANCELLED | REFUNDED",
  "paymentMethod": "CARD | CASH | ONLINE",
  "total": "number",
  "createdAt": "string",         // ISO 8601
  "screening": {                  // Objeto embebido
    "id": "number",
    "dateTime": "string",
    "movie": { "id": "number", "title": "string" },
    "theater": { "id": "number", "name": "string" }
  },
  "user": {                       // Objeto embebido (puede ser null si es venta anónima en taquilla)
    "id": "number",
    "name": "string",
    "email": "string"
  },
  "seats": [                      // Array de asientos reservados
    { "id": "number", "row": "string", "number": "number" }
  ]
}
```

---

### Venta desde Taquilla — `POST /purchases`

Este endpoint es el que llama la taquilla al finalizar una venta. El frontend envía:

```json
{
  "session_id": "number",           // ID de la proyección (screeningId)
  "seats": ["A1", "A2"],           // Array de identificadores de asiento (fila+número)
  "ticket_type": "adulto",         // Tipo de entrada seleccionado
  "format_extra": "imax",          // Suplemento de formato (puede ser null)
  "unit_price": 13.50,             // Precio unitario base
  "surcharge": 5.00,               // Suplemento (0 si no aplica)
  "total": 37.00,                  // Total de la compra
  "payment_method": "CARD",        // Método de pago
  "cashier_id": "number"           // ID del empleado que realiza la venta
}
```

**Response `201`:**
```json
{
  "sale_id": "number",
  "qr_codes": [
    "LUMEN:TKT-1234567890-abc:A1:SES42:2024-04-30:16:00",
    "LUMEN:TKT-1234567890-def:A2:SES42:2024-04-30:16:00"
  ]
}
```

> Los QR son strings que el frontend renderiza con `qrcode.react`. El formato es:
> `LUMEN:{ticketId}:{seat}:SES{sessionId}:{date}:{time}`

---

### `GET /purchases`

**Query params opcionales:**
```
screeningId=number
status=CONFIRMED|PENDING|CANCELLED|REFUNDED
```

**Response `200`:** array de compras con relaciones embebidas

---

### `GET /purchases/:id`

**Response `200`:** objeto compra con relaciones embebidas

---

### `PUT /purchases/:id`

Usado principalmente para cancelar una reserva.

**Body:**
```json
{
  "status": "CANCELLED"
}
```

**Response `200`:** objeto compra actualizado

---

### `DELETE /purchases/:id`

**Response `204`**

---

## 8. Ventas de concesión — `/merchandise/sales`

### `POST /merchandise/sales`

Llamado desde la página de Caja al cobrar productos de concesión.

**Body:**
```json
{
  "items": [
    {
      "product_id": "number",
      "name": "string",
      "qty": "number",
      "unit_price": "number"
    }
  ],
  "total": "number",
  "payment_method": "CARD | CASH | QR",
  "cash_given": "number | null",    // Solo si payment_method === "CASH"
  "change": "number | null",        // Solo si payment_method === "CASH"
  "cashier_id": "number"
}
```

**Response `201`:**
```json
{
  "sale_id": "number"
}
```

---

## 9. Incidencias — `/incidents`

### Modelo completo

```json
{
  "id": "number",
  "title": "string",               // Requerido
  "category": "Técnico | Infraestructura | Mobiliario | Software | Seguridad | Operativo",
  "priority": "critical | high | medium | low",
  "status": "open | in_progress | resolved",
  "room": "string | null",         // Nombre de la sala afectada (libre)
  "description": "string | null",
  "assigned_to": "string | null",  // Nombre del empleado asignado
  "reported_by": "string",         // Nombre del empleado que reporta
  "created_at": "string",          // ISO 8601
  "updated_at": "string"           // ISO 8601
}
```

---

### `GET /incidents`

**Response `200`:** array de incidencias

---

### `GET /incidents/:id`

**Response `200`:** objeto incidencia

---

### `POST /incidents`

**Body:** objeto incidencia sin `id`, `created_at`, `updated_at`

**Response `201`:** objeto incidencia creado

---

### `PUT /incidents/:id`

**Body:** objeto incidencia (usado también para marcar como resuelta: `{ "status": "resolved" }`)

**Response `200`:** objeto incidencia actualizado

---

### `DELETE /incidents/:id`

**Response `204`**

---

## 10. Usuarios — `/users`

### Modelo completo

```json
{
  "id": "number",
  "name": "string",
  "username": "string",
  "email": "string",               // Requerido
  "role": "ADMIN | SUPERVISOR | OPERATOR | TICKET | MAINTENANCE | READONLY | CLIENT",
  "status": "active | inactive",
  "dateOfBirth": "string",         // ISO 8601 fecha. Ej: "1990-05-15"
  "last_login": "string | null",   // ISO 8601 datetime
  "created_at": "string"           // ISO 8601 datetime
}
```

> El frontend de gestión de usuarios solo muestra roles internos de empleados. El rol `CLIENT` existe para usuarios del sistema de reservas online.

---

### `GET /users`

**Response `200`:** array de usuarios

---

### `GET /users/:id`

**Response `200`:** objeto usuario

---

### `POST /users`

**Body:**
```json
{
  "email": "string",
  "role": "ADMIN",
  "dateOfBirth": "1990-05-15"
}
```

**Response `201`:** objeto usuario creado

---

### `PUT /users/:id`

**Body:** objeto usuario

**Response `200`:** objeto usuario actualizado

---

### `DELETE /users/:id`

**Response `204`**

---

## 11. Inventario/Mercancía — `/merchandise`

> Usado tanto para el inventario de concesión como para los productos del POS de Caja.

### Modelo completo

```json
{
  "id": "number",
  "name": "string",                // Requerido
  "category": "Concesión | Técnico | Oficina | Limpieza | Comercial",
  "quantity": "number",            // Stock actual
  "min_stock": "number",           // Umbral de stock mínimo (para alertas)
  "unit": "string",                // Unidad. Ej: "ud", "kg", "l", "caja"
  "location": "string | null",     // Ubicación física. Ej: "Almacén A"
  "supplier": "string | null",     // Proveedor
  "price_unit": "number",          // Precio unitario de venta
  "last_order": "string | null"    // Fecha último pedido. ISO 8601
}
```

---

### `GET /merchandise`

**Response `200`:** array de artículos

---

### `GET /merchandise/:id`

**Response `200`:** objeto artículo

---

### `POST /merchandise`

**Body:** objeto artículo sin `id`

**Response `201`:** objeto artículo creado

---

### `PUT /merchandise/:id`

**Body:** objeto artículo

**Response `200`:** objeto artículo actualizado

---

### `DELETE /merchandise/:id`

**Response `204`**

---

## 12. Informes — `/reports`

Estos endpoints proveen los datos agregados para el Dashboard y la página de Informes.

---

### `GET /reports/kpis`

Datos del día actual para el Dashboard principal.

**Response `200`:**
```json
{
  "revenue_today": 4820.50,        // Ingresos del día (número)
  "tickets_today": 312,            // Entradas vendidas hoy
  "occupancy_avg": 78.4,           // Porcentaje medio de ocupación (0-100)
  "incidents_open": 3,             // Incidencias abiertas actualmente
  "active_sessions": 8,            // Proyecciones activas ahora
  "reservations_today": 127,       // Reservas del día
  "operational_rooms": 5           // Salas en estado "active"
}
```

---

### `GET /reports/sales-week`

Ventas de los últimos 7 días para el gráfico de ingresos.

**Response `200`:**
```json
[
  { "day": "Lun", "ventas": 3200, "entradas": 210 },
  { "day": "Mar", "ventas": 2800, "entradas": 185 },
  { "day": "Mié", "ventas": 3500, "entradas": 230 },
  { "day": "Jue", "ventas": 4100, "entradas": 270 },
  { "day": "Vie", "ventas": 5200, "entradas": 340 },
  { "day": "Sáb", "ventas": 6800, "entradas": 450 },
  { "day": "Dom", "ventas": 5900, "entradas": 390 }
]
```

> `day` debe ser la abreviatura del día en español. `ventas` es el importe en euros. `entradas` es el número de tickets.

---

### `GET /reports/occupancy`

Ocupación media por sala para el gráfico de barras.

**Response `200`:**
```json
[
  { "sala": "Sala IMAX", "pct": 92 },
  { "sala": "Sala 4DX",  "pct": 78 },
  { "sala": "Sala VIP",  "pct": 65 },
  { "sala": "Sala 3",    "pct": 54 },
  { "sala": "Sala 4",    "pct": 48 },
  { "sala": "Sala 5",    "pct": 71 }
]
```

> `sala` es el nombre de la sala. `pct` es el porcentaje de ocupación (0-100, entero).

---

### `GET /reports/incidents-by-category` *(recomendado añadir)*

Datos para el gráfico de tarta de incidencias en la página de Informes.

**Response `200`:**
```json
[
  { "category": "Técnico",         "count": 12 },
  { "category": "Infraestructura", "count": 5  },
  { "category": "Software",        "count": 8  },
  { "category": "Mobiliario",      "count": 3  },
  { "category": "Seguridad",       "count": 2  },
  { "category": "Operativo",       "count": 6  }
]
```

---

### `GET /reports/format-performance` *(recomendado añadir)*

Rendimiento por formato de sala para la tabla de la página de Informes.

**Response `200`:**
```json
[
  { "format": "IMAX",  "sessions": 24, "tickets": 3240, "revenue": 43740, "occupancy": 92 },
  { "format": "4DX",   "sessions": 18, "tickets": 1620, "revenue": 24300, "occupancy": 75 },
  { "format": "VIP",   "sessions": 12, "tickets": 540,  "revenue": 10800, "occupancy": 68 },
  { "format": "3D",    "sessions": 30, "tickets": 3900, "revenue": 42900, "occupancy": 59 },
  { "format": "2D",    "sessions": 45, "tickets": 4500, "revenue": 40500, "occupancy": 45 }
]
```

---

## 13. Auditoría — `/audit-logs`

### Modelo completo

```json
{
  "id": "number",
  "timestamp": "string",          // ISO 8601 datetime
  "user": "string",               // Nombre o username del usuario que realizó la acción
  "action": "LOGIN | LOGOUT | UPDATE | CREATE | DELETE | PERMISSION | CONFIG | LOGIN_FAIL",
  "resource": "string",           // Recurso afectado. Ej: "Película", "Usuario", "Configuración"
  "detail": "string",             // Descripción legible. Ej: "Actualizó película 'Dune II'"
  "ip": "string",                 // IP del cliente. Ej: "192.168.1.45"
  "severity": "info | warning | danger"
}
```

**Criterios de severidad:**
- `danger`: `LOGIN_FAIL`, `DELETE`, `PERMISSION`
- `warning`: `CONFIG`, `UPDATE` en recursos críticos
- `info`: `LOGIN`, `LOGOUT`, `CREATE`, `UPDATE` normales

---

### `GET /audit-logs`

**Query params opcionales:**
```
severity=info|warning|danger
user=string
action=string
from=YYYY-MM-DD
to=YYYY-MM-DD
```

**Response `200`:** array de logs ordenados por `timestamp` DESC

---

## 14. Roles y permisos

### Roles del sistema

| Rol | Descripción | Accesos |
|-----|-------------|---------|
| `ADMIN` | Administrador total | Todo |
| `SUPERVISOR` | Supervisión general | read, create, update, approve |
| `OPERATOR` | Operador | read, create, update |
| `TICKET` | Taquillero | read, create_reservation |
| `MAINTENANCE` | Mantenimiento | read, create_incident, update_incident |
| `READONLY` | Solo lectura | read |
| `CLIENT` | Cliente externo | Acceso a reservas propias (app de cliente) |

### Restricciones de acceso por página

| Página | Roles con acceso |
|--------|-----------------|
| Dashboard | Todos |
| Taquilla | ADMIN, SUPERVISOR, TICKET, OPERATOR |
| Caja | ADMIN, SUPERVISOR, TICKET, OPERATOR |
| Películas | Todos (write solo ADMIN, SUPERVISOR, OPERATOR) |
| Salas | Todos (write solo ADMIN, SUPERVISOR) |
| Horarios | Todos (write solo ADMIN, SUPERVISOR, OPERATOR) |
| Reservas | Todos (cancel solo ADMIN, SUPERVISOR) |
| Incidencias | Todos (write solo ADMIN, SUPERVISOR, OPERATOR, MAINTENANCE) |
| Inventario | Todos (write solo ADMIN, SUPERVISOR) |
| Informes | Todos |
| Cuadrante | Todos (edición solo ADMIN, SUPERVISOR) |
| Trabajadores | Solo ADMIN |
| Auditoría | Solo ADMIN |

---

## 15. Códigos de error estándar

El frontend espera que los errores vengan en este formato:

```json
{
  "error": "string",          // Código de error. Ej: "MOVIE_NOT_FOUND"
  "message": "string",        // Mensaje legible para mostrar al usuario
  "details": "any | null"     // Información adicional opcional
}
```

### Códigos de error esperados

| Código HTTP | Escenario |
|-------------|-----------|
| `400` | Validación fallida (campo requerido faltante, formato incorrecto) |
| `401` | Token ausente, expirado o inválido |
| `403` | Sin permisos suficientes para la operación |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej: asiento ya ocupado, email duplicado) |
| `422` | Datos semánticamente incorrectos (ej: fecha de proyección en el pasado) |
| `500` | Error interno del servidor |

---

## Apéndice A — Enumeraciones

```
MOVIE STATUS:     active | inactive
THEATER STATUS:   active | maintenance | inactive
SCREENING STATUS: SCHEDULED | ACTIVE | CANCELLED | FULL
PURCHASE STATUS:  CONFIRMED | PENDING | CANCELLED | REFUNDED
PAYMENT METHOD:   CARD | CASH | ONLINE | QR
USER ROLE:        ADMIN | SUPERVISOR | OPERATOR | TICKET | MAINTENANCE | READONLY | CLIENT
USER STATUS:      active | inactive
INCIDENT STATUS:  open | in_progress | resolved
INCIDENT PRIORITY: critical | high | medium | low
INCIDENT CATEGORY: Técnico | Infraestructura | Mobiliario | Software | Seguridad | Operativo
INVENTORY CATEGORY: Concesión | Técnico | Oficina | Limpieza | Comercial
MOVIE FORMAT:     IMAX | 4DX | 3D | 2D | IMAX 3D | 2D/3D
MOVIE LANGUAGE:   ES | VO | VOSE
MOVIE RATING:     G | PG | PG-13 | R | NC-17
SEAT TYPE:        standard | premium | vip | disabled
SEAT STATUS:      available | occupied | reserved | broken
AUDIT ACTION:     LOGIN | LOGOUT | UPDATE | CREATE | DELETE | PERMISSION | CONFIG | LOGIN_FAIL
AUDIT SEVERITY:   info | warning | danger
SHIFT TYPE:       M (Mañana 08-16) | T (Tarde 14-22) | N (Noche 18-02) | L (Libre)
```

---

## Apéndice B — Diagrama de relaciones

```
MOVIE (1) ──────── (N) SCREENING (N) ──────── (1) THEATER
                         │
                         │ (1)
                         │
                    PURCHASE (N) ──────── (1) USER
                         │
                         │ (N)
                         │
                        SEAT

SCREENING ──── (N) SEAT  (asientos de esa proyección)

INCIDENT ──── (sin relación FK, sala es texto libre)

MERCHANDISE ──── (N) MERCHANDISE_SALE_ITEM ──── (1) MERCHANDISE_SALE

AUDIT_LOG ──── (referencia a USER por username/nombre, no FK obligatoria)
```

---

## Apéndice C — Endpoints que NO existen aún en el backend (pendientes de implementar)

| Endpoint | Usado en | Prioridad |
|----------|----------|-----------|
| `GET /reports/incidents-by-category` | ReportsPage (gráfico tarta) | Alta |
| `GET /reports/format-performance` | ReportsPage (tabla rendimiento) | Alta |
| `POST /merchandise/sales` | CajaPage (venta concesión) | Alta |
| `GET /screenings/:id/seats` | TaquillaPage (mapa asientos) | Crítica |
| `PUT /seats/:id` | TaquillaPage (marcar ocupado al vender) | Crítica |
| `POST /auth/logout` | AuthContext (cierre de sesión) | Media |
| `GET /auth/me` | AuthContext (restaurar sesión) | Media |
| `GET /reports/kpis` | Dashboard | Alta |

---

*Documento generado desde el análisis del código fuente del frontend FrontCine.*
*Proyecto: Lumen Cinema Management System*
