import { useState } from 'react'
import { useData } from '../context/DataContext'
import Modal from '../components/ui/Modal'
import { formatDate } from '../utils/formatters'

const DESCUENTOS = ['', 'Estudiante', 'Jubilado', 'Carné Joven', 'Familia Numerosa', 'Socio']

function ClienteForm({ cliente, onSave, onCancel }) {
  const [form, setForm] = useState(cliente || {
    nombre: '', email: '', telefono: '', tipoDescuento: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
      <div className="form-group">
        <label className="form-label">Nombre completo</label>
        <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono</label>
          <input className="form-input" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Tipo de descuento</label>
        <select className="form-input" value={form.tipoDescuento || ''} onChange={e => set('tipoDescuento', e.target.value || null)}>
          {DESCUENTOS.map(d => <option key={d} value={d}>{d || 'Sin descuento'}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">{cliente ? 'Guardar Cambios' : 'Registrar Cliente'}</button>
      </div>
    </form>
  )
}

export default function Clientes() {
  const { clientes, addCliente, updateCliente, deleteCliente } = useData()
  const [modalCliente, setModalCliente] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono?.includes(search)
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Clientes</h1>
          <p>Gestión de clientes y descuentos en taquilla</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalCliente('new')}>+ Nuevo Cliente</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input
          className="form-input"
          style={{ maxWidth: 360 }}
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="empty-state">No hay clientes registrados</div>
      ) : (
        <div className="grid-cards">
          {filtrados.map(c => (
            <div key={c.id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{c.nombre}</h3>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {c.tipoDescuento
                      ? <span className="badge badge-success">{c.tipoDescuento}</span>
                      : <span className="badge badge-gray">Sin descuento</span>
                    }
                    <span className="badge badge-accent">{c.visitas} visitas</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn-icon" onClick={() => setModalCliente(c)}>✏️</button>
                  <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDelete(c)}>🗑️</button>
                </div>
              </div>

              {c.telefono && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  📞 {c.telefono}
                </div>
              )}
              {c.email && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✉️ {c.email}
                </div>
              )}
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                📅 Registrado: {formatDate(c.fechaRegistro)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalCliente !== null}
        onClose={() => setModalCliente(null)}
        title={modalCliente === 'new' ? 'Nuevo Cliente' : 'Editar Cliente'}
      >
        {modalCliente !== null && (
          <ClienteForm
            cliente={modalCliente === 'new' ? null : modalCliente}
            onSave={(data) => {
              if (modalCliente === 'new') addCliente(data)
              else updateCliente(modalCliente.id, data)
              setModalCliente(null)
            }}
            onCancel={() => setModalCliente(null)}
          />
        )}
      </Modal>

      <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Eliminar cliente" size="sm">
        {confirmDelete && (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              ¿Eliminar al cliente <strong>"{confirmDelete.nombre}"</strong>?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => { deleteCliente(confirmDelete.id); setConfirmDelete(null) }}>Eliminar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
