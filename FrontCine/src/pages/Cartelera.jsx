import { useState, useMemo, useCallback } from 'react'
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

/* Deterministic pseudo-random seat occupation based on session id */
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

/* ── Seat component ── */
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
        position: 'relative',
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

/* ── Full Seat Map view ── */
function SeatMapView({ sesion, onBack, onConfirm }) {
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

  const total = selectedSeats.size * sesion.precioEntrada
  const disponibles = sesion.aforo - sesion.entradasVendidas - selectedSeats.size

  return (
    <div>
      {/* ── Back + movie info ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 8, padding: '8px 14px',
            color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer',
            flexShrink: 0,
          }}
        >← Volver</button>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{sesion.pelicula.titulo}</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 2 }}>
            {formatDate(sesion.fecha)} · {sesion.hora} · {sesion.sala} · {formatPrice(sesion.precioEntrada)} / entrada
          </div>
        </div>
      </div>

      {/* ── Seat map container ── */}
      <div className="card" style={{ padding: '32px 24px', marginBottom: 24, overflowX: 'auto' }}>

        {/* Screen */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            height: 4,
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            width: '55%', margin: '0 auto 10px',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(196,163,90,0.4), 0 0 40px rgba(196,163,90,0.15)',
          }} />
          <span style={{
            fontSize: '0.68rem', letterSpacing: '0.2em',
            color: 'var(--text-muted)', fontWeight: 600,
          }}>PANTALLA</span>
        </div>

        {/* Column numbers */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{ width: 26, flexShrink: 0 }} />
          {Array.from({ length: cfg.cols }, (_, c) => (
            <span key={c} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              {c === aisleAfter + 1 && <span style={{ width: 18, display: 'inline-block' }} />}
              <span style={{
                width: 26, textAlign: 'center',
                fontSize: '0.6rem', color: 'var(--text-muted)',
                lineHeight: 1, marginBottom: 4, flexShrink: 0,
              }}>{c + 1}</span>
            </span>
          ))}
          <div style={{ width: 26, flexShrink: 0 }} />
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
          {Array.from({ length: cfg.rows }, (_, r) => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {/* Left label */}
              <span style={{
                width: 20, textAlign: 'center',
                fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600,
                flexShrink: 0,
              }}>{ROW_LABELS[r]}</span>

              {/* Seats */}
              {Array.from({ length: cfg.cols }, (_, c) => {
                const idx = r * cfg.cols + c
                const state = selectedSeats.has(idx) ? 'selected'
                  : occupiedSet.has(idx) ? 'occupied'
                  : 'free'
                return (
                  <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {c === aisleAfter + 1 && (
                      <span style={{ width: 18, display: 'inline-block', flexShrink: 0 }} />
                    )}
                    <Seat
                      state={state}
                      label={`${ROW_LABELS[r]}${c + 1}`}
                      onClick={() => toggle(idx)}
                    />
                  </span>
                )
              })}

              {/* Right label */}
              <span style={{
                width: 20, textAlign: 'center',
                fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600,
                flexShrink: 0,
              }}>{ROW_LABELS[r]}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', gap: 24, justifyContent: 'center',
          marginTop: 32, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Libre',         bg: 'transparent', border: 'rgba(196,163,90,0.4)' },
            { label: 'Seleccionado',  bg: 'var(--accent)', border: 'var(--accent)' },
            { label: 'Ocupado',       bg: '#1e1c18',       border: '#2e2b24' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span style={{
                width: 20, height: 16, borderRadius: '3px 3px 1px 1px',
                background: l.bg, border: `1.5px solid ${l.border}`,
                display: 'inline-block', flexShrink: 0,
                boxShadow: l.label === 'Seleccionado' ? '0 0 6px rgba(196,163,90,0.4)' : 'none',
              }} />
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

      {/* ── Selection summary bar ── */}
      {selectedSeats.size > 0 && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--accent)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          boxShadow: 'var(--shadow-gold)',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {selectedSeats.size} butaca{selectedSeats.size > 1 ? 's' : ''} seleccionada{selectedSeats.size > 1 ? 's' : ''}
            </div>
            <div style={{
              fontSize: '0.78rem', color: 'var(--text-secondary)',
              maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              Asientos: {seatLabels.join(', ')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>Total</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)' }}>
                {formatPrice(total)}
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 22px', fontSize: '0.9rem' }}
              onClick={() => onConfirm(selectedSeats, seatLabels)}
            >
              Confirmar compra
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Confirmation screen ── */
function ConfirmationView({ sesion, seatLabels, total, onBack }) {
  return (
    <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--accent-bg)', border: '2px solid var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem', margin: '0 auto 24px',
        boxShadow: 'var(--shadow-gold)',
      }}>✓</div>
      <h2 style={{ marginBottom: 8, fontSize: '1.3rem' }}>¡Entradas añadidas al carrito!</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
        <strong>{seatLabels.length} entrada{seatLabels.length > 1 ? 's' : ''}</strong> para <strong>{sesion.pelicula.titulo}</strong>
        <br />
        <span style={{ fontSize: '0.85rem' }}>
          {formatDate(sesion.fecha)} · {sesion.hora} · {sesion.sala}
        </span>
        <br />
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Asientos: {seatLabels.join(', ')}</span>
      </p>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 10, padding: '14px 20px', marginBottom: 28,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span style={{ color: 'var(--text-secondary)' }}>Total pagado</span>
        <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.1rem' }}>{formatPrice(total)}</span>
      </div>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={onBack}>
        Volver a la cartelera
      </button>
    </div>
  )
}

/* ── Movie card (groups sessions by movie) ── */
function MovieCard({ pelicula, sesiones, onSelect }) {
  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Poster */}
      <div style={{ position: 'relative', height: 310, flexShrink: 0, background: 'var(--bg-input)' }}>
        {pelicula.imagen ? (
          <img
            src={pelicula.imagen}
            alt={pelicula.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.currentTarget.parentElement.style.display = 'flex'; e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎬</div>
        )}
        {/* Gradient + badges */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0) 55%)',
          display: 'flex', alignItems: 'flex-end',
          padding: '12px 14px',
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-gray">{pelicula.genero}</span>
            {pelicula.clasificacion && pelicula.clasificacion !== 'TP' && (
              <span className="badge badge-accent">{pelicula.clasificacion}</span>
            )}
            {pelicula.duracion && (
              <span style={{
                fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>⏱ {pelicula.duracion} min</span>
            )}
          </div>
        </div>
      </div>

      {/* Info + sessions */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>{pelicula.titulo}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {sesiones.map(s => {
            const disponibles = s.aforo - s.entradasVendidas
            const agotado = disponibles === 0
            const pct = (s.entradasVendidas / s.aforo) * 100
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
                  borderRadius: 8,
                  cursor: agotado ? 'not-allowed' : 'pointer',
                  opacity: agotado ? 0.5 : 1,
                  transition: 'all 0.15s',
                  width: '100%',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!agotado) e.currentTarget.style.background = 'var(--accent-bg-hover)' }}
                onMouseLeave={e => { if (!agotado) e.currentTarget.style.background = 'var(--accent-bg)' }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--accent)' }}>{s.hora}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 8 }}>{s.sala}</span>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatDate(s.fecha)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: agotado ? 'var(--text-muted)' : 'var(--accent)' }}>
                    {agotado ? 'Agotado' : formatPrice(s.precioEntrada)}
                  </div>
                  {!agotado && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {disponibles} libres
                    </div>
                  )}
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
        <p>Selecciona una sesión para elegir tus butacas</p>
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
          {movieGroups.map(({ pelicula, sesiones: movieSesiones }) => (
            <MovieCard
              key={pelicula.id}
              pelicula={pelicula}
              sesiones={movieSesiones}
              onSelect={onSelect}
            />
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

  const [view, setView] = useState('list')          // 'list' | 'seats' | 'confirmed'
  const [selectedSesion, setSelectedSesion] = useState(null)
  const [confirmedSeats, setConfirmedSeats] = useState([])
  const [confirmedTotal, setConfirmedTotal] = useState(0)

  const sesionesConPelicula = useMemo(() =>
    sesiones
      .map(s => ({ ...s, pelicula: peliculas.find(p => p.id === s.peliculaId) }))
      .filter(s => s.pelicula)
      .sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`)),
    [sesiones, peliculas]
  )

  const handleSelect = (sesion) => {
    setSelectedSesion(sesion)
    setView('seats')
  }

  const handleConfirm = (seatsSet, seatLabels) => {
    const total = seatsSet.size * selectedSesion.precioEntrada
    addItem({
      id: `entrada-${selectedSesion.id}-${Date.now()}`,
      nombre: `Entrada: ${selectedSesion.pelicula.titulo}`,
      descripcion: `${formatDate(selectedSesion.fecha)} ${selectedSesion.hora} — ${selectedSesion.sala} [${seatLabels.join(', ')}]`,
      precio: selectedSesion.precioEntrada,
      categoria: 'Entrada',
    }, seatsSet.size)
    setConfirmedSeats(seatLabels)
    setConfirmedTotal(total)
    setView('confirmed')
  }

  const handleBack = () => {
    setView('list')
    setSelectedSesion(null)
    setConfirmedSeats([])
    setConfirmedTotal(0)
  }

  if (view === 'seats' && selectedSesion) {
    return (
      <SeatMapView
        sesion={selectedSesion}
        onBack={handleBack}
        onConfirm={handleConfirm}
      />
    )
  }

  if (view === 'confirmed' && selectedSesion) {
    return (
      <ConfirmationView
        sesion={selectedSesion}
        seatLabels={confirmedSeats}
        total={confirmedTotal}
        onBack={handleBack}
      />
    )
  }

  return <SessionList sesiones={sesionesConPelicula} onSelect={handleSelect} />
}
