import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/formatters'

const CATEGORIAS = ['Todas', 'Bebida', 'Comida', 'Merchandising']

function ProductCard({ producto, onAddToCart }) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    onAddToCart(producto)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'relative', height: 200 }}>
        {producto.imagen ? (
          <img
            src={producto.imagen} alt={producto.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;background:var(--bg-input);display:flex;align-items:center;justify-content:center;font-size:2rem">🛍</div>' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🛍</div>
        )}
      </div>
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>{producto.nombre}</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 10, flex: 1 }}>{producto.descripcion}</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span className="badge badge-gray">{producto.categoria}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📦 Stock: {producto.stock}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>{formatPrice(producto.precio)}</span>
          <button
            className="btn btn-primary"
            disabled={producto.stock === 0}
            onClick={handleAdd}
            style={{ fontSize: '0.85rem' }}
          >
            {added ? '✓ Añadido' : producto.stock === 0 ? 'Agotado' : '🛒 Añadir'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Merchandising() {
  const { productos } = useData()
  const { addItem } = useCart()
  const [categoria, setCategoria] = useState('Todas')
  const [search, setSearch] = useState('')

  const filtrados = useMemo(() => {
    return productos.filter(p =>
      (categoria === 'Todas' || p.categoria === categoria) &&
      p.nombre.toLowerCase().includes(search.toLowerCase())
    )
  }, [productos, categoria, search])

  return (
    <div>
      <div className="page-header">
        <h1>Merchandising & Bebidas</h1>
        <p>Añade productos al carrito</p>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              style={{
                padding: '7px 16px',
                borderRadius: 20,
                border: categoria === cat ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                background: categoria === cat ? 'var(--accent)' : 'transparent',
                color: categoria === cat ? '#000' : 'var(--text-secondary)',
                fontWeight: categoria === cat ? 600 : 400,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >{cat}</button>
          ))}
        </div>
        <input
          className="form-input"
          placeholder="Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', maxWidth: 240 }}
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="empty-state">No hay productos disponibles</div>
      ) : (
        <div className="grid-cards">
          {filtrados.map(p => (
            <ProductCard key={p.id} producto={p} onAddToCart={(prod) => addItem(prod, 1)} />
          ))}
        </div>
      )}
    </div>
  )
}
