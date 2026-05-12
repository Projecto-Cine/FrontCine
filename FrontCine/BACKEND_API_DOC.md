# Lumen Cinema — Documentación de API Backend
> Generado desde el frontend React · 2026-05-12  
> Base URL: `/api`  
> Auth: `Authorization: Bearer <JWT>`  
> Todos los endpoints requieren JWT salvo `POST /auth/login`.

---

## Estado del Dashboard ✅

El Dashboard de dirección está implementado y cubre **exactamente** los requisitos:

| Requisito | Estado | Fuente de datos |
|-----------|--------|-----------------|
| Películas proyectadas por año | ✅ | `GET /screenings` → count unique `movie.id` en año actual |
| Sesiones proyectadas por año | ✅ | `GET /screenings` → count con `startTime` en año actual |
| Ingresos en entradas | ✅ | `GET /purchases` → sum `total` de compras CONFIRMED/PAID |
| Ingresos en merchandising | ✅ | `GET /merchandisesales` → sum `total` de ventas |
| Top 3 películas por recaudación (año en curso) | ✅ | `GET /purchases` → agrupa por `screening.movie.title` |
| Top 3 productos por recaudación | ✅ | `GET /merchandisesales` → agrupa por `merchandise.name` |

> **Nota para el backend:** El frontend agrupa/calcula estos datos en el cliente. Si el volumen de datos crece, se recomienda añadir endpoints de analytics dedicados (ver Sección 12).

---

## 1. Autenticación

### `POST /auth/login`
**Sin autenticación requerida**

Request body:
```json
{
  "email": "admin@lumencinema.com",
  "password": "secret123"
}
```

Response esperada (plana, **sin wrapper**):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@lumencinema.com",
    "name": "Admin",
    "role": "ADMIN"
  }
}
```

> ⚠️ La respuesta debe ser **plana** (no envuelta en `{ data: ... }`). El frontend extrae `token` y `user` directamente.

---

## 2. Películas `/movies`

### `GET /movies`
Devuelve todas las películas. **Sin wrapper**, array directo o `{ content: [...] }` paginado.

Response item:
```json
{
  "id": 1,
  "title": "Inside Out 2",
  "durationMin": 100,
  "genre": "Animación",
  "language": "ES",
  "format": "2D",
  "ageRating": "7",
  "active": true,
  "director": "Kelsey Mann",
  "year": 2024,
  "description": "Texto...",
  "imageUrl": "https://..."
}
```

> ⚠️ **Campo `ageRating` en respuesta**: el frontend espera los valores `"ALL"`, `"7"`, `"12"`, `"16"`, `"18"` (strings de dígito, no enum).

### `GET /movies/active`
Igual que `/movies` pero solo películas con `active: true`.

### `GET /movies/{id}`
Devuelve película por ID. Mismo shape que el item de arriba.

### `POST /movies`
Crea película. El frontend envía el campo `ageRating` con el **nombre del enum**:

Request body:
```json
{
  "title": "Inside Out 2",
  "durationMin": 100,
  "genre": "Animación",
  "language": "ES",
  "format": "2D",
  "ageRating": "SEVEN",
  "active": true,
  "director": "Kelsey Mann",
  "year": 2024,
  "description": "Texto..."
}
```

Valores válidos de `ageRating` en request: `ALL | SEVEN | TWELVE | SIXTEEN | EIGHTEEN`

> ⚠️ **Inconsistencia conocida**: la respuesta usa `"7"` pero el request espera `"SEVEN"`. El frontend maneja el mapeo bidireccional. Se recomienda unificar en el backend.

### `PUT /movies/{id}`
Actualiza película. Mismo body que POST.

### `DELETE /movies/{id}`
Elimina película. Response: 204 No Content.

---

## 3. Salas `/theaters`

### `GET /theaters`
```json
[
  {
    "id": 1,
    "name": "Sala 1 — IMAX",
    "capacity": 150
  }
]
```

### `GET /theaters/{id}`
Sala por ID.

### `GET /theaters/{id}/seats`
Butacas de una sala:
```json
[
  {
    "id": 101,
    "row": "A",
    "number": 1,
    "type": "STANDARD"
  }
]
```

### `POST /theaters`
```json
{
  "name": "Sala 2",
  "capacity": 120
}
```

### `PUT /theaters/{id}` / `DELETE /theaters/{id}`
Estándar.

---

## 4. Proyecciones `/screenings`

### `GET /screenings`
Devuelve **todas** las proyecciones. Usado por:
- Dashboard: contar sesiones y películas únicas del año en curso
- SchedulesPage: gestión de horarios

Response item:
```json
{
  "id": 1,
  "startTime": "2026-05-12T20:30:00",
  "basePrice": 9.50,
  "status": "SCHEDULED",
  "full": false,
  "availableSeats": 120,
  "movie": {
    "id": 1,
    "title": "Inside Out 2",
    "format": "2D",
    "language": "ES",
    "genre": "Animación",
    "imageUrl": "https://...",
    "ageRating": "7"
  },
  "theater": {
    "id": 1,
    "name": "Sala 1 — IMAX",
    "capacity": 150
  }
}
```

> ⚠️ **Campo de fecha**: el frontend usa `startTime` (no `dateTime`). Si el backend envía `dateTime`, el Dashboard tiene fallback pero BoxOfficePage y SchedulesPage ya usan `startTime`.

### `GET /screenings/upcoming`
Solo proyecciones futuras (startTime > now). Usado por BoxOfficePage (Taquilla) y Dashboard.

Filtro del frontend sobre la respuesta:
```js
data.filter(s => s.status !== 'CANCELLED' && s.full !== true)
```

### `GET /screenings/{id}`
Proyección por ID.

### `GET /screenings/movie/{movieId}`
Proyecciones de una película.

### `GET /screenings/{id}/seats`
Estado de butacas de una proyección. El frontend normaliza este shape:
```json
[
  {
    "id": 1,
    "screeningId": 1,
    "seat": {
      "id": 101,
      "row": "A",
      "number": 1,
      "type": "STANDARD"
    },
    "occupied": false
  }
]
```

### `GET /screenings/{id}/purchases`
Compras de una proyección.

### `POST /screenings`
Crea proyección:
```json
{
  "movieId": 1,
  "theaterId": 1,
  "startTime": "2026-05-20T20:30",
  "basePrice": 9.50
}
```

> ⚠️ El frontend envía `startTime` y `basePrice`. El campo `status` no se envía en creación.

### `PUT /screenings/{id}`
Actualiza proyección. Mismo body que POST.

### `DELETE /screenings/{id}`
Elimina proyección.

### `POST /screenings/{id}/seats/{seatId}/reserve`
Reserva una butaca.

### `POST /screenings/{id}/seats/{seatId}/release`
Libera una butaca.

---

## 5. Compras (Entradas) `/purchases`

### `GET /purchases`
Devuelve **todas** las compras. Usado por:
- Dashboard: calcular ingresos totales en entradas
- Dashboard: calcular Top 3 películas por recaudación del año
- ReservationsPage: gestión de reservas

Response item (campos **críticos** para el Dashboard):
```json
{
  "id": 1,
  "status": "CONFIRMED",
  "paymentMethod": "CARD",
  "total": 27.00,
  "createdAt": "2026-03-15T10:30:00",
  "screening": {
    "id": 1,
    "startTime": "2026-03-15T20:30:00",
    "movie": {
      "id": 1,
      "title": "Inside Out 2"
    },
    "theater": {
      "id": 1,
      "name": "Sala 1"
    }
  },
  "user": {
    "id": 5,
    "email": "cliente@ejemplo.com",
    "name": "María García"
  },
  "seats": [
    { "id": 101, "row": "A", "number": 1 }
  ]
}
```

Valores de `status`: `PENDING | CONFIRMED | PAID | COMPLETED | CANCELLED`

> ⚠️ **Para el top 3 de películas**: el frontend accede a `p.screening.movie.title`. Este campo anidado es **obligatorio**.  
> ⚠️ **Para el cálculo de ingresos**: el frontend filtra `status === 'CONFIRMED' || 'PAID' || 'COMPLETED'` y suma `total`.

### `GET /purchases/{id}`
Compra por ID.

### `GET /purchases/user/{userId}`
Compras de un usuario.

### `GET /purchases/screening/{screeningId}`
Compras de una proyección.

### `POST /purchases`
Crea compra desde Taquilla:
```json
{
  "userId": 5,
  "screeningId": 1,
  "tickets": [
    { "seatId": 101, "ticketType": "ADULT" },
    { "seatId": 102, "ticketType": "STUDENT" }
  ],
  "paymentMethod": "CARD"
}
```

Valores de `ticketType`: `ADULT | SENIOR | STUDENT | CHILD`  
Valores de `paymentMethod`: `CARD | CASH | QR`

> ⚠️ `userId` puede ser `null` si el cliente no está identificado (venta anónima). El frontend intenta enviar el ID del cajero como fallback.

Response: objeto de compra con `id` para confirmar después.

### `POST /purchases/{id}/confirm`
Confirma el pago de una compra (PENDING → CONFIRMED).  
Body: `{}` (vacío).

### `POST /purchases/{id}/cancel`
Cancela una compra.  
Body: `{}` (vacío).

### `PUT /purchases/{id}`
Actualiza compra (usado en ReservationsPage).

### `DELETE /purchases/{id}`
Elimina compra.

---

## 6. Merchandising `/merchandise`

### `GET /merchandise`
Lista todos los productos:
```json
[
  {
    "id": 1,
    "name": "Palomitas grandes",
    "category": "Palomitas",
    "price": 5.50,
    "description": "Palomitas de maíz tamaño XL",
    "stock": 100
  }
]
```

> ⚠️ El campo de stock es `stock` (no `quantity`).  
> ⚠️ Los campos `emoji` e `imageUrl` **no se guardan en el backend**; el frontend los gestiona en localStorage.

### `GET /merchandise/{id}`
Producto por ID.

### `POST /merchandise`
Crea producto:
```json
{
  "name": "Palomitas grandes",
  "category": "Palomitas",
  "price": 5.50,
  "description": "Palomitas de maíz tamaño XL",
  "stock": 100
}
```

### `PUT /merchandise/{id}`
Actualiza producto. Mismo body que POST.

> ⚠️ Si se envían campos desconocidos (`emoji`, `imageUrl`) el backend debe ignorarlos sin error 400.

### `DELETE /merchandise/{id}`
Elimina producto.

---

## 7. Ventas de Merchandising `/merchandisesales`

### `GET /merchandisesales`
Devuelve **todas** las ventas. Usado por:
- Dashboard: calcular ingresos en merchandising
- Dashboard: calcular Top 3 productos por recaudación

Response item (campos **críticos** para el Dashboard):
```json
{
  "id": 1,
  "quantity": 2,
  "total": 11.00,
  "createdAt": "2026-05-12T15:30:00",
  "merchandise": {
    "id": 1,
    "name": "Palomitas grandes",
    "category": "Palomitas",
    "price": 5.50
  },
  "user": {
    "id": 5,
    "email": "cliente@ejemplo.com"
  }
}
```

> ⚠️ **Para el top 3 de productos**: el frontend accede a `sale.merchandise.name`. Este campo anidado es **obligatorio**.  
> ⚠️ **Para el cálculo de ingresos**: el frontend usa `sale.total`. Si no está, intenta `sale.quantity * sale.unitPrice`.

### `GET /merchandisesales/{id}`
Venta por ID.

### `POST /merchandisesales`
Crea venta de merchandising desde la Caja:
```json
{
  "userId": 5,
  "merchandiseId": 1,
  "quantity": 2
}
```

> El backend debe calcular `total = price * quantity` y devolverlo en la respuesta.

### `PUT /merchandisesales/{id}` / `DELETE /merchandisesales/{id}`
Estándar.

---

## 8. Tickets `/tickets`

### `GET /tickets`
Lista tickets con filtros opcionales:
- `GET /tickets?purchaseId={id}`
- `GET /tickets?screeningId={id}`

Response item:
```json
{
  "id": 1,
  "ticketType": "ADULT",
  "seatId": 101,
  "purchaseId": 1,
  "qrCode": "LUMEN:TKT-...|Inside Out 2|..."
}
```

### `GET /tickets/{id}`
Ticket por ID.

---

## 9. Usuarios `/users`

### `GET /users`
Lista todos los usuarios (roles APP: `ADMIN | CLIENT`).

Response item:
```json
{
  "id": 1,
  "email": "user@ejemplo.com",
  "name": "María García",
  "role": "CLIENT",
  "dateOfBirth": "1990-05-15",
  "fidelityDiscountEligible": true
}
```

### `GET /users/{id}`
Usuario por ID.

### `GET /users/search?q={query}`
Búsqueda de usuarios por nombre/email. Usado en Taquilla para buscar clientes.

Response: array de usuarios que coincidan.

> ⚠️ El endpoint es `/users/search?q=` (no `/users?search=`).

### `POST /users`
Crea usuario.

### `PUT /users/{id}`
Actualiza usuario.

### `POST /users/{id}/image`
Sube imagen de perfil (multipart/form-data).

### `DELETE /users/{id}`
Elimina usuario.

---

## 10. Empleados `/employees`

Gestión de personal con roles internos (distintos de usuarios/clientes).

### `GET /employees`
```json
[
  {
    "id": 1,
    "name": "Juan López",
    "email": "juan@lumencinema.com",
    "role": "CAJERO",
    "phone": "+34 600 000 001",
    "active": true
  }
]
```

Roles válidos: `CAJERO | GERENCIA | SEGURIDAD | LIMPIEZA`

### `GET /employees/{id}` / `POST /employees` / `PUT /employees/{id}` / `DELETE /employees/{id}`
CRUD estándar.

Request body para POST/PUT:
```json
{
  "name": "Juan López",
  "email": "juan@lumencinema.com",
  "role": "CAJERO",
  "phone": "+34 600 000 001",
  "active": true
}
```

---

## 11. Incidencias `/incidents`

### `GET /incidents`
Lista todas las incidencias:
```json
[
  {
    "id": "INC-001",
    "title": "Proyector averiado",
    "category": "Técnico",
    "severity": "ALTA",
    "status": "open",
    "room": "Sala 1",
    "description": "El proyector no enciende.",
    "assignedTo": "juan.lopez",
    "resolved": false,
    "createdAt": "2026-05-10T09:00:00",
    "updatedAt": "2026-05-10T09:00:00"
  }
]
```

Valores de `severity`: `ALTA | MEDIA | BAJA`

> ⚠️ El frontend mapea internamente `ALTA → critical`, `MEDIA → high`, `BAJA → low`.  
> ⚠️ El campo del backend es `severity` y `assignedTo` (camelCase). El frontend normaliza estos campos.

### `POST /incidents`
El frontend envía el campo `severity` (el frontend convierte `priority` → `severity` antes de enviar):
```json
{
  "title": "Proyector averiado",
  "category": "Técnico",
  "severity": "ALTA",
  "status": "open",
  "room": "Sala 1",
  "description": "...",
  "assignedTo": "juan.lopez"
}
```

### `PUT /incidents/{id}`
Mismo body que POST.

### `DELETE /incidents/{id}`
Elimina incidencia.

---

## 12. Turnos `/shifts`

### `GET /shifts` / `GET /shifts/{id}` / `DELETE /shifts/{id}`
Estándar.

### `GET /shifts/date/{date}`
Turnos de una fecha específica (formato `YYYY-MM-DD`).

### `GET /shifts/range?from={date}&to={date}`
Turnos en un rango de fechas.

### `POST /shifts` / `PUT /shifts/{id}`
```json
{
  "employeeId": 1,
  "date": "2026-05-12",
  "shift": "M"
}
```

Valores de `shift`: `M (Mañana 08-16) | T (Tarde 14-22) | N (Noche 18-02) | L (Libre)`

---

## 13. Butacas `/seats`

### `GET /seats` / `GET /seats/{id}`
Lista / butaca por ID.

### `POST /seats` / `PUT /seats/{id}` / `DELETE /seats/{id}`
```json
{
  "theaterId": 1,
  "row": "A",
  "number": 1,
  "type": "STANDARD"
}
```

Tipos de butaca: `STANDARD | VIP | REDUCED_MOBILITY`

---

## 14. Dashboard `/dashboard`

### `GET /dashboard`
Resumen de KPIs para la cabecera del Dashboard.

Response:
```json
{
  "totalRevenue": 125000.00,
  "weeklyRevenue": 8500.00,
  "totalPurchases": 1250,
  "paidPurchases": 1100,
  "activeScreenings": 8,
  "confirmedRoomBookings": 6,
  "totalUsers": 350,
  "activeMovies": 5,
  "unresolvedIncidents": 2
}
```

---

## 15. Informes `/reports`

### `GET /reports/sales-week`
Ingresos de los últimos 7 días. Usado en el gráfico de líneas del Dashboard.

Response:
```json
[
  { "date": "2026-05-06", "totalPurchases": 45, "revenue": 607.50 },
  { "date": "2026-05-07", "totalPurchases": 62, "revenue": 837.00 }
]
```

### `GET /reports/occupancy`
Ocupación por sala. Usado en el gráfico de barras del Dashboard.

Response:
```json
[
  {
    "screeningId": 1,
    "movieTitle": "Inside Out 2",
    "theaterName": "Sala 1 — IMAX",
    "dateTime": "2026-05-12T20:30:00",
    "totalSeats": 150,
    "occupiedSeats": 130,
    "occupancyPercentage": 86.67
  }
]
```

---

## 16. Pagos `/payments`

### `POST /payments/intent` (o `/payments/create-intent`)
Crea un Payment Intent de Stripe para pago online:
```json
{
  "purchaseId": 1,
  "amount": 27.00,
  "currency": "EUR"
}
```

Response:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "publishableKey": "pk_test_xxx"
}
```

> El frontend intenta `/payments/create-intent` primero; si devuelve 404, prueba `/payments/intent`.

### `POST /payments/refund`
```json
{
  "purchaseId": 1,
  "reason": "CUSTOMER_REQUEST"
}
```

### `GET /payments/history`
Historial de pagos con filtros opcionales (query params).

---

## 17. Auditoría `/audit-logs`

### `GET /audit-logs`
Registro de actividad con filtros opcionales (query params).

---

## 18. Formato de respuestas

El frontend soporta automáticamente estas estructuras de respuesta:

```js
// ✅ Array directo (preferido)
[{ "id": 1, ... }]

// ✅ Paginación Spring Data (content)
{ "content": [{ "id": 1, ... }], "totalElements": 100 }

// ✅ Wrapper data
{ "data": [{ "id": 1, ... }] }

// ✅ Wrapper payload
{ "payload": [{ "id": 1, ... }] }
```

---

## 19. Códigos de respuesta esperados

| Operación | Código esperado |
|-----------|----------------|
| GET exitoso | 200 |
| POST exitoso | 200 o 201 |
| PUT exitoso | 200 |
| DELETE exitoso | 204 |
| No encontrado | 404 |
| Validación fallida | 400 |
| Sin autorización | 401 |
| Sin permisos | 403 |
| Conflicto (email duplicado, etc.) | 409 |

---

## 20. Endpoints críticos para el Dashboard de Dirección ⭐

Estos son los 8 endpoints que carga el Dashboard al iniciar:

| # | Endpoint | Propósito |
|---|----------|-----------|
| 1 | `GET /dashboard` | KPIs: ingresos semanales, sesiones activas, compras, incidencias |
| 2 | `GET /reports/sales-week` | Gráfico de ingresos últimos 7 días |
| 3 | `GET /reports/occupancy` | Gráfico de ocupación por sala |
| 4 | `GET /screenings/upcoming` | Sesiones de hoy |
| 5 | `GET /incidents` | Incidencias abiertas |
| 6 | `GET /purchases` | Ingresos totales en entradas + Top 3 películas |
| 7 | `GET /merchandisesales` | Ingresos en merchandising + Top 3 productos |
| 8 | `GET /screenings` | Estadísticas del año (sesiones y películas únicas) |

### Campos mínimos requeridos por el Dashboard

**`GET /purchases`** — cada item debe incluir:
- `status` (para filtrar CONFIRMED/PAID/COMPLETED)
- `total` (número decimal)
- `createdAt` (ISO string, e.g. `"2026-03-15T10:30:00"`)
- `screening.movie.title` (anidado — **crítico** para top 3 películas)

**`GET /merchandisesales`** — cada item debe incluir:
- `total` (número decimal) ó `quantity` + `unitPrice`
- `merchandise.name` (anidado — **crítico** para top 3 productos)
- `createdAt` (ISO string)

**`GET /screenings`** — cada item debe incluir:
- `startTime` (ISO string — **crítico** para contar sesiones/año)
- `movie.id` (para contar películas únicas del año)

---

## 21. Endpoints opcionales recomendados (mejora de rendimiento)

Para evitar que el Dashboard cargue todos los datos y los agregue en el cliente, se sugiere implementar estos endpoints de analytics:

```
GET /analytics/revenue-year?year=2026
→ { ticketRevenue: 125000, merchandiseRevenue: 45000 }

GET /analytics/top-movies?year=2026&limit=3
→ [{ movieId: 1, title: "Inside Out 2", revenue: 25000 }]

GET /analytics/top-products?limit=3
→ [{ merchandiseId: 1, name: "Palomitas grandes", revenue: 8500 }]

GET /analytics/year-stats?year=2026
→ { totalScreenings: 350, uniqueMovies: 12 }
```

Si el backend implementa estos endpoints, el frontend puede usarlos directamente en lugar de los endpoints de datos completos.
