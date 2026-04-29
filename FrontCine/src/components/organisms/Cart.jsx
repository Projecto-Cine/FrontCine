import { useCart } from '../../contexts/CartContext'
import Button from '../atoms/Button'

export default function Cart({ onClose }) {
  const { items, removeItem, updateQuantity, clearCart, total, count } = useCart()

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Carrito ({count})</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Cerrar carrito">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ color: 'var(--text-secondary)' }}>El carrito está vacío</p>
          </div>
        ) : (
          <>
            <ul style={styles.list}>
              {items.map((item) => (
                <li key={item.id} style={styles.item}>
                  <div style={styles.itemInfo}>
                    <p style={styles.itemName}>{item.name}</p>
                    <p style={styles.itemPrice}>{item.price?.toFixed(2)} €</p>
                  </div>
                  <div style={styles.itemControls}>
                    <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                    <span style={styles.qty}>{item.quantity}</span>
                    <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    <button style={styles.removeBtn} onClick={() => removeItem(item.id)} aria-label="Eliminar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div style={styles.footer}>
              <div style={styles.totalRow}>
                <span style={{ color: 'var(--text-secondary)' }}>Total</span>
                <span style={styles.totalValue}>{total.toFixed(2)} €</span>
              </div>
              <Button variant="gold" className="w-full" style={{ width: '100%', marginBottom: '0.5rem' }}>
                Finalizar compra
              </Button>
              <Button variant="ghost" onClick={clearCart} style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                Vaciar carrito
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
  },
  panel: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: '380px',
    background: '#1a1a1a', borderLeft: '1px solid #2a2a2a',
    display: 'flex', flexDirection: 'column',
    boxShadow: '-8px 0 24px rgba(0,0,0,0.5)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 1.5rem', borderBottom: '1px solid #2a2a2a',
  },
  title: { fontSize: 'var(--text-xl)', fontWeight: '700', color: 'var(--text-primary)' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-secondary)', padding: '0.25rem',
  },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  item: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.875rem', background: '#222', borderRadius: '8px', border: '1px solid #2a2a2a',
  },
  itemInfo: { flex: 1 },
  itemName: { fontWeight: '600', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', marginBottom: '0.25rem' },
  itemPrice: { color: '#c9a84c', fontWeight: '700', fontSize: 'var(--text-sm)' },
  itemControls: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  qtyBtn: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: '#2a2a2a', border: '1px solid #3a3a3a',
    color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  qty: { minWidth: '20px', textAlign: 'center', fontWeight: '600', color: 'var(--text-primary)' },
  removeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#e53e3e', padding: '0.25rem', marginLeft: '0.25rem',
  },
  footer: { padding: '1.25rem 1.5rem', borderTop: '1px solid #2a2a2a' },
  totalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1rem',
  },
  totalValue: { fontSize: 'var(--text-xl)', fontWeight: '700', color: '#c9a84c' },
}
