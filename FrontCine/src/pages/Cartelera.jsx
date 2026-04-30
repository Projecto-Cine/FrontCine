import { useState, useMemo, useCallback, useEffect } from 'react'
import QRCode from 'qrcode'
import { useData } from '../context/DataContext'
import { useCart } from '../context/CartContext'
import { formatPrice, formatDate } from '../utils/formatters'

/* ── Sala layout config ── */
const SALA_CONFIG = {
  'Sala 1':   { cols: 12, rows: 10 },
  'Sala 2':   { cols: 10, rows: 10 },
  'Sala 3':   { cols: 10, rows: 9  },
  'Sala VIP': { cols: 8,  rows: 6  },
}
const DEFAULT_CONFIG = { cols: 10, rows: 10 }
const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const DESCUENTOS_PCT = {
  'Estudiante':       20,
  'Jubilado':         30,
  'Carné Joven':      15,
  'Familia Numerosa': 25,
  'Socio':            20,
}

function buildOccupiedSet(sesionId, entradasVendidas, total) {
  const indices = Array.from({ length: total }, (_, i) => i)
  let seed = (sesionId * 48271) >>> 0
  for (let i = indices.length - 1; i > 0; i--) {
    seed = ((seed * 1664525) + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return new Set(indices.slice(0, Math.min(entradasVendidas, total)))
}

/* ── Seat ── */
function Seat({ state, label, onClick }) {
  const colors = {
    free:     { bg: 'transparent',  border: 'rgba(196,163,90,0.35)', cursor: 'pointer'     },
    selected: { bg: 'var(--accent)', border: 'var(--accent)',         cursor: 'pointer'     },
    occupied: { bg: '#1e1c18',       border: '#2e2b24',               cursor: 'not-allowed' },
  }
  const c = colors[state]
  return (
    <button
      onClick={onClick}
      disabled={state === 'occupied'}
      title={label}
      style={{
        width: 26, height: 22,
        borderRadius: '4px 4px 2px 2px',
        border: `1.5px solid ${c.border}`,
        background: c.bg,
        cursor: c.cursor,
        padding: 0,
        transition: 'all 0.12s',
        flexShrink: 0,
        boxShadow: state === 'selected' ? '0 0 8px rgba(196,163,90,0.5)' : 'none',
      }}
      onMouseEnter={e => {
        if (state === 'free') {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.background = 'rgba(196,163,90,0.2)'
        }
      }}
      onMouseLeave={e => {
        if (state === 'free') {
          e.currentTarget.style.borderColor = 'rgba(196,163,90,0.35)'
          e.currentTarget.style.background = 'transparent'
        }
      }}
    />
  )
}

/* ── Seat map ── */
function SeatMapView({ sesion, onBack, onContinue }) {
  const cfg = SALA_CONFIG[sesion.sala] || DEFAULT_CONFIG
  const totalSeats = cfg.rows * cfg.cols
  const aisleAfter = Math.floor(cfg.cols / 2) - 1

  const occupiedSet = useMemo(
    () => buildOccupiedSet(sesion.id, sesion.entradasVendidas, totalSeats),
    [sesion.id, sesion.entradasVendidas, totalSeats]
  )
  const [selectedSeats, setSelectedSeats] = useState(new Set())

  const toggle = useCallback((idx) => {
    if (occupiedSet.has(idx)) return
    setSelectedSeats(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }, [occupiedSet])

  const seatLabels = [...selectedSeats]
    .sort((a, b) => a - b)
    .map(idx => `${ROW_LABELS[Math.floor(idx / cfg.cols)]}${(idx % cfg.cols) + 1}`)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-input)', border: '1px solid var(--border-color)',
            borderRadius: 8, padding: '8px 14px',
            color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0,
          }}
        >← Volver</button>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{sesion.pelicula.titulo}</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 2 }}>
            {formatDate(sesion.fecha)} · {sesion.hora} · {sesion.sala} · {formatPrice(sesion.precioEntrada)} / entrada
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '32px 24px', marginBottom: 24, overflowX: 'auto' }}>
        {/* Screen */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            height: 4,
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            width: '55%', margin: '0 auto 10px', borderRadius: '50%',
            boxShadow: '0 0 20px rgba(196,163,90,0.4), 0 0 40px rgba(196,163,90,0.15)',
          }} />
          <span style={{ fontSize: '0.68rem', letterSpacing: '0.2em', color: 'var(--text-muted)', fontWeight: 600 }}>PANTALLA</span>
        </div>

        {/* Col numbers */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{ width: 26, flexShrink: 0 }} />
          {Array.from({ length: cfg.cols }, (_, c) => (
            <span key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {c === aisleAfter + 1 && <span style={{ width: 18, display: 'inline-block' }} />}
              <span style={{ width: 26, textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1, marginBottom: 4, flexShrink: 0 }}>{c + 1}</span>
            </span>
          ))}
          <div style={{ width: 26, flexShrink: 0 }} />
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
          {Array.from({ length: cfg.rows }, (_, r) => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 20, textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{ROW_LABELS[r]}</span>
              {Array.from({ length: cfg.cols }, (_, c) => {
                const idx = r * cfg.cols + c
                const state = selectedSeats.has(idx) ? 'selected' : occupiedSet.has(idx) ? 'occupied' : 'free'
                return (
                  <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {c === aisleAfter + 1 && <span style={{ width: 18, display: 'inline-block', flexShrink: 0 }} />}
                    <Seat state={state} label={`${ROW_LABELS[r]}${c + 1}`} onClick={() => toggle(idx)} />
                  </span>
                )
              })}
              <span style={{ width: 20, textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{ROW_LABELS[r]}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
          {[
            { label: 'Libre',        bg: 'transparent',   border: 'rgba(196,163,90,0.4)' },
            { label: 'Seleccionado', bg: 'var(--accent)', border: 'var(--accent)' },
            { label: 'Ocupado',      bg: '#1e1c18',        border: '#2e2b24' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span style={{ width: 20, height: 16, borderRadius: '3px 3px 1px 1px', background: l.bg, border: `1.5px solid ${l.border}`, display: 'inline-block', flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>

        {/* Availability bar */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            {sesion.entradasVendidas} ocupadas · {sesion.aforo - sesion.entradasVendidas} libres · {sesion.aforo} total
          </div>
          <div style={{ height: 5, background: 'var(--bg-input)', borderRadius: 3, maxWidth: 300, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(sesion.entradasVendidas / sesion.aforo) * 100}%`,
              background: sesion.entradasVendidas / sesion.aforo > 0.8 ? 'var(--danger)' : 'var(--accent)',
              borderRadius: 3, transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </div>

      {/* Summary bar */}
      {selectedSeats.size > 0 && (
        <div style={{
          position: 'sticky', bottom: 0,
          background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 12,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          boxShadow: 'var(--shadow-gold)', flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {selectedSeats.size} butaca{selectedSeats.size > 1 ? 's' : ''} seleccionada{selectedSeats.size > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Asientos: {seatLabels.join(', ')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>Subtotal</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)' }}>
                {formatPrice(selectedSeats.size * sesion.precioEntrada)}
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 22px', fontSize: '0.9rem' }}
              onClick={() => onContinue(selectedSeats, seatLabels)}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Client step ── */
function ClientStep({ sesion, seatsSet, seatLabels, onConfirm, onBack }) {
  const { clientes } = useData()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const results = useMemo(() => {
    if (search.length < 2) return []
    const q = search.toLowerCase()
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) || c.telefono?.includes(search)
    ).slice(0, 6)
  }, [clientes, search])

  const descuentoPct = selected?.tipoDescuento ? (DESCUENTOS_PCT[selected.tipoDescuento] || 0) : 0
  const precioBase   = seatsSet.size * sesion.precioEntrada
  const descuentoAmt = precioBase * (descuentoPct / 100)
  const total        = precioBase - descuentoAmt

  const selectCliente = (c) => {
    setSelected(c)
    setSearch(c.nombre)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-input)', border: '1px solid var(--border-color)',
            borderRadius: 8, padding: '8px 14px',
            color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0,
          }}
        >← Volver</button>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{sesion.pelicula.titulo}</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 2 }}>
            {formatDate(sesion.fecha)} · {sesion.hora} · {sesion.sala}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Left: client search */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 6, fontSize: '1rem', fontWeight: 600 }}>Identificar cliente</h3>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            Busca al cliente para aplicar descuentos. Si no está registrado, continúa sin seleccionar.
          </p>

          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              style={{ width: '100%', paddingRight: selected ? 36 : 14 }}
              placeholder="Nombre o teléfono..."
              value={search}
              onChange={e => { setSearch(e.target.value); if (selected) setSelected(null) }}
            />
            {selected && (
              <button
                onClick={() => { setSelected(null); setSearch('') }}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '1rem',
                }}
              >✕</button>
            )}
          </div>

          {/* Search results */}
          {!selected && results.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectCliente(c)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.nombre}</div>
                    {c.telefono && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.telefono}</div>}
                  </div>
                  <span className={`badge ${c.tipoDescuento ? 'badge-success' : 'badge-gray'}`}>
                    {c.tipoDescuento || 'Sin dto.'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!selected && search.length >= 2 && results.length === 0 && (
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: 10 }}>
              No se encontró ningún cliente. Continuará sin descuento.
            </p>
          )}

          {/* Selected client confirmation */}
          {selected && (
            <div style={{
              marginTop: 14, padding: '14px 16px',
              background: 'var(--accent-bg)', border: '1px solid var(--border-accent)',
              borderRadius: 8,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>✓ {selected.nombre}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {selected.tipoDescuento
                  ? <>Descuento <strong>{selected.tipoDescuento}</strong> — {descuentoPct}% de descuento aplicado</>
                  : 'Sin descuento asociado'}
              </div>
              {selected.telefono && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>📞 {selected.telefono}</div>
              )}
            </div>
          )}

          {!selected && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Sin cliente seleccionado — se aplicará precio sin descuento.
              </p>
            </div>
          )}
        </div>

        {/* Right: price summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>Resumen de compra</h3>

            {/* Seats */}
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Asientos: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{seatLabels.join(', ')}</span>
            </div>

            {/* Price rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{seatsSet.size} × {formatPrice(sesion.precioEntrada)}</span>
                <span>{formatPrice(precioBase)}</span>
              </div>
              {descuentoPct > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--success)' }}>Dto. {selected?.tipoDescuento} ({descuentoPct}%)</span>
                  <span style={{ color: 'var(--success)' }}>−{formatPrice(descuentoAmt)}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border-color)', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent)' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
            onClick={() => onConfirm(selected, descuentoPct, precioBase, total)}
          >
            Confirmar y Cobrar {formatPrice(total)}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Print helper ── */
function buildPrintHTML({ sesion, seatLabels, cliente, descuentoPct, precioBase, total, ticketCode, qrDataUrl }) {
  const descuentoAmt = precioBase - total
  const numEntradas  = seatLabels.length

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Ticket ${ticketCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; background: #fff; color: #1a1208; display: flex; justify-content: center; padding: 20px; }
    .ticket { width: 320px; border: 2px solid #1a1208; }
    .header { background: #1a1208; color: #B8966A; text-align: center; padding: 18px 16px; }
    .header h1 { font-size: 22px; letter-spacing: 0.15em; margin-bottom: 4px; }
    .header p  { font-size: 10px; letter-spacing: 0.3em; opacity: 0.7; }
    .body { padding: 20px; }
    .movie { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 6px; line-height: 1.3; }
    .session { font-size: 11px; color: #5a4a2a; text-align: center; margin-bottom: 16px; }
    .divider { border: none; border-top: 1px dashed #9a8a6a; margin: 14px 0; }
    .row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
    .label { color: #7a6a4a; }
    .value { font-weight: bold; }
    .seats { font-size: 12px; margin-bottom: 6px; }
    .seats .label { color: #7a6a4a; margin-bottom: 3px; }
    .seats .value { word-break: break-all; }
    .discount { color: #2d7a4f; }
    .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 8px; }
    .total-amt { color: #8A6E4E; }
    .qr-section { text-align: center; padding: 16px 0 8px; }
    .qr-section img { width: 160px; height: 160px; }
    .code { font-size: 10px; color: #7a6a4a; letter-spacing: 0.12em; margin-top: 6px; }
    .footer { background: #f5f0e8; text-align: center; padding: 10px; font-size: 9px; color: #7a6a4a; letter-spacing: 0.1em; border-top: 1px dashed #9a8a6a; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>LUMEN CINEMA</h1>
      <p>ENTRADA · TAQUILLA</p>
    </div>
    <div class="body">
      <div class="movie">${sesion.pelicula.titulo}</div>
      <div class="session">${formatDate(sesion.fecha)} &nbsp;·&nbsp; ${sesion.hora} &nbsp;·&nbsp; ${sesion.sala}</div>
      <hr class="divider">
      <div class="seats">
        <div class="label">ASIENTOS</div>
        <div class="value">${seatLabels.join(' · ')}</div>
      </div>
      <hr class="divider">
      ${cliente ? `<div class="row"><span class="label">CLIENTE</span><span class="value">${cliente.nombre}</span></div>` : ''}
      <div class="row"><span class="label">ENTRADAS</span><span class="value">${numEntradas} × ${formatPrice(sesion.precioEntrada)}</span></div>
      <div class="row"><span class="label">SUBTOTAL</span><span class="value">${formatPrice(precioBase)}</span></div>
      ${descuentoPct > 0 ? `<div class="row discount"><span class="label">DTO. ${cliente?.tipoDescuento?.toUpperCase()} (${descuentoPct}%)</span><span class="value">−${formatPrice(precioBase - total)}</span></div>` : ''}
      <div class="total-row"><span>TOTAL</span><span class="total-amt">${formatPrice(total)}</span></div>
      <hr class="divider">
      <div class="qr-section">
        ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Entrada">` : ''}
        <div class="code">Código: ${ticketCode}</div>
      </div>
    </div>
    <div class="footer">PRESENTE ESTE TICKET EN LA ENTRADA · LUMEN CINEMA EST. 2026</div>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`
}

/* ── Confirmation view ── */
function ConfirmationView({ sesion, seatLabels, cliente, descuentoPct, precioBase, total, ticketCode, onBack }) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const descuentoAmt = precioBase - total

  const qrContent = [
    'LUMEN CINEMA',
    sesion.pelicula.titulo,
    `${sesion.sala} · ${sesion.fecha} · ${sesion.hora}`,
    `Asientos: ${seatLabels.join(', ')}`,
    `Total: ${formatPrice(total)}`,
    `Código: ${ticketCode}`,
  ].join('\n')

  useEffect(() => {
    QRCode.toDataURL(qrContent, { width: 200, margin: 1, color: { dark: '#2c1a0a', light: '#ffffff' } })
      .then(setQrDataUrl)
  }, [qrContent])

  const handlePrint = () => {
    const html = buildPrintHTML({ sesion, seatLabels, cliente, descuentoPct, precioBase, total, ticketCode, qrDataUrl })
    const win = window.open('', '_blank', 'width=420,height=750')
    win.document.write(html)
    win.document.close()
  }

  return (
    <div style={{ maxWidth: 460, margin: '40px auto' }}>
      {/* Success icon */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--accent-bg)', border: '2px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', margin: '0 auto 14px',
          boxShadow: 'var(--shadow-gold)',
        }}>✓</div>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 4 }}>¡Venta completada!</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Entrega el ticket al cliente</p>
      </div>

      {/* Ticket card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Cinema header */}
        <div style={{
          background: 'var(--bg-sidebar)',
          padding: '18px 24px', textAlign: 'center',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{ fontWeight: 700, letterSpacing: '0.15em', color: 'var(--accent)', fontSize: '1rem' }}>LUMEN CINEMA</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.25em', marginTop: 2 }}>ENTRADA · TAQUILLA</div>
        </div>

        {/* Movie info */}
        <div style={{ padding: '20px 24px', borderBottom: '1px dashed var(--border-color)' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6, textAlign: 'center' }}>
            {sesion.pelicula.titulo}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {formatDate(sesion.fecha)} · {sesion.hora} · {sesion.sala}
          </div>
          <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Asientos: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{seatLabels.join(' · ')}</span>
          </div>
        </div>

        {/* Price breakdown */}
        <div style={{ padding: '16px 24px', borderBottom: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cliente && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cliente</span>
              <span style={{ fontWeight: 600 }}>{cliente.nombre}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{seatLabels.length} entrada{seatLabels.length > 1 ? 's' : ''}</span>
            <span>{formatPrice(precioBase)}</span>
          </div>
          {descuentoPct > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--success)' }}>Dto. {cliente?.tipoDescuento} ({descuentoPct}%)</span>
              <span style={{ color: 'var(--success)' }}>−{formatPrice(descuentoAmt)}</span>
            </div>
          )}
          <div style={{ height: 1, background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem' }}>
            <span>Total cobrado</span>
            <span style={{ color: 'var(--accent)' }}>{formatPrice(total)}</span>
          </div>
        </div>

        {/* QR */}
        <div style={{ padding: '20px 24px', textAlign: 'center', borderBottom: '1px dashed var(--border-color)' }}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR entrada" style={{ width: 160, height: 160, borderRadius: 8, background: '#fff', padding: 6 }} />
          ) : (
            <div style={{ width: 160, height: 160, background: 'var(--bg-input)', borderRadius: 8, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Generando QR...
            </div>
          )}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 10 }}>
            {ticketCode}
          </div>
        </div>

        {/* Footer note */}
        <div style={{ padding: '12px 24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
          Presente este ticket en la entrada de sala
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
          onClick={handlePrint}
          disabled={!qrDataUrl}
        >
          🖨 Imprimir Ticket
        </button>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
          onClick={onBack}
        >
          Nueva Venta
        </button>
      </div>
    </div>
  )
}

/* ── Movie card ── */
function MovieCard({ pelicula, sesiones, onSelect }) {
  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 310, flexShrink: 0, background: 'var(--bg-input)' }}>
        {pelicula.imagen ? (
          <img
            src={pelicula.imagen}
            alt={pelicula.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎬</div>
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0) 55%)',
          display: 'flex', alignItems: 'flex-end', padding: '12px 14px', pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-gray">{pelicula.genero}</span>
            {pelicula.clasificacion && pelicula.clasificacion !== 'TP' && (
              <span className="badge badge-accent">{pelicula.clasificacion}</span>
            )}
            {pelicula.duracion && (
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 3 }}>⏱ {pelicula.duracion} min</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>{pelicula.titulo}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {sesiones.map(s => {
            const disponibles = s.aforo - s.entradasVendidas
            const agotado = disponibles === 0
            return (
              <button
                key={s.id}
                disabled={agotado}
                onClick={() => !agotado && onSelect(s)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: agotado ? 'var(--bg-input)' : 'var(--accent-bg)',
                  border: `1px solid ${agotado ? 'var(--border-color)' : 'var(--border-accent)'}`,
                  borderRadius: 8, cursor: agotado ? 'not-allowed' : 'pointer',
                  opacity: agotado ? 0.5 : 1, transition: 'all 0.15s', width: '100%', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!agotado) e.currentTarget.style.background = 'var(--accent-bg-hover)' }}
                onMouseLeave={e => { if (!agotado) e.currentTarget.style.background = 'var(--accent-bg)' }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--accent)' }}>{s.hora}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 8 }}>{s.sala}</span>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(s.fecha)}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: agotado ? 'var(--text-muted)' : 'var(--accent)' }}>
                    {agotado ? 'Agotado' : formatPrice(s.precioEntrada)}
                  </div>
                  {!agotado && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{disponibles} libres</div>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Session list ── */
function SessionList({ sesiones, onSelect }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    sesiones.filter(s => s.pelicula.titulo.toLowerCase().includes(search.toLowerCase())),
    [sesiones, search]
  )

  const movieGroups = useMemo(() => {
    const groups = {}
    filtered.forEach(s => {
      if (!groups[s.peliculaId]) groups[s.peliculaId] = { pelicula: s.pelicula, sesiones: [] }
      groups[s.peliculaId].sesiones.push(s)
    })
    return Object.values(groups)
  }, [filtered])

  return (
    <div>
      <div className="page-header">
        <h1>Cartelera</h1>
        <p>Selecciona una sesión para elegir butacas</p>
      </div>
      <div style={{ marginBottom: 28 }}>
        <input
          className="form-input"
          style={{ maxWidth: 400 }}
          placeholder="Buscar película..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {movieGroups.length === 0 ? (
        <div className="empty-state">No hay sesiones disponibles</div>
      ) : (
        <div className="grid-cards" style={{ gap: 24 }}>
          {movieGroups.map(({ pelicula, sesiones: s }) => (
            <MovieCard key={pelicula.id} pelicula={pelicula} sesiones={s} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function Cartelera() {
  const { peliculas, sesiones } = useData()
  const { addItem } = useCart()

  const [view, setView] = useState('list')           // 'list' | 'seats' | 'client' | 'confirmed'
  const [selectedSesion, setSelectedSesion] = useState(null)
  const [pendingSeats, setPendingSeats] = useState(null)   // { seatsSet, seatLabels }
  const [ticketInfo, setTicketInfo] = useState(null)       // { cliente, descuentoPct, precioBase, total, ticketCode }

  const sesionesConPelicula = useMemo(() =>
    sesiones
      .map(s => ({ ...s, pelicula: peliculas.find(p => p.id === s.peliculaId) }))
      .filter(s => s.pelicula)
      .sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`)),
    [sesiones, peliculas]
  )

  const handleSelectSesion = (sesion) => {
    setSelectedSesion(sesion)
    setView('seats')
  }

  const handleSeatsContinue = (seatsSet, seatLabels) => {
    setPendingSeats({ seatsSet, seatLabels })
    setView('client')
  }

  const handleClientConfirm = (cliente, descuentoPct, precioBase, total) => {
    const ticketCode = `LMN-${Date.now().toString(36).toUpperCase().slice(-8)}`
    const precioUnitario = total / pendingSeats.seatsSet.size

    addItem({
      id: `entrada-${selectedSesion.id}-${Date.now()}`,
      nombre: `Entrada: ${selectedSesion.pelicula.titulo}`,
      descripcion: `${formatDate(selectedSesion.fecha)} ${selectedSesion.hora} — ${selectedSesion.sala} [${pendingSeats.seatLabels.join(', ')}]${descuentoPct > 0 ? ` — dto. ${descuentoPct}%` : ''}`,
      precio: precioUnitario,
      categoria: 'Entrada',
    }, pendingSeats.seatsSet.size)

    setTicketInfo({ cliente, descuentoPct, precioBase, total, ticketCode })
    setView('confirmed')
  }

  const handleBack = () => {
    setView('list')
    setSelectedSesion(null)
    setPendingSeats(null)
    setTicketInfo(null)
  }

  const handleBackToSeats = () => {
    setPendingSeats(null)
    setView('seats')
  }

  if (view === 'seats' && selectedSesion) {
    return (
      <SeatMapView
        sesion={selectedSesion}
        onBack={handleBack}
        onContinue={handleSeatsContinue}
      />
    )
  }

  if (view === 'client' && selectedSesion && pendingSeats) {
    return (
      <ClientStep
        sesion={selectedSesion}
        seatsSet={pendingSeats.seatsSet}
        seatLabels={pendingSeats.seatLabels}
        onConfirm={handleClientConfirm}
        onBack={handleBackToSeats}
      />
    )
  }

  if (view === 'confirmed' && selectedSesion && ticketInfo) {
    return (
      <ConfirmationView
        sesion={selectedSesion}
        seatLabels={pendingSeats.seatLabels}
        cliente={ticketInfo.cliente}
        descuentoPct={ticketInfo.descuentoPct}
        precioBase={ticketInfo.precioBase}
        total={ticketInfo.total}
        ticketCode={ticketInfo.ticketCode}
        onBack={handleBack}
      />
    )
  }

  return <SessionList sesiones={sesionesConPelicula} onSelect={handleSelectSesion} />
}
