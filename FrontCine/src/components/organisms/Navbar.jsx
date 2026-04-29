import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Películas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    ),
  },
  {
    path: '/entradas',
    label: 'Entradas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <line x1="9" y1="3" x2="9" y2="21" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    path: '/tienda',
    label: 'Tienda',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    path: '/clientes',
    label: 'Clientes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav style={styles.navbar}>
      {/* Logo */}
      <button style={styles.logoBtn} onClick={() => navigate('/')}>
        <img
          src="/claroOscuro.png"
          alt="Claroscuro Cine"
          style={styles.logoImg}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      </button>

      {/* Nav items */}
      <div style={styles.navItems}>
        {NAV_ITEMS.map(({ path, label, icon }) => {
          const active = isActive(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                ...styles.navBtn,
                ...(active ? styles.navBtnActive : {}),
              }}
              title={label}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <span style={{
                ...styles.iconCircle,
                ...(active ? styles.iconCircleActive : {}),
              }}>
                {icon}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

const styles = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: '80px',
    background: '#111111',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
  },
  logoBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    borderRadius: '6px',
    transition: 'opacity 200ms ease',
    height: '100%',
  },
  logoImg: {
    height: '76px',
    width: 'auto',
    objectFit: 'contain',
    display: 'block',
  },
  navItems: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    transition: 'all 200ms ease',
  },
  navBtnActive: {},
  iconCircle: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9a9a9a',
    transition: 'all 200ms ease',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid transparent',
  },
  iconCircleActive: {
    background: 'rgba(201, 168, 76, 0.18)',
    color: '#c9a84c',
    border: '1px solid rgba(201, 168, 76, 0.3)',
    boxShadow: '0 0 14px rgba(201, 168, 76, 0.15)',
  },
}
