# Auditoría Lighthouse — FrontCine

> Última actualización: 2026-05-13 | Rama: `dev`

---

## Resultados — Progresión completa

| Categoría | Baseline | Tras fixes a11y POS | Tras fixes Login | **Final (perf)** |
|---|---|---|---|---|
| **Accesibilidad** | 89 | 96 | **100** ✅ | **100** ✅ |
| **Best Practices** | 100 | 100 | 100 ✅ | **100** ✅ |
| **SEO** | 92 | 92 | 92 | **100** ✅ |
| **Performance** | 72 | 73 | 70 | **95** ✅ |

---

## Métricas de rendimiento (auditoría final)

| Métrica | Valor |
|---|---|
| First Contentful Paint | 2.4 s |
| Largest Contentful Paint | 2.4 s |
| Total Blocking Time | **0 ms** ✅ |
| Speed Index | 2.4 s |
| Cumulative Layout Shift | **0** ✅ |
| Time to Interactive | 2.4 s |

---

## Archivos de auditoría generados

| Archivo | Descripción | Score a11y | Score perf |
|---|---|---|---|
| `report-login.report.html/json` | Baseline (pre-fix) | 89 | 72 |
| `report-login-v2.report.html/json` | Tras fixes POS | 96 | 73 |
| `report-login-final.report.html/json` | Tras fixes Login | 100 | 70 |
| `report-performance-final.report.html/json` | **Auditoría final** | 100 | **95** |

---

## Ronda 1 — Fixes Accesibilidad POS (BoxOffice, Concession, Stripe)

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

---

## Ronda 2 — Fixes Login (detectados por Lighthouse a11y)

| Issue Lighthouse | Fix aplicado |
|---|---|
| `landmark-one-main` — Login sin `<main>` | `<div>` → `<main aria-label>` |
| `color-contrast` — `.brandSub`, `.label`, `.hint`, `.demoTitle` con ratio 3.44 | `var(--text-3)` → `var(--text-2)` (ratio ~5.9:1) |
| `target-size` — `.pwToggle` sin tamaño mínimo | `min-width/height: 28px` añadido |
| `label-content-name-mismatch` — `aria-label` redundante en botones demo | Eliminado (texto visible es suficiente) |

---

## Ronda 3 — Optimización de Performance

| Issue | Fix | Impacto |
|---|---|---|
| Bundle JS monolítico 888 kB | `React.lazy()` + `Suspense` en todas las páginas | 888 kB → chunks de 4–381 kB |
| Sin vendor splitting | `manualChunks` en `vite.config.js` (Rolldown fn) | Chunks cacheables por separado |
| `logoLumen.png`: 2.1 MB | Comprimido con `sharp-cli` → 87 kB PNG + 3.6 kB WebP | −96% tamaño imagen |
| Componentes servidos en WebP | `<picture>` + `<source type="image/webp">` en Login y Sidebar | Browsers modernos usan WebP |
| Sin `robots.txt` | Creado `public/robots.txt` | SEO 92 → 100 |
| Sin `@keyframes spin` global | Añadido en `index.css` para `PageLoader` | Spinner funcional |

### Distribución de chunks tras la optimización

| Chunk | Tamaño | Descripción |
|---|---|---|
| `vendor-charts` | 381 kB | recharts — carga lazy (solo Dashboard) |
| `vendor-react` | 220 kB | React + React DOM + React Router |
| `index` | 81 kB | App shell (Login, Layout, contextos) |
| `vendor-ui` | 32 kB | lucide-react + qrcode.react |
| Páginas individuales | 4–31 kB cada una | Carga bajo demanda |
| **Total inicial** | **~333 kB** | (vs. 888 kB monolítico) |

---

## Issues pendientes (lower priority)

| Categoría | Issue | Nota |
|---|---|---|
| Performance | FCP 2.4 s — podría bajar con preload del logo WebP | `<link rel="preload">` en index.html |
| Performance | recharts (381 kB) — considerar alternativa más ligera | Largo plazo |

---

## Cómo reproducir la auditoría

```bash
npm run build
npx vite preview --port 4173

npx lighthouse http://localhost:4173 \
  --output=json,html \
  --output-path=lighthouse/report-nueva \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --only-categories=accessibility,performance,best-practices,seo
```

Los reportes `.html` se abren directamente en el navegador.
