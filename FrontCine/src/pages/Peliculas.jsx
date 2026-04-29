import { useState } from 'react'
import { useData } from '../context/DataContext'
import Modal from '../components/ui/Modal'

function SesionForm({ sesion, onSave, onCancel, peliculaId }) {
  const [form, setForm] = useState(sesion || {
    peliculaId,
    fecha: '',
    hora: '',
    sala: 'Sala 1',
    precioEntrada: 10.5,
    aforo: 120,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input type="date" className="form-input" value={form.fecha} onChange={e => set('fecha', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Hora</label>
          <input type="time" className="form-input" value={form.hora} onChange={e => set('hora', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Sala</label>
          <select className="form-input" value={form.sala} onChange={e => set('sala', e.target.value)}>
            {['Sala 1', 'Sala 2', 'Sala 3', 'Sala VIP'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Precio entrada (€)</label>
          <input type="number" step="0.5" min="0" className="form-input" value={form.precioEntrada} onChange={e => set('precioEntrada', parseFloat(e.target.value))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Aforo</label>
          <input type="number" min="1" className="form-input" value={form.aforo} onChange={e => set('aforo', parseInt(e.target.value))} required />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Guardar Sesión</button>
      </div>
    </form>
  )
}

function PeliculaForm({ pelicula, onSave, onCancel }) {
  const [form, setForm] = useState(pelicula || {
    titulo: '', genero: '', duracion: 90, clasificacion: 'TP', imagen: '', descripcion: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
      <div className="form-group">
        <label className="form-label">Título</label>
        <input className="form-input" value={form.titulo} onChange={e => set('titulo', e.target.value)} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Género</label>
          <select className="form-input" value={form.genero} onChange={e => set('genero', e.target.value)} required>
            <option value="">Seleccionar...</option>
            {['Thriller', 'Ciencia Ficción', 'Comedia Romántica', 'Fantasía', 'Acción', 'Drama', 'Terror', 'Animación'].map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Clasificación</label>
          <select className="form-input" value={form.clasificacion} onChange={e => set('clasificacion', e.target.value)}>
            {['TP', '+7', '+12', '+16', '+18'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Duración (min)</label>
          <input type="number" min="1" className="form-input" value={form.duracion} onChange={e => set('duracion', parseInt(e.target.value))} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">URL Imagen</label>
        <input type="url" className="form-input" value={form.imagen} onChange={e => set('imagen', e.target.value)} placeholder="https://..." />
      </div>
      <div className="form-group">
        <label className="form-label">Descripción</label>
        <textarea className="form-input" rows={3} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">{pelicula ? 'Guardar Cambios' : 'Crear Película'}</button>
      </div>
    </form>
  )
}

export default function Peliculas() {
  const { peliculas, sesiones, addPelicula, updatePelicula, deletePelicula, addSesion, deleteSesion } = useData()
  const [modalPelicula, setModalPelicula] = useState(null) // null | 'new' | pelicula
  const [modalSesion, setModalSesion] = useState(null)    // null | peliculaId
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const handleSavePelicula = (data) => {
    if (modalPelicula === 'new') addPelicula(data)
    else updatePelicula(modalPelicula.id, data)
    setModalPelicula(null)
  }

  const handleDeletePelicula = (id) => {
    deletePelicula(id)
    setConfirmDelete(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Gestión de Películas</h1>
          <p>Administra el catálogo de películas y sesiones</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalPelicula('new')}>+ Nueva Película</button>
      </div>

      <div className="grid-cards">
        {peliculas.map(p => {
          const pelSesiones = sesiones.filter(s => s.peliculaId === p.id)
          const isExpanded = expandedId === p.id
          return (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ position: 'relative' }}>
                {p.imagen ? (
                  <img
                    src={p.imagen} alt={p.titulo}
                    style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 220, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎬</div>
                )}
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                  <button className="btn-icon" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={() => setModalPelicula(p)}>✏️</button>
                  <button className="btn-icon" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)' }} onClick={() => setConfirmDelete(p)}>🗑️</button>
                </div>
              </div>
              <div style={{ padding: '16px 16px 12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }} title={p.titulo}>
                  {p.titulo.length > 22 ? p.titulo.slice(0, 22) + '…' : p.titulo}
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span className="badge badge-gray">{p.genero}</span>
                  {p.clasificacion !== 'TP' && <span className="badge badge-accent">{p.clasificacion}</span>}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>⏱ {p.duracion} min</span>
                </div>
                {isExpanded && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Sesiones ({pelSesiones.length})</div>
                    {pelSesiones.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sin sesiones programadas</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {pelSesiones.map(s => (
                          <div key={s.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '6px 10px', background: 'var(--bg-input)', borderRadius: 6, fontSize: '0.8rem',
                          }}>
                            <span>{s.fecha} {s.hora} — {s.sala}</span>
                            <button onClick={() => deleteSesion(s.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}
                      onClick={() => setModalSesion(p.id)}
                    >+ Añadir Sesión</button>
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  {isExpanded ? 'Cerrar' : 'Añadir Sesión'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal nueva/editar película */}
      <Modal
        isOpen={modalPelicula !== null}
        onClose={() => setModalPelicula(null)}
        title={modalPelicula === 'new' ? 'Nueva Película' : 'Editar Película'}
      >
        {modalPelicula !== null && (
          <PeliculaForm
            pelicula={modalPelicula === 'new' ? null : modalPelicula}
            onSave={handleSavePelicula}
            onCancel={() => setModalPelicula(null)}
          />
        )}
      </Modal>

      {/* Modal añadir sesión */}
      <Modal isOpen={modalSesion !== null} onClose={() => setModalSesion(null)} title="Nueva Sesión">
        {modalSesion !== null && (
          <SesionForm
            peliculaId={modalSesion}
            onSave={(data) => { addSesion(data); setModalSesion(null) }}
            onCancel={() => setModalSesion(null)}
          />
        )}
      </Modal>

      {/* Confirm delete */}
      <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación" size="sm">
        {confirmDelete && (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              ¿Eliminar <strong>"{confirmDelete.titulo}"</strong>? También se eliminarán sus sesiones.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDeletePelicula(confirmDelete.id)}>Eliminar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
