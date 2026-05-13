# Auditoría Lighthouse — FrontCine

> Fecha: 2026-05-13 | Rama: `dev` | Commit: tras `fix(a11y)` + `fix(login)`

---

## Resultados Finales

| Categoría | Antes (pre-fix) | Tras fixes POS | **Final** |
|---|---|---|---|
| **Accesibilidad** | 89 | 96 | **100** ✅ |
| **Best Practices** | 100 | 100 | **100** ✅ |
| **SEO** | 92 | 92 | **92** ✅ |
| Performance | 72 | 73 | 70 ⚠️ |

> Los archivos HTML interactivos de cada auditoría están en esta carpeta.

---

## Archivos de auditoría generados

| Archivo | Descripción |
|---|---|
| `report-login.report.html/json` | Auditoría inicial (pre-fix Login) — Accesibilidad: 89 |
| `report-login-v2.report.html/json` | Tras fixes POS — Accesibilidad: 96 |
| `report-login-final.report.html/json` | **Auditoría final** — Accesibilidad: 100 |

---

## Issues resueltos durante la auditoría

### Ronda 1 — Fixes POS (BoxOffice, Concession, Stripe)

| Componente | Issue | Fix aplicado |
|---|---|---|
| BoxOfficePage | Inputs búsqueda sin label | `aria-label` añadido |
| BoxOfficePage | Label efectivo sin `htmlFor` | `id` + `htmlFor` añadidos |
| BoxOfficePage | Botones tipo entrada sin `aria-pressed` | `aria-pressed` añadido |
| BoxOfficePage | Botones método pago sin `aria-pressed` | `aria-pressed` añadido |
| BoxOfficePage | Botones icon-only sin `aria-label` | `aria-label` en 3 botones |
| BoxOfficePage | Navegación tickets sin `aria-pressed` | `aria-pressed` + `role="group"` |
| BoxOfficePage | QR sin descripción accesible | `role="img"` + `aria-label` |
| ConcessionPage | Inputs búsqueda sin label | `aria-label` añadido |
| ConcessionPage | Tabs categoría sin `aria-pressed` | `aria-pressed` añadido |
| ConcessionPage | Tarjetas producto sin estado en-carrito | `aria-pressed={!!inCart}` |
| ConcessionPage | Botones ±/eliminar sin `aria-label` | `aria-label` + `aria-live` en qty |
| ConcessionPage | 3 modales sin `role="dialog"` | `role="dialog"` + `aria-modal` + `aria-labelledby` |
| ConcessionPage | Labels formulario sin `htmlFor` | 5 pares `id`/`htmlFor` |
| ConcessionPage | Botones cierre sin `aria-label` | `aria-label="Cerrar"` |
| StripePaymentModal | Modal sin estructura de diálogo | `role="dialog"`, `aria-modal`, focus management, Escape |
| StripePaymentModal | Error sin `role="alert"` | `role="alert"` añadido |
| StripePaymentModal | Loading sin `aria-live` | `role="status"` + `aria-live` |
| StripePaymentModal | Strings hardcodeados en ES | Migrado a i18n completo |
| StripePaymentModal | Íconos decorativos no ocultos | `aria-hidden="true"` en todos |

### Ronda 2 — Fixes Login (detectados por Lighthouse)

| Issue Lighthouse | Fix aplicado |
|---|---|
| `landmark-one-main` — Login sin `<main>` | `<div>` → `<main aria-label>` |
| `color-contrast` — `.brandSub`, `.label` en `var(--text-3)` | Cambiado a `var(--text-2)` (+1.5 contrast ratio) |
| `color-contrast` — `.hint`, `.demoTitle` en `var(--text-3)` | Cambiado a `var(--text-2)` |
| `target-size` — `.pwToggle` demasiado pequeño | `min-width: 28px; min-height: 28px` añadido |
| `label-content-name-mismatch` — `aria-label` no coincide con texto visible en demo buttons | Eliminado `aria-label` redundante (texto visible ya es suficiente) |

---

## Issues pendientes (no bloqueantes)

| Categoría | Issue | Prioridad |
|---|---|---|
| Performance | Chunk JS >500 kB — falta code-splitting | Baja (build) |
| Performance | Imágenes no optimizadas (logoLumen.png: 2.1 MB) | Media |
| Performance | Unused CSS/JS (Stripe cargado siempre) | Baja |
| SEO | `robots.txt` no válido o inexistente | Baja |

---

## Cómo reproducir la auditoría

```bash
# Construir la app
npm run build

# Iniciar servidor de preview
npx vite preview --port 4173

# En otra terminal, lanzar Lighthouse
npx lighthouse http://localhost:4173 \
  --output=json,html \
  --output-path=lighthouse/report-nueva \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --only-categories=accessibility,performance,best-practices,seo
```

Los reportes `.html` se pueden abrir directamente en el navegador.
