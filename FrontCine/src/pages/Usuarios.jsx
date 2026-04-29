import { useState } from 'react'
import { useData } from '../context/DataContext'
import Modal from '../components/ui/Modal'
import { formatDate } from '../utils/formatters'

const DESCUENTOS = ['', 'Estudiante', 'Jubilado', 'Socio', 'Familiar Numerosa']

function UsuarioForm({ usuario, onSave, onCancel }) {
  const [form, setForm] = useState(usuario || {
    nombre: '', email: '', edad: 25, tipoDescuento: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
      <div className="form-group">
        <label className="form-label">Nombre completo</label>
        <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Edad</label>
          <input type="number" min="1" max="120" className="form-input" value={form.edad} onChange={e => set('edad', parseInt(e.target.value))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Tipo de descuento</label>
          <select className="form-input" value={form.tipoDescuento || ''} onChange={e => set('tipoDescuento', e.target.value || null)}>
            {DESCUENTOS.map(d => <option key={d} value={d}>{d || 'Sin descuento'}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">{usuario ? 'Guardar Cambios' : 'Crear Usuario'}</button>
      </div>
    </form>
  )
}

export default function Usuarios() {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario } = useData()
  const [modalUsuario, setModalUsuario] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')

  const filtrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Gestión de Usuarios</h1>
          <p>Administra los usuarios del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalUsuario('new')}>+ Nuevo Usuario</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input
          className="form-input"
          style={{ maxWidth: 360 }}
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="empty-state">No hay usuarios</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtrados.map(u => (
            <div key={u.id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{u.nombre}</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-icon" onClick={() => setModalUsuario(u)}>✏️</button>
                  <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDelete(u)}>🗑️</button>
                </div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                ✉️ {u.email}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className="badge badge-gray">{u.edad} años</span>
                {u.tipoDescuento && <span className="badge badge-success">{u.tipoDescuento}</span>}
                <span className="badge badge-accent">{u.visitas} visitas</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                📅 Registrado: {formatDate(u.fechaRegistro)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalUsuario !== null} onClose={() => setModalUsuario(null)} title={modalUsuario === 'new' ? 'Nuevo Usuario' : 'Editar Usuario'}>
        {modalUsuario !== null && (
          <UsuarioForm
            usuario={modalUsuario === 'new' ? null : modalUsuario}
            onSave={(data) => {
              if (modalUsuario === 'new') addUsuario(data)
              else updateUsuario(modalUsuario.id, data)
              setModalUsuario(null)
            }}
            onCancel={() => setModalUsuario(null)}
          />
        )}
      </Modal>

      <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Eliminar usuario" size="sm">
        {confirmDelete && (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              ¿Eliminar al usuario <strong>"{confirmDelete.nombre}"</strong>?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => { deleteUsuario(confirmDelete.id); setConfirmDelete(null) }}>Eliminar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
