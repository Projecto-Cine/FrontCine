import { useTheme } from '../../context/ThemeContext'
import { useCart } from '../../context/CartContext'

export default function Header() {
  const { theme, toggleTheme, palette, setPalette, palettes } = useTheme()
  const { count } = useCart()

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 16,
      padding: '0 24px',
      height: 'var(--header-height)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      flexShrink: 0,
    }}>

      {/* ── Palette dots ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {palettes.map(p => (
          <button
            key={p.id}
            onClick={() => setPalette(p.id)}
            title={p.label}
            style={{
              width: palette === p.id ? 20 : 14,
              height: palette === p.id ? 20 : 14,
              borderRadius: '50%',
              background: p.color,
              border: palette === p.id
                ? `2px solid var(--text-primary)`
                : '2px solid transparent',
              outline: palette === p.id ? `2px solid ${p.color}` : 'none',
              outlineOffset: 2,
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* ── Divider ── */}
      <div style={{ width: 1, height: 22, background: 'var(--border-color)' }} />

      {/* ── Dark / Light toggle switch ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', userSelect: 'none' }}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </span>
        <div
          role="switch"
          aria-checked={theme === 'light'}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          style={{
            position: 'relative',
            width: 44,
            height: 24,
            borderRadius: 12,
            background: theme === 'light'
              ? 'var(--accent)'
              : 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'background 0.3s',
            flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute',
            top: 3,
            left: theme === 'light' ? 'calc(100% - 20px)' : 3,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: theme === 'light' ? '#fff' : 'var(--accent)',
            transition: 'left 0.3s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }} />
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ width: 1, height: 22, background: 'var(--border-color)' }} />

      {/* ── Cart button ── */}
      <button
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38,
          background: count > 0 ? 'var(--accent-bg)' : 'transparent',
          border: count > 0 ? '1px solid var(--accent)' : '1px solid var(--border-color)',
          borderRadius: 10,
          color: count > 0 ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        🛒
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: -5, right: -5,
            background: 'var(--accent)',
            color: '#000',
            fontSize: '0.6rem',
            fontWeight: 700,
            borderRadius: '50%',
            width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 6px var(--accent)',
          }}>{count}</span>
        )}
      </button>
    </header>
  )
}
