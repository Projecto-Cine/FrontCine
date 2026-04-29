import { useState } from 'react'
import { useData } from '../context/DataContext'
import Modal from '../components/ui/Modal'
import { formatPrice } from '../utils/formatters'

const CATEGORIAS = ['Comida', 'Bebida', 'Merchandising']

function ProductoForm({ producto, onSave, onCancel }) {
  const [form, setForm] = useState(producto || {
    nombre: '', descripcion: '', categoria: 'Comida', precio: 0, stock: 0, imagen: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
      <div className="form-group">
        <label className="form-label">Nombre</label>
        <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Descripción</label>
        <textarea className="form-input" rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Categoría</label>
          <select className="form-input" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Precio (€)</label>
          <input type="number" step="0.1" min="0" className="form-input" value={form.precio} onChange={e => set('precio', parseFloat(e.target.value))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Stock</label>
          <input type="number" min="0" className="form-input" value={form.stock} onChange={e => set('stock', parseInt(e.target.value))} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">URL Imagen</label>
        <input type="url" className="form-input" value={form.imagen} onChange={e => set('imagen', e.target.value)} placeholder="https://..." />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">{producto ? 'Guardar Cambios' : 'Crear Producto'}</button>
      </div>
    </form>
  )
}

export default function Productos() {
  const { productos, addProducto, updateProducto, deleteProducto } = useData()
  const [modalProducto, setModalProducto] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Gestión de Productos</h1>
          <p>Administra el inventario de merchandising, bebidas y comida</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalProducto('new')}>+ Nuevo Producto</button>
      </div>

      <div className="grid-cards">
        {productos.map(p => (
          <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {p.imagen ? (
              <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: 180, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
            ) : (
              <div style={{ width: '100%', height: 180, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🛍</div>
            )}
            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>{p.nombre}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 10, flex: 1 }}>{p.descripcion}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <span className="badge badge-gray">{p.categoria}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📦 Stock: {p.stock}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>{formatPrice(p.precio)}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-icon" onClick={() => setModalProducto(p)}>✏️</button>
                  <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDelete(p)}>🗑️</button>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setModalProducto(p)}>
                🛒 Añadir
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalProducto !== null} onClose={() => setModalProducto(null)} title={modalProducto === 'new' ? 'Nuevo Producto' : 'Editar Producto'}>
        {modalProducto !== null && (
          <ProductoForm
            producto={modalProducto === 'new' ? null : modalProducto}
            onSave={(data) => {
              if (modalProducto === 'new') addProducto(data)
              else updateProducto(modalProducto.id, data)
              setModalProducto(null)
            }}
            onCancel={() => setModalProducto(null)}
          />
        )}
      </Modal>

      <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Eliminar producto" size="sm">
        {confirmDelete && (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              ¿Eliminar <strong>"{confirmDelete.nombre}"</strong>?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => { deleteProducto(confirmDelete.id); setConfirmDelete(null) }}>Eliminar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
