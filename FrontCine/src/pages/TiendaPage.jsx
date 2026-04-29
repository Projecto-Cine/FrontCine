import { useState } from 'react'
import ProductCard from '../components/molecules/ProductCard'
import Cart from '../components/organisms/Cart'
import Button from '../components/atoms/Button'
import { useCart } from '../contexts/CartContext'

const PRODUCTS = [
  {
    id: 1,
    name: 'Palomitas Grandes',
    category: 'Comida',
    price: 5.50,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=300&h=200&fit=crop',
  },
  {
    id: 2,
    name: 'Refresco XL',
    category: 'Bebida',
    price: 4.00,
    image: 'https://images.unsplash.com/photo-1554866585-a9e3b09f0e8c?w=300&h=200&fit=crop',
  },
  {
    id: 3,
    name: 'Nachos con Queso',
    category: 'Comida',
    price: 6.50,
    image: 'https://images.unsplash.com/photo-1599599810694-b5ac1dd66f48?w=300&h=200&fit=crop',
  },
  {
    id: 4,
    name: 'Hot Dog Premium',
    category: 'Comida',
    price: 7.50,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561242?w=300&h=200&fit=crop',
  },
  {
    id: 5,
    name: 'Dulces Surtidos',
    category: 'Dulces',
    price: 3.50,
    image: 'https://images.unsplash.com/photo-1599599810694-b5ac1dd66f48?w=300&h=200&fit=crop',
  },
  {
    id: 6,
    name: 'Cerveza Premium',
    category: 'Bebida',
    price: 5.00,
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=300&h=200&fit=crop',
  },
  {
    id: 7,
    name: 'Chocolatina Doble',
    category: 'Dulces',
    price: 2.50,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop',
  },
  {
    id: 8,
    name: 'Palomitas + Bebida',
    category: 'Combo',
    price: 8.50,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=300&h=200&fit=crop',
  },
]

const CATEGORIES = ['Todo', 'Comida', 'Bebida', 'Dulces', 'Combo']

export default function TiendaPage() {
  const [showCart, setShowCart] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Todo')
  const { count } = useCart()

  const filtered = selectedCategory === 'Todo' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === selectedCategory)

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {/* Header */}
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 className="section-title">Tienda & Cafetería</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Disfruta de nuestros productos premium</p>
          </div>
          <Button variant="outline-gold" size="lg" onClick={() => setShowCart(!showCart)}>
            Carrito ({count})
          </Button>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'gold' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {filtered.length > 0 ? (
          <div className="grid-auto">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p>No hay productos en esta categoría</p>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && <Cart onClose={() => setShowCart(false)} />}
    </div>
  )
}
