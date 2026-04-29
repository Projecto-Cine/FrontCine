import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/cartelera',     label: 'Cartelera',      icon: '🎟' },
  { to: '/merchandising', label: 'Merchandising',   icon: '🛍' },
  { to: '/dashboard',     label: 'Dashboard',       icon: '📊' },
  { to: '/usuarios',      label: 'Usuarios',        icon: '👤' },
  { to: '/peliculas',     label: 'Películas',       icon: '🎬' },
  { to: '/productos',     label: 'Productos',       icon: '📦' },
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
        gap: 10,
        minHeight: 72,
      }}>
        {!logoError ? (
          <img
            src="/logo.png"
            alt="Lumen Cinema"
            onError={() => setLogoError(true)}
            style={{ height: 44, objectFit: 'contain', maxWidth: 160 }}
          />
        ) : (
          <>
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', flexShrink: 0,
              boxShadow: 'var(--shadow-gold)',
            }}>🦁</div>
            <div>
              <div style={{
                fontWeight: 700,
                color: 'var(--accent)',
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
              }}>LUMEN CINEMA</div>
              <div style={{ fontSize: '0.65rem', color: '#5e5a50', letterSpacing: '0.1em' }}>
                SISTEMA DE GESTIÓN
              </div>
            </div>
          </>
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
              background: isActive
                ? 'var(--accent)'
                : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.88rem',
              transition: 'all 0.18s',
              textDecoration: 'none',
              letterSpacing: isActive ? '0.01em' : 0,
            })}
            onMouseEnter={e => {
              const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
              if (!isActive) {
                e.currentTarget.style.background = 'var(--accent-bg)'
                e.currentTarget.style.color = 'var(--accent)'
              }
            }}
            onMouseLeave={e => {
              const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
              if (!isActive) {
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
