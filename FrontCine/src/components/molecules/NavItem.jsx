import { useNavigate, useLocation } from 'react-router-dom'

export default function NavItem({ path, label, icon }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <button
      onClick={() => navigate(path)}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
        background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0.75rem',
        borderRadius: '10px', minWidth: '72px', transition: 'all 200ms ease',
      }}
    >
      <span style={{
        width: '40px', height: '40px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isActive ? 'rgba(201,168,76,0.18)' : 'transparent',
        color: isActive ? '#c9a84c' : '#9a9a9a',
        transition: 'all 200ms ease',
      }}>
        {icon}
      </span>
      <span style={{
        fontSize: '0.625rem', fontWeight: '600',
        color: isActive ? '#c9a84c' : '#9a9a9a',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </button>
  )
}
