import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  {
    path: '/entradas',
    label: 'Cartelera',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: '/clientes',
    label: 'Clientes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/',
    label: 'Películas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    path: '/tienda',
    label: 'Merchandising',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
]

export default function Navbar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      {/* Toggle button */}
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        aria-label="Toggle sidebar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {collapsed
            ? <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
            : <><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></>
          }
        </svg>
      </button>

      {/* Logo */}
      <button className="sidebar-logo" onClick={() => navigate('/')}>
        <img
          src="/logo.png"
          alt="Foco Cines"
          className="sidebar-logo-img"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">FOCO CINES</span>
            <span className="sidebar-logo-sub">Multicine</span>
          </div>
        )}
      </button>

      {/* Nav items */}
      <div className="sidebar-nav">
        {NAV_ITEMS.map(({ path, label, icon }) => {
          const active = isActive(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`sidebar-nav-btn${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? label : undefined}
            >
              <span className="sidebar-nav-icon">{icon}</span>
              {!collapsed && <span className="sidebar-nav-label">{label}</span>}
            </button>
          )
        })}
      </div>

      {/* Admin info */}
      <div className="sidebar-admin">
        <div className="sidebar-admin-avatar">AD</div>
        {!collapsed && (
          <div className="sidebar-admin-text">
            <span className="sidebar-admin-name">Admin</span>
            <span className="sidebar-admin-email">admin@focoCines.com</span>
          </div>
        )}
      </div>
    </nav>
  )
}
