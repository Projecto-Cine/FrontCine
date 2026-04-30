import { NavLink } from 'react-router-dom'
import { useState } from 'react'

const NAV_ITEMS = [
  { to: '/cartelera',     label: 'Cartelera',      icon: '🎟' },
  { to: '/merchandising', label: 'Venta',           icon: '🍿' },
  { to: '/clientes',      label: 'Clientes',        icon: '👥' },
  { to: '/horarios',      label: 'Horarios',        icon: '🕐' },
  { to: '/peliculas',     label: 'Películas',       icon: '🎬' },
  { to: '/productos',     label: 'Productos',       icon: '📦' },
  { to: '/dashboard',     label: 'Dashboard',       icon: '📊' },
]

export default function Sidebar() {
  const [logoError, setLogoError] = useState(false)

  return (
    <aside style={{
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid #1e1c18',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '18px 16px',
        borderBottom: '1px solid #1e1c18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 72,
      }}>
        {!logoError ? (
          <img
            src="/logoLumen.png"
            alt="Lumen Cinema"
            onError={() => setLogoError(true)}
            style={{
              height: 52,
              objectFit: 'contain',
              maxWidth: 188,
              filter: 'drop-shadow(0 0 6px rgba(184,150,106,0.3))',
            }}
          />
        ) : (
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.88rem', letterSpacing: '0.06em' }}>
              LUMEN CINEMA
            </div>
            <div style={{ fontSize: '0.62rem', color: '#5a5040', letterSpacing: '0.12em' }}>
              SISTEMA DE GESTIÓN
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: '16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
      }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              color: isActive ? '#0e0d0a' : '#7a7060',
              background: isActive ? 'var(--accent)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.88rem',
              transition: 'all 0.18s',
              textDecoration: 'none',
            })}
            onMouseEnter={e => {
              if (e.currentTarget.getAttribute('aria-current') !== 'page') {
                e.currentTarget.style.background = 'var(--accent-bg)'
                e.currentTarget.style.color = 'var(--accent)'
              }
            }}
            onMouseLeave={e => {
              if (e.currentTarget.getAttribute('aria-current') !== 'page') {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#7a7060'
              }
            }}
          >
            <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid #1e1c18',
        fontSize: '0.68rem',
        color: '#3e3a30',
        letterSpacing: '0.08em',
        textAlign: 'center',
      }}>
        EST. 2026
      </div>
    </aside>
  )
}
