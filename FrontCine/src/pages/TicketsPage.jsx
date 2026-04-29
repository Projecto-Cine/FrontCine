import { useState } from 'react'
import SeatMap from '../components/organisms/SeatMap'
import Button from '../components/atoms/Button'
import Badge from '../components/atoms/Badge'

const MOVIES = [
  {
    id: 1,
    title: 'El Legado del Tiempo',
    date: '28 Abr 2026',
    time: '19:30',
    room: 'Sala 1',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=100&h=150&fit=crop',
  },
  {
    id: 2,
    title: 'Noche en la Ciudad',
    date: '28 Abr 2026',
    time: '21:15',
    room: 'Sala 2',
    image: 'https://images.unsplash.com/photo-1533613220915-609f21a91335?w=100&h=150&fit=crop',
  },
]

const TICKET_TYPES = [
  { category: 'Niños (3-12 años)', price: 6, qty: 0 },
  { category: 'Adultos (12-65 años)', price: 9, qty: 2 },
  { category: 'Mayores (+65 años)', price: 6, qty: 0 },
]

export default function TicketsPage() {
  const [selectedMovie, setSelectedMovie] = useState(MOVIES[0])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [ticketTypes, setTicketTypes] = useState(TICKET_TYPES)
  const [email, setEmail] = useState('tu@email.com')

  const updateTicketQty = (idx, qty) => {
    const updated = [...ticketTypes]
    updated[idx].qty = Math.max(0, qty)
    setTicketTypes(updated)
  }

  const takenSeats = ['A1', 'A3', 'B2', 'B5', 'C1', 'C7']
  const subtotal = ticketTypes.reduce((sum, t) => sum + t.price * t.qty, 0)
  const discount = subtotal * 0.1 // 10% para clientes frecuentes
  const total = subtotal - discount

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {/* Header */}
        <h1 className="section-title" style={{ marginBottom: '2rem' }}>Compra de Entradas</h1>

        <div className="grid-2">
          {/* Left: Movie info & seats */}
          <div>
            {/* Movie Selector */}
            <div className="section">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '700', marginBottom: '1rem' }}>Seleccióna tu película</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {MOVIES.map((movie) => (
                  <div
                    key={movie.id}
                    className="card"
                    onClick={() => setSelectedMovie(movie)}
                    style={{
                      cursor: 'pointer',
                      border: selectedMovie.id === movie.id ? '2px solid var(--gold)' : '1px solid var(--border)',
                      padding: '1rem',
                      display: 'flex',
                      gap: '1rem',
                    }}
                  >
                    <img
                      src={movie.image}
                      alt={movie.title}
                      style={{ width: '80px', height: '120px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{movie.title}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '0.25rem' }}>
                        📅 {movie.date}
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '0.25rem' }}>
                        🕒 {movie.time}
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        📋 {movie.room}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seat Map */}
            <div className="section">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '700', marginBottom: '1.5rem' }}>Seleccióna tus asientos</h3>
              <SeatMap takenSeats={takenSeats} onSelectionChange={setSelectedSeats} maxSelect={8} />
            </div>
          </div>

          {/* Right: Ticket selection & summary */}
          <div>
            {/* Ticket Types */}
            <div className="section">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '700', marginBottom: '1.5rem' }}>Seleccióna tus entradas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {ticketTypes.map((ticket, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{ticket.category}</p>
                      <p style={{ color: 'var(--gold)', fontSize: 'var(--text-lg)', fontWeight: '700' }}>{ticket.price}€ por entrada</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={() => updateTicketQty(idx, ticket.qty - 1)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '4px',
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          color: 'var(--text-primary)', cursor: 'pointer', fontSize: 'var(--text-lg)',
                        }}
                      >
                        −
                      </button>
                      <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: '600' }}>{ticket.qty}</span>
                      <button
                        onClick={() => updateTicketQty(idx, ticket.qty + 1)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '4px',
                          background: 'var(--gold)', border: 'none',
                          color: '#000', cursor: 'pointer', fontSize: 'var(--text-lg)', fontWeight: 'bold',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="card" style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '700', marginBottom: '1.5rem' }}>Resumen de compra</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)}€</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', color: 'var(--green)' }}>
                    <span>Descuento 10% Cliente frecuente</span>
                    <span>-{discount.toFixed(2)}€</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontSize: 'var(--text-lg)', fontWeight: '700' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--gold)' }}>{total.toFixed(2)}€</span>
                </div>
              </div>

              {/* Email Confirmation */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Email para confirmación
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  style={{ marginBottom: '1rem' }}
                />
                <Button variant="gold" style={{ width: '100%' }}>
                  Finalizar compra
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
