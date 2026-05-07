# Lumen Cinema — Documentación de API Backend

> Versión actualizada desde el frontend tras refactorización de arquitectura de usuarios.
> Separación completa entre trabajadores internos (`/workers`), clientes externos (`/clients`) y socios (`/socios`).

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
10. [Trabajadores — `/workers`](#10-trabajadores--workers)
11. [Clientes — `/clients`](#11-clientes--clients)
12. [Socios — `/socios`](#12-socios--socios)
13. [Inventario/Mercancía — `/merchandise`](#13-inventariomercancía--merchandise)
14. [Informes — `/reports`](#14-informes--reports)
15. [Auditoría — `/audit-logs`](#15-auditoría--audit-logs)
16. [Roles y permisos](#16-roles-y-permisos)
17. [Códigos de error estándar](#17-códigos-de-error-estándar)

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
    "role": "ADMIN | SUPERVISOR | OPERATOR | TICKET | MAINTENANCE | READONLY | CLIENT",
    "status": "active | inactive"
  },
  "token": "string"
}
```

> El token se almacena en `localStorage` como `lumen_token` y se envía en cada petición como `Authorization: Bearer <token>`.

> Si `status === "inactive"`, el frontend rechaza el login aunque las credenciales sean correctas. El backend puede devolver `403` adicionalmente.

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

### Modelo completo

```json
{
  "id": "number",
  "dateTime": "string",       // ISO 8601. Ej: "2024-04-30T16:00:00"
  "price": "number",          // Precio base de la entrada
  "status": "SCHEDULED | ACTIVE | CANCELLED | FULL",
  "movie": {                  // Objeto película embebido (no solo id)
    "id": "number",
    "title": "string",
    "durationMin": "number",
    "format": "string",
    "language": "string",
    "ageRating": "string",
    "imageUrl": "string"
  },
  "theater": {                // Objeto sala embebido (no solo id)
    "id": "number",
    "name": "string",
    "capacity": "number"
  }
}
```

> **IMPORTANTE:** El frontend espera que `movie` y `theater` vengan como **objetos embebidos** con al menos `id` y `name`/`title`. Si vienen solo como IDs, el frontend fallará al intentar mostrar `screening.movie.title`.

---

### `GET /screenings`

**Query params opcionales:**
```
date=YYYY-MM-DD
movieId=number
theaterId=number
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
  "screeningId": "number"
}
```

---

### `GET /screenings/:screeningId/seats`

Endpoint principal para mostrar el mapa de asientos en taquilla.

**Response `200`:** array de asientos de esa proyección
```json
[
  { "id": 1, "row": "A", "number": 1, "type": "standard",  "status": "available" },
  { "id": 2, "row": "A", "number": 2, "type": "standard",  "status": "occupied"  }
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

**Body:** objeto asiento (usado para marcar como ocupado tras una venta)

**Response `200`:** objeto asiento actualizado

---

### `DELETE /seats/:id`

**Response `204`**

---

## 7. Compras/Reservas — `/purchases`

> El frontend llama siempre a `/purchases`, nunca a `/reservations`. No crear alias.

### Modelo completo

```json
{
  "id": "number",
  "status": "CONFIRMED | PENDING | CANCELLED | REFUNDED",
  "paymentMethod": "CARD | CASH | ONLINE",
  "total": "number",
  "createdAt": "string",
  "screening": {
    "id": "number",
    "dateTime": "string",
    "movie": { "id": "number", "title": "string" },
    "theater": { "id": "number", "name": "string" }
  },
  "user": {
    "id": "number",
    "name": "string",
    "email": "string"
  },
  "seats": [
    { "id": "number", "row": "string", "number": "number" }
  ]
}
```

> `user` puede ser `null` en ventas anónimas de taquilla.

---

### `POST /purchases` — Venta desde taquilla

**Body:**
```json
{
  "session_id": "number",
  "seats": ["A1", "A2"],
  "ticket_type": "adulto",
  "format_extra": "imax",
  "unit_price": 13.50,
  "surcharge": 5.00,
  "total": 37.00,
  "payment_method": "CARD",
  "cashier_id": "number"
}
```

**Response `201`:**
```json
{
  "sale_id": "number",
  "qr_codes": [
    "LUMEN:TKT-1234567890-abc:A1:SES42:2024-04-30:16:00"
  ]
}
```

> Formato QR: `LUMEN:{ticketId}:{seat}:SES{sessionId}:{date}:{time}`

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

**Body:**
```json
{ "status": "CANCELLED" }
```

**Response `200`:** objeto compra actualizado

---

### `DELETE /purchases/:id`

**Response `204`**

---

## 8. Ventas de concesión — `/merchandise/sales`

### `POST /merchandise/sales`

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
  "cash_given": "number | null",
  "change": "number | null",
  "cashier_id": "number"
}
```

**Response `201`:**
```json
{ "sale_id": "number" }
```

---

## 9. Incidencias — `/incidents`

### Modelo completo

```json
{
  "id": "number",
  "title": "string",
  "category": "Técnico | Infraestructura | Mobiliario | Software | Seguridad | Operativo",
  "priority": "critical | high | medium | low",
  "status": "open | in_progress | resolved",
  "room": "string | null",
  "description": "string | null",
  "assigned_to": "string | null",
  "reported_by": "string",
  "created_at": "string",
  "updated_at": "string"
}
```

### Permisos por rol en este endpoint

| Rol | GET (listar/ver) | POST (crear) | PUT (editar/resolver) | DELETE |
|-----|:---:|:---:|:---:|:---:|
| ADMIN | ✓ | ✓ | ✓ | ✓ |
| SUPERVISOR | ✓ | ✓ | ✓ | ✓ |
| MAINTENANCE | ✓ | ✓ | ✓ | ✓ |
| TICKET | ✓ | ✓ | — | — |
| OPERATOR | ✓ | — | — | — |
| READONLY | ✓ | — | — | — |
| CLIENT | — | — | — | — |

> **SecurityConfig crítico:** el endpoint `GET /incidents` debe permitir todos los roles internos de trabajador (ADMIN, SUPERVISOR, OPERATOR, TICKET, MAINTENANCE, READONLY). El frontend ya filtra qué botones muestra según el rol, pero si el backend devuelve `403` en el GET, la página aparecerá vacía para todos los roles no-admin.

---

### `GET /incidents`

**Roles permitidos:** ADMIN, SUPERVISOR, OPERATOR, TICKET, MAINTENANCE, READONLY

**Response `200`:** array de incidencias

---

### `GET /incidents/:id`

**Roles permitidos:** ADMIN, SUPERVISOR, OPERATOR, TICKET, MAINTENANCE, READONLY

**Response `200`:** objeto incidencia

---

### `POST /incidents`

**Roles permitidos:** ADMIN, SUPERVISOR, MAINTENANCE, TICKET

**Body:** objeto incidencia sin `id`, `created_at`, `updated_at`

**Response `201`:** objeto incidencia creado

---

### `PUT /incidents/:id`

**Roles permitidos:** ADMIN, SUPERVISOR, MAINTENANCE

**Body:** objeto incidencia parcial o completo
```json
{ "status": "resolved" }
```

**Response `200`:** objeto incidencia actualizado

---

### `DELETE /incidents/:id`

**Roles permitidos:** ADMIN, SUPERVISOR, MAINTENANCE

**Response `204`**

---

## 10. Trabajadores — `/workers`

> **NUEVO ENDPOINT** — sustituye al antiguo `/users` para la gestión interna de empleados.
> El frontend ya NO llama a `/users` para trabajadores: usa exclusivamente `/workers`.

### ¿Por qué `/workers` y no `/users`?

La separación es necesaria para evitar conflictos de negocio:
- `/workers` → empleados internos del cine (roles: ADMIN, SUPERVISOR, OPERATOR, TICKET, MAINTENANCE, READONLY)
- `/clients` → clientes externos (rol: CLIENT)
- `/socios` → clientes con membresía/descuento (subconjunto de clients)

Mezclar todo en `/users` generaba conflictos al gestionar permisos y al filtrar en cuadrante/incidencias.

### Modelo completo

```json
{
  "id": "number",
  "name": "string",            // Nombre completo. Requerido
  "username": "string",        // Nombre de usuario para login
  "email": "string",           // Requerido
  "role": "ADMIN | SUPERVISOR | OPERATOR | TICKET | MAINTENANCE | READONLY",
  "status": "active | inactive",
  "dateOfBirth": "string",     // ISO 8601 fecha. Ej: "1990-05-15"
  "last_login": "string | null",
  "created_at": "string"
}
```

> El campo `role` **nunca** debe ser `CLIENT` en este endpoint. Si el backend recibe un `role: CLIENT` en un POST a `/workers`, debe devolver `400 Bad Request`.

---

### `GET /workers`

**Roles permitidos:** ADMIN, SUPERVISOR

**Comportamiento:** devuelve todos los usuarios con rol distinto de `CLIENT`.

**Response `200`:** array de trabajadores
```json
[
  {
    "id": 1,
    "name": "Ana García",
    "username": "anagarcia",
    "email": "ana@lumen.es",
    "role": "MAINTENANCE",
    "status": "active",
    "dateOfBirth": "1990-05-15",
    "last_login": "2026-05-06T08:30:00",
    "created_at": "2024-01-15T10:00:00"
  }
]
```

> Este endpoint también lo usan `ShiftsPage` (cuadrante semanal) e `IncidentsPage` (dropdown de asignación). Para esos casos se recupera la lista completa y se filtra en cliente.

---

### `GET /workers/:id`

**Roles permitidos:** ADMIN, SUPERVISOR

**Response `200`:** objeto trabajador

---

### `POST /workers`

**Roles permitidos:** ADMIN

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "role": "OPERATOR",
  "dateOfBirth": "1995-03-20"
}
```

**Response `201`:** objeto trabajador creado con `id`

> El backend debe generar automáticamente `username` a partir del nombre o email si no se proporciona.

---

### `PUT /workers/:id`

**Roles permitidos:** ADMIN

**Body:** objeto trabajador (parcial o completo)

**Response `200`:** objeto trabajador actualizado

---

### `DELETE /workers/:id`

**Roles permitidos:** ADMIN

**Restricción:** no se puede eliminar al propio usuario autenticado.

**Response `204`**

---

### Uso en otras páginas

| Página | Llamada | Para qué |
|--------|---------|----------|
| `UsersPage` (Trabajadores) | `GET/POST/PUT/DELETE /workers` | CRUD completo de empleados |
| `ShiftsPage` (Cuadrante) | `GET /workers` | Obtener lista de empleados para asignar turnos |
| `IncidentsPage` (Incidencias) | `GET /workers` | Llenar dropdown "Asignar a" (filtrado a MAINTENANCE, OPERATOR, SUPERVISOR, ADMIN) |
| `AuditPage` (Auditoría) | `GET /workers` | Filtro de usuario en el log de auditoría |

---

## 11. Clientes — `/clients`

> **NUEVO ENDPOINT** — gestión de clientes externos (rol CLIENT).
> El frontend ya NO usa `/users` para clientes: usa exclusivamente `/clients`.

### ¿Qué es un cliente?

Cualquier persona que compra entradas o tiene una cuenta de usuario para reservas online. Tiene rol `CLIENT` en el sistema. Los clientes **no son trabajadores** y no aparecen en el cuadrante ni en las incidencias.

### Modelo completo

```json
{
  "id": "number",
  "name": "string",
  "email": "string",           // Requerido. Único en el sistema
  "phone": "string | null",
  "dateOfBirth": "string | null",
  "role": "CLIENT",            // Siempre CLIENT. No editable desde el backoffice
  "status": "active | inactive",
  "isSocio": "boolean",        // true si tiene membresía activa
  "socioSince": "string | null",  // Fecha de alta como socio. ISO 8601
  "created_at": "string"
}
```

---

### `GET /clients`

**Roles permitidos:** ADMIN, SUPERVISOR, OPERATOR, TICKET

**Comportamiento:** devuelve todos los usuarios con rol `CLIENT`.

**Response `200`:** array de clientes

---

### `GET /clients/search?q={query}`

**Roles permitidos:** ADMIN, SUPERVISOR, OPERATOR, TICKET

**Query param:** `q` — búsqueda por nombre, email o teléfono (mínimo 2 caracteres)

**Response `200`:** array de clientes que coincidan (máximo 20 resultados recomendado)

---

### `GET /clients/:id`

**Roles permitidos:** ADMIN, SUPERVISOR, OPERATOR, TICKET

**Response `200`:** objeto cliente con historial de compras si está disponible

---

### `POST /clients`

**Roles permitidos:** ADMIN, SUPERVISOR, OPERATOR

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string | null",
  "dateOfBirth": "string | null"
}
```

> El backend debe asignar automáticamente `role: CLIENT` y `isSocio: false`. No se pasa `role` desde el frontend.

**Response `201`:** objeto cliente creado

---

### `PUT /clients/:id`

**Roles permitidos:** ADMIN, SUPERVISOR, OPERATOR

**Body:** objeto cliente parcial

**Response `200`:** objeto cliente actualizado

---

### `DELETE /clients/:id`

**Roles permitidos:** ADMIN

**Response `204`**

---

## 12. Socios — `/socios`

> **NUEVO ENDPOINT** — subconjunto de clientes que se han registrado como socios y tienen descuento en entradas.

### Lógica de negocio

- Todo socio es cliente (`isSocio: true` en la entidad Client), pero no todo cliente es socio.
- Un cliente se hace socio voluntariamente para obtener descuentos y beneficios.
- El descuento se aplica automáticamente al calcular el precio en taquilla/reserva online.
- Los datos de socio son opcionales y adicionales a los del cliente base.

### Modelo completo

```json
{
  "id": "number",
  "clientId": "number",       // FK al cliente base. Requerido
  "name": "string",           // Heredado del cliente o sobreescrito
  "email": "string",
  "phone": "string | null",
  "dateOfBirth": "string | null",
  "membershipNumber": "string",  // Número de socio único. Generado por el backend. Ej: "LUM-00042"
  "membershipType": "BASIC | PREMIUM | VIP",
  "discountPct": "number",       // Porcentaje de descuento. Ej: 15 (= 15%)
  "status": "active | suspended | expired",
  "joinedAt": "string",          // Fecha de alta. ISO 8601
  "expiresAt": "string | null",  // Fecha de caducidad (null = indefinido)
  "notes": "string | null"
}
```

---

### `GET /socios`

**Roles permitidos:** ADMIN, SUPERVISOR, OPERATOR, TICKET

**Response `200`:** array de socios con datos del cliente embebidos

---

### `GET /socios/search?q={query}`

**Roles permitidos:** ADMIN, SUPERVISOR, OPERATOR, TICKET

**Query param:** `q` — búsqueda por nombre, email, teléfono o número de socio

**Response `200`:** array de coincidencias

---

### `GET /socios/:id`

**Roles permitidos:** ADMIN, SUPERVISOR, OPERATOR, TICKET

**Response `200`:** objeto socio

---

### `POST /socios`

**Roles permitidos:** ADMIN, SUPERVISOR, OPERATOR

El cliente decide hacerse socio. Se puede hacer a partir de un cliente existente o creando cliente y socio a la vez.

**Body (a partir de cliente existente):**
```json
{
  "clientId": "number",
  "membershipType": "BASIC",
  "notes": "string | null"
}
```

**Body (cliente nuevo + socio en un solo paso):**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string | null",
  "dateOfBirth": "string | null",
  "membershipType": "BASIC",
  "notes": "string | null"
}
```

> El backend debe crear el cliente con `role: CLIENT`, luego crear el socio y vincularlos. Devuelve el socio con el cliente embebido.
> El backend genera `membershipNumber` automáticamente.
> El backend pone `isSocio: true` en la entidad Client.

**Response `201`:** objeto socio creado con cliente embebido

---

### `PUT /socios/:id`

**Roles permitidos:** ADMIN, SUPERVISOR

**Body:** objeto socio parcial (ej. cambiar tipo, suspender, renovar)

**Response `200`:** objeto socio actualizado

---

### `DELETE /socios/:id`

**Roles permitidos:** ADMIN

> Al eliminar un socio, el backend debe poner `isSocio: false` en la entidad Client asociada.

**Response `204`**

---

### Tipos de membresía y descuentos sugeridos

| Tipo | Descuento | Descripción |
|------|-----------|-------------|
| `BASIC` | 10% | Socio estándar |
| `PREMIUM` | 15% | Socio con beneficios extra |
| `VIP` | 20% | Socio VIP con acceso preferente |

> Los descuentos exactos los decide el negocio. El frontend leerá `discountPct` del objeto socio sin hardcodear valores.

---

## 13. Inventario/Mercancía — `/merchandise`

> Usado tanto para el inventario de concesión como para los productos del POS de Caja.

### Modelo completo

```json
{
  "id": "number",
  "name": "string",
  "category": "Concesión | Técnico | Oficina | Limpieza | Comercial",
  "quantity": "number",
  "min_stock": "number",
  "unit": "string",
  "location": "string | null",
  "supplier": "string | null",
  "price_unit": "number",
  "last_order": "string | null"
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

## 14. Informes — `/reports`

---

### `GET /reports/kpis`

**Response `200`:**
```json
{
  "revenue_today": 4820.50,
  "tickets_today": 312,
  "occupancy_avg": 78.4,
  "incidents_open": 3,
  "active_sessions": 8,
  "reservations_today": 127,
  "operational_rooms": 5
}
```

---

### `GET /reports/sales-week`

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

> `day` debe ser la abreviatura del día en español. `ventas` es el importe en euros.

---

### `GET /reports/occupancy`

**Response `200`:**
```json
[
  { "sala": "Sala IMAX", "pct": 92 },
  { "sala": "Sala 4DX",  "pct": 78 },
  { "sala": "Sala VIP",  "pct": 65 }
]
```

> `pct` es el porcentaje de ocupación (0-100, entero).

---

### `GET /reports/incidents-by-category`

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

### `GET /reports/format-performance`

**Response `200`:**
```json
[
  { "format": "IMAX", "sessions": 24, "tickets": 3240, "revenue": 43740, "occupancy": 92 },
  { "format": "4DX",  "sessions": 18, "tickets": 1620, "revenue": 24300, "occupancy": 75 },
  { "format": "3D",   "sessions": 30, "tickets": 3900, "revenue": 42900, "occupancy": 59 },
  { "format": "2D",   "sessions": 45, "tickets": 4500, "revenue": 40500, "occupancy": 45 }
]
```

---

## 15. Auditoría — `/audit-logs`

### Modelo completo

```json
{
  "id": "number",
  "timestamp": "string",
  "user": "string",
  "action": "LOGIN | LOGOUT | UPDATE | CREATE | DELETE | PERMISSION | CONFIG | LOGIN_FAIL",
  "resource": "string",
  "detail": "string",
  "ip": "string",
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

## 16. Roles y permisos

### Roles del sistema y a qué entidad pertenecen

| Rol | Entidad | Descripción |
|-----|---------|-------------|
| `ADMIN` | Trabajador | Administrador total |
| `SUPERVISOR` | Trabajador | Supervisión general |
| `OPERATOR` | Trabajador | Operador de sala |
| `TICKET` | Trabajador | Taquillero / cajero |
| `MAINTENANCE` | Trabajador | Mantenimiento e instalaciones |
| `READONLY` | Trabajador | Auditor / solo lectura |
| `CLIENT` | Cliente | Cliente externo (reservas online) |

> Los roles `ADMIN` a `READONLY` son roles internos de trabajador.
> El rol `CLIENT` es exclusivo de clientes externos. **Nunca debe aparecer en `/workers`**.

---

### Permisos por operación

| Acción | ADMIN | SUPERVISOR | OPERATOR | TICKET | MAINTENANCE | READONLY | CLIENT |
|--------|:-----:|:----------:|:--------:|:------:|:-----------:|:--------:|:------:|
| `read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `create` | ✓ | ✓ | ✓ | — | — | — | — |
| `update` | ✓ | ✓ | ✓ | — | — | — | — |
| `approve` | ✓ | ✓ | — | — | — | — | — |
| `create_reservation` | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| `create_incident` | ✓ | ✓ | — | ✓ | ✓ | — | — |
| `update_incident` | ✓ | ✓ | — | — | ✓ | — | — |
| `delete_incident` | ✓ | ✓ | — | — | ✓ | — | — |

---

### Acceso por página del backoffice

| Página | Roles con acceso | Escritura |
|--------|-----------------|-----------|
| Dashboard | Todos los trabajadores | — |
| Taquilla | ADMIN, SUPERVISOR, TICKET, OPERATOR | TICKET, OPERATOR, ADMIN, SUPERVISOR |
| Caja concesión | ADMIN, SUPERVISOR, TICKET, OPERATOR | TICKET, OPERATOR, ADMIN, SUPERVISOR |
| Películas | Todos los trabajadores | ADMIN, SUPERVISOR, OPERATOR |
| Salas | Todos los trabajadores | ADMIN, SUPERVISOR |
| Horarios | Todos los trabajadores | ADMIN, SUPERVISOR, OPERATOR |
| Reservas | Todos los trabajadores | Cancelar: ADMIN, SUPERVISOR |
| **Incidencias** | **Todos los trabajadores** | **Crear: ADMIN, SUPERVISOR, MAINTENANCE, TICKET** · **Editar/borrar: ADMIN, SUPERVISOR, MAINTENANCE** |
| Inventario | Todos los trabajadores | ADMIN, SUPERVISOR |
| Informes | Todos los trabajadores | — |
| Cuadrante | Todos los trabajadores | ADMIN, SUPERVISOR |
| **Trabajadores** | **Solo ADMIN** | **Solo ADMIN** |
| **Clientes** | **ADMIN, SUPERVISOR, OPERATOR, TICKET** | **Crear/editar: ADMIN, SUPERVISOR, OPERATOR** · **Borrar: ADMIN** |
| **Socios** | **ADMIN, SUPERVISOR, OPERATOR, TICKET** | **Crear/editar: ADMIN, SUPERVISOR, OPERATOR** · **Borrar: ADMIN** |
| Auditoría | Solo ADMIN | — |

---

### SecurityConfig — reglas concretas que el backend debe implementar

```
GET    /workers          → ADMIN, SUPERVISOR
POST   /workers          → ADMIN
PUT    /workers/:id      → ADMIN
DELETE /workers/:id      → ADMIN

GET    /clients          → ADMIN, SUPERVISOR, OPERATOR, TICKET
GET    /clients/search   → ADMIN, SUPERVISOR, OPERATOR, TICKET
GET    /clients/:id      → ADMIN, SUPERVISOR, OPERATOR, TICKET
POST   /clients          → ADMIN, SUPERVISOR, OPERATOR
PUT    /clients/:id      → ADMIN, SUPERVISOR, OPERATOR
DELETE /clients/:id      → ADMIN

GET    /socios           → ADMIN, SUPERVISOR, OPERATOR, TICKET
GET    /socios/search    → ADMIN, SUPERVISOR, OPERATOR, TICKET
GET    /socios/:id       → ADMIN, SUPERVISOR, OPERATOR, TICKET
POST   /socios           → ADMIN, SUPERVISOR, OPERATOR
PUT    /socios/:id       → ADMIN, SUPERVISOR
DELETE /socios/:id       → ADMIN

GET    /incidents        → ADMIN, SUPERVISOR, OPERATOR, TICKET, MAINTENANCE, READONLY  ← CRÍTICO
GET    /incidents/:id    → ADMIN, SUPERVISOR, OPERATOR, TICKET, MAINTENANCE, READONLY
POST   /incidents        → ADMIN, SUPERVISOR, MAINTENANCE, TICKET
PUT    /incidents/:id    → ADMIN, SUPERVISOR, MAINTENANCE
DELETE /incidents/:id    → ADMIN, SUPERVISOR, MAINTENANCE
```

---

## 17. Códigos de error estándar

El frontend espera que los errores vengan en este formato:

```json
{
  "error": "string",
  "message": "string",
  "details": "any | null"
}
```

| Código HTTP | Escenario |
|-------------|-----------|
| `400` | Validación fallida (campo requerido faltante, formato incorrecto, role CLIENT en /workers) |
| `401` | Token ausente, expirado o inválido |
| `403` | Sin permisos suficientes para la operación |
| `404` | Recurso no encontrado |
| `409` | Conflicto (asiento ya ocupado, email duplicado, número de socio ya existe) |
| `422` | Datos semánticamente incorrectos (fecha en el pasado, stock negativo) |
| `500` | Error interno del servidor |

---

## Apéndice A — Enumeraciones

```
MOVIE STATUS:        active | inactive
THEATER STATUS:      active | maintenance | inactive
SCREENING STATUS:    SCHEDULED | ACTIVE | CANCELLED | FULL
PURCHASE STATUS:     CONFIRMED | PENDING | CANCELLED | REFUNDED
PAYMENT METHOD:      CARD | CASH | ONLINE | QR
WORKER ROLE:         ADMIN | SUPERVISOR | OPERATOR | TICKET | MAINTENANCE | READONLY
CLIENT ROLE:         CLIENT  (siempre este valor, no editable)
USER STATUS:         active | inactive
INCIDENT STATUS:     open | in_progress | resolved
INCIDENT PRIORITY:   critical | high | medium | low
INCIDENT CATEGORY:   Técnico | Infraestructura | Mobiliario | Software | Seguridad | Operativo
INVENTORY CATEGORY:  Concesión | Técnico | Oficina | Limpieza | Comercial
MOVIE FORMAT:        IMAX | 4DX | 3D | 2D | IMAX 3D | 2D/3D
MOVIE LANGUAGE:      ES | VO | VOSE
MOVIE RATING:        G | PG | PG-13 | R | NC-17
SEAT TYPE:           standard | premium | vip | disabled
SEAT STATUS:         available | occupied | reserved | broken
AUDIT ACTION:        LOGIN | LOGOUT | UPDATE | CREATE | DELETE | PERMISSION | CONFIG | LOGIN_FAIL
AUDIT SEVERITY:      info | warning | danger
SHIFT TYPE:          M (Mañana 08-16) | T (Tarde 14-22) | N (Noche 18-02) | L (Libre)
MEMBERSHIP TYPE:     BASIC | PREMIUM | VIP
MEMBERSHIP STATUS:   active | suspended | expired
```

---

## Apéndice B — Diagrama de relaciones

```
MOVIE (1) ──────── (N) SCREENING (N) ──────── (1) THEATER
                         │
                         │ (1)
                         │
                    PURCHASE (N) ──────── (1) CLIENT
                         │
                         │ (N)
                         │
                        SEAT

SCREENING ──── (N) SEAT  (asientos de esa proyección)

CLIENT (1) ──── (0..1) SOCIO  (un cliente puede o no tener membresía)
                              └── isSocio=true en entidad Client

WORKER ──── (sin relación FK con Client — entidades completamente separadas)

INCIDENT ──── assigned_to: string (username de Worker, sin FK obligatoria)
              reported_by: string (username de Worker, sin FK obligatoria)

MERCHANDISE ──── (N) MERCHANDISE_SALE_ITEM ──── (1) MERCHANDISE_SALE

AUDIT_LOG ──── user: string (username de Worker, referencia por nombre — no FK)
```

---

## Apéndice C — Endpoints pendientes de implementar

### Críticos (el frontend los llama y fallará sin ellos)

| Endpoint | Página que lo usa | Motivo |
|----------|-------------------|--------|
| `GET /workers` | UsersPage, ShiftsPage, IncidentsPage, AuditPage | Sustituye a `/users` para empleados — **ya no existe `/users`** |
| `POST /workers` | UsersPage | Crear nuevo trabajador |
| `PUT /workers/:id` | UsersPage | Editar trabajador |
| `DELETE /workers/:id` | UsersPage | Eliminar trabajador |
| `GET /clients` | ClientsPage | Listar clientes externos |
| `GET /clients/search` | ClientsPage | Búsqueda en tiempo real |
| `POST /clients` | ClientsPage | Crear cliente (antes usaba `/users`) |
| `PUT /clients/:id` | ClientsPage | Editar cliente (antes usaba `/users`) |
| `DELETE /clients/:id` | ClientsPage | Eliminar cliente (antes usaba `/users`) |
| `GET /screenings/:id/seats` | TaquillaPage | Mapa de asientos |
| `PUT /seats/:id` | TaquillaPage | Marcar ocupado al vender |

### Alta prioridad

| Endpoint | Página que lo usa | Motivo |
|----------|-------------------|--------|
| `GET /socios` | SociosPage / ClientsPage | Listar socios con membresía |
| `GET /socios/search` | SociosPage | Búsqueda por número de socio o email |
| `POST /socios` | SociosPage | Registrar cliente como socio |
| `PUT /socios/:id` | SociosPage | Actualizar datos de membresía |
| `DELETE /socios/:id` | SociosPage | Dar de baja membresía |
| `GET /reports/kpis` | Dashboard | KPIs del día |
| `GET /reports/incidents-by-category` | ReportsPage | Gráfico tarta incidencias |
| `GET /reports/format-performance` | ReportsPage | Tabla rendimiento por formato |

### Media prioridad

| Endpoint | Página que lo usa | Motivo |
|----------|-------------------|--------|
| `POST /merchandise/sales` | CajaPage | Venta de concesión |
| `POST /auth/logout` | AuthContext | Cierre de sesión correcto |
| `GET /auth/me` | AuthContext | Restaurar sesión al recargar |

### Refactorización requerida en el backend existente

| Acción | Motivo |
|--------|--------|
| Revisar `SecurityConfig` para `GET /incidents` — debe incluir OPERATOR, TICKET, READONLY | Actualmente solo ADMIN/SUPERVISOR/MAINTENANCE pueden hacer GET, los demás reciben 403 y la página aparece vacía |
| Renombrar o añadir alias `/workers` sobre la lógica actual de `/users` filtrando por rol != CLIENT | El frontend ha migrado completamente de `/users` a `/workers` |
| Añadir endpoint `/clients` con filtro `role = CLIENT` sobre la entidad User existente | El frontend usa `/clients` para todo el CRUD de clientes |
| Crear entidad `Socio` con FK a `User(CLIENT)` o añadir tabla de membresía | El frontend espera `/socios` como endpoint propio |

---

*Documento actualizado tras refactorización de arquitectura de usuarios — Mayo 2026.*
*Proyecto: Lumen Cinema Management System — Frontend: FrontCine (React + Vite)*
