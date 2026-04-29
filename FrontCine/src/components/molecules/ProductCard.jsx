import Badge from '../atoms/Badge'
import Button from '../atoms/Button'
import { useCart } from '../../contexts/CartContext'

export default function ProductCard({ product }) {
  const { addItem } = useCart()

  return (
    <div className="card">
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
        />
      )}
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '700', marginBottom: '0.5rem' }}>{product.name}</h3>
      {product.category && <Badge color="teal" className="mb-3">{product.category}</Badge>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
        <span className="gold" style={{ fontWeight: '700', fontSize: 'var(--text-lg)' }}>
          {product.price?.toFixed(2)} €
        </span>
        <Button variant="outline-gold" size="sm" onClick={() => addItem(product)}>
          Añadir
        </Button>
      </div>
    </div>
  )
}
