import { useState } from 'react'

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const COLS = 10

function generateSeats(takenIds = []) {
  return ROWS.map((row) => ({
    row,
    seats: Array.from({ length: COLS }, (_, i) => {
      const id = `${row}${i + 1}`
      return {
        id,
        label: `${row}${i + 1}`,
        taken: takenIds.includes(id),
      }
    }),
  }))
}

export default function SeatMap({ takenSeats = [], onSelectionChange, maxSelect = 8 }) {
  const [selected, setSelected] = useState([])
  const rows = generateSeats(takenSeats)

  const toggle = (seat) => {
    if (seat.taken) return
    setSelected((prev) => {
      const next = prev.includes(seat.id)
        ? prev.filter((s) => s !== seat.id)
        : prev.length < maxSelect
          ? [...prev, seat.id]
          : prev
      onSelectionChange?.(next)
      return next
    })
  }

  const getColor = (seat) => {
    if (seat.taken) return '#3a1a1a'
    if (selected.includes(seat.id)) return '#c9a84c'
    return '#2a2a2a'
  }

  const getBorder = (seat) => {
    if (seat.taken) return '#5a2a2a'
    if (selected.includes(seat.id)) return '#c9a84c'
    return '#3a3a3a'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      {/* Screen */}
      <div style={{
        width: '80%', height: '6px', background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
        borderRadius: '3px', marginBottom: '1.5rem', opacity: 0.7,
      }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: '1rem', letterSpacing: '0.1em' }}>
        PANTALLA
      </p>

      {rows.map(({ row, seats }) => (
        <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '20px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: '600' }}>
            {row}
          </span>
          {seats.map((seat) => (
            <button
              key={seat.id}
              onClick={() => toggle(seat)}
              disabled={seat.taken}
              title={seat.label}
              style={{
                width: '32px', height: '28px', borderRadius: '4px 4px 6px 6px',
                background: getColor(seat), border: `1px solid ${getBorder(seat)}`,
                cursor: seat.taken ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
                fontSize: '0', // hide any text
              }}
            />
          ))}
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
        {[
          { color: '#2a2a2a', border: '#3a3a3a', label: 'Libre' },
          { color: '#c9a84c', border: '#c9a84c', label: 'Seleccionado' },
          { color: '#3a1a1a', border: '#5a2a2a', label: 'Ocupado' },
        ].map(({ color, border, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '14px', background: color, border: `1px solid ${border}`, borderRadius: '3px' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>{label}</span>
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <p style={{ marginTop: '0.75rem', color: '#c9a84c', fontWeight: '600', fontSize: 'var(--text-sm)' }}>
          Seleccionados: {selected.join(', ')}
        </p>
      )}
    </div>
  )
}
