import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import Modal from '../components/ui/Modal'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const ROLES = ['Taquillero/a', 'Acomodador/a', 'Encargado/a', 'Limpieza', 'Seguridad']

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toKey(date) {
  return date.toISOString().split('T')[0]
}

function fmtShort(date) {
  return `${date.getDate()} ${MESES[date.getMonth()]}`
}

/* ── Turno form ── */
function TurnoForm({ turno, trabajadores, defaultTrabajadorId, defaultFecha, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState(turno || {
    trabajadorId: defaultTrabajadorId || trabajadores[0]?.id || '',
    fecha: defaultFecha || toKey(new Date()),
    inicio: '09:00',
    fin: '17:00',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
      <div className="form-group">
        <label className="form-label">Trabajador</label>
        <select className="form-input" value={form.trabajadorId} onChange={e => set('trabajadorId', parseInt(e.target.value))} required>
          {trabajadores.map(t => (
            <option key={t.id} value={t.id}>{t.nombre} — {t.rol}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Fecha</label>
        <input type="date" className="form-input" value={form.fecha} onChange={e => set('fecha', e.target.value)} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Entrada</label>
          <input type="time" className="form-input" value={form.inicio} onChange={e => set('inicio', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Salida</label>
          <input type="time" className="form-input" value={form.fin} onChange={e => set('fin', e.target.value)} required />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 8 }}>
        <div>
          {turno && (
            <button type="button" className="btn btn-danger" onClick={onDelete}>Eliminar turno</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary">{turno ? 'Guardar' : 'Añadir Turno'}</button>
        </div>
      </div>
    </form>
  )
}

/* ── Trabajador form ── */
function TrabajadorForm({ trabajador, onSave, onCancel }) {
  const [form, setForm] = useState(trabajador || { nombre: '', rol: ROLES[0], telefono: '', email: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
      <div className="form-group">
        <label className="form-label">Nombre completo</label>
        <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Rol</label>
        <select className="form-input" value={form.rol} onChange={e => set('rol', e.target.value)}>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Teléfono</label>
          <input className="form-input" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">{trabajador ? 'Guardar Cambios' : 'Añadir Trabajador'}</button>
      </div>
    </form>
  )
}

/* ── Weekly grid ── */
function WeekView({ trabajadores, turnos, weekStart, onAddTurno, onEditTurno }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dayKeys = days.map(toKey)
  const todayKey = toKey(new Date())

  const turnoMap = useMemo(() => {
    const map = {}
    turnos.forEach(t => {
      if (!map[t.trabajadorId]) map[t.trabajadorId] = {}
      map[t.trabajadorId][t.fecha] = t
    })
    return map
  }, [turnos])

  if (trabajadores.length === 0) {
    return (
      <div className="empty-state">
        No hay trabajadores. Añade uno en la pestaña <strong>Trabajadores</strong>.
      </div>
    )
  }

  const cellBase = {
    padding: '6px 8px',
    borderBottom: '1px solid var(--border-color)',
    borderLeft: '1px solid var(--border-color)',
    verticalAlign: 'middle',
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            <th style={{
              padding: '12px 16px', textAlign: 'left',
              fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600,
              borderBottom: '1px solid var(--border-color)',
              minWidth: 160, whiteSpace: 'nowrap',
            }}>Trabajador</th>
            {days.map((d, i) => {
              const isToday = dayKeys[i] === todayKey
              return (
                <th key={i} style={{
                  padding: '12px 8px', textAlign: 'center',
                  fontSize: '0.78rem', fontWeight: 600,
                  color: isToday ? 'var(--accent)' : 'var(--text-secondary)',
                  borderBottom: `2px solid ${isToday ? 'var(--accent)' : 'var(--border-color)'}`,
                  minWidth: 90,
                }}>
                  <div>{DIAS[i]}</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 400, marginTop: 2, color: isToday ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {fmtShort(d)}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {trabajadores.map((trab, ri) => (
            <tr key={trab.id} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{trab.nombre}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{trab.rol}</div>
              </td>
              {dayKeys.map((dk, di) => {
                const turno = turnoMap[trab.id]?.[dk]
                return (
                  <td key={di} style={cellBase}>
                    {turno ? (
                      <button
                        onClick={() => onEditTurno(turno)}
                        style={{
                          width: '100%',
                          background: 'var(--accent-bg)',
                          border: '1px solid var(--border-accent)',
                          borderRadius: 6,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                      >
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                          {turno.inicio}–{turno.fin}
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={() => onAddTurno(trab.id, dk)}
                        style={{
                          width: '100%', height: 36,
                          background: 'transparent',
                          border: '1px dashed var(--border-color)',
                          borderRadius: 6, cursor: 'pointer',
                          color: 'var(--text-muted)', fontSize: '1rem',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--accent)'
                          e.currentTarget.style.color = 'var(--accent)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border-color)'
                          e.currentTarget.style.color = 'var(--text-muted)'
                        }}
                      >+</button>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Trabajadores tab ── */
function TrabajadoresView({ trabajadores, onNew, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={onNew}>+ Nuevo Trabajador</button>
      </div>
      {trabajadores.length === 0 ? (
        <div className="empty-state">No hay trabajadores registrados</div>
      ) : (
        <div className="grid-cards">
          {trabajadores.map(t => (
            <div key={t.id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>{t.nombre}</div>
                  <span className="badge badge-accent">{t.rol}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-icon" onClick={() => onEdit(t)}>✏️</button>
                  <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => onDelete(t)}>🗑️</button>
                </div>
              </div>
              {t.telefono && (
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 6 }}>📞 {t.telefono}</div>
              )}
              {t.email && (
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>✉️ {t.email}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function Horarios() {
  const { trabajadores, turnos, addTrabajador, updateTrabajador, deleteTrabajador, addTurno, updateTurno, deleteTurno } = useData()

  const [tab, setTab] = useState('semana')
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [modalTurno, setModalTurno] = useState(null)
  const [modalTrabajador, setModalTrabajador] = useState(null)
  const [confirmDeleteTrab, setConfirmDeleteTrab] = useState(null)

  const weekEnd = addDays(weekStart, 6)

  const weekTurnos = useMemo(() =>
    turnos.filter(t => t.fecha >= toKey(weekStart) && t.fecha <= toKey(weekEnd)),
    [turnos, weekStart, weekEnd]
  )

  const prevWeek  = () => setWeekStart(w => addDays(w, -7))
  const nextWeek  = () => setWeekStart(w => addDays(w, 7))
  const goToToday = () => setWeekStart(getWeekStart(new Date()))

  const TABS = [
    { key: 'semana',       label: '📅 Semana' },
    { key: 'trabajadores', label: '👤 Trabajadores' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Horarios del Personal</h1>
          <p>Gestión de turnos y trabajadores del cine</p>
        </div>
        {tab === 'semana' && (
          <button className="btn btn-primary" onClick={() => setModalTurno({})}>+ Añadir Turno</button>
        )}
        {tab === 'trabajadores' && (
          <button className="btn btn-primary" onClick={() => setModalTrabajador('new')}>+ Nuevo Trabajador</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 20px', borderRadius: 20,
              border: tab === t.key ? '1px solid var(--accent)' : '1px solid var(--border-color)',
              background: tab === t.key ? 'var(--accent)' : 'transparent',
              color: tab === t.key ? '#000' : 'var(--text-secondary)',
              fontWeight: tab === t.key ? 600 : 400,
              fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Semana view */}
      {tab === 'semana' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button className="btn btn-secondary" style={{ padding: '7px 14px' }} onClick={prevWeek}>←</button>
            <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: '0.95rem' }}>
              {fmtShort(weekStart)} – {fmtShort(weekEnd)} {weekEnd.getFullYear()}
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '7px 12px' }}
              onClick={goToToday}
            >Hoy</button>
            <button className="btn btn-secondary" style={{ padding: '7px 14px' }} onClick={nextWeek}>→</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <WeekView
              trabajadores={trabajadores}
              turnos={weekTurnos}
              weekStart={weekStart}
              onAddTurno={(trabajadorId, fecha) => setModalTurno({ trabajadorId, fecha })}
              onEditTurno={(turno) => setModalTurno({ turno })}
            />
          </div>
        </div>
      )}

      {/* Trabajadores view */}
      {tab === 'trabajadores' && (
        <TrabajadoresView
          trabajadores={trabajadores}
          onNew={() => setModalTrabajador('new')}
          onEdit={(t) => setModalTrabajador(t)}
          onDelete={(t) => setConfirmDeleteTrab(t)}
        />
      )}

      {/* Modal turno */}
      <Modal
        isOpen={modalTurno !== null}
        onClose={() => setModalTurno(null)}
        title={modalTurno?.turno ? 'Editar Turno' : 'Nuevo Turno'}
      >
        {modalTurno !== null && (
          <TurnoForm
            turno={modalTurno.turno}
            trabajadores={trabajadores}
            defaultTrabajadorId={modalTurno.trabajadorId}
            defaultFecha={modalTurno.fecha}
            onSave={(data) => {
              if (modalTurno.turno) updateTurno(modalTurno.turno.id, data)
              else addTurno(data)
              setModalTurno(null)
            }}
            onDelete={() => { deleteTurno(modalTurno.turno.id); setModalTurno(null) }}
            onCancel={() => setModalTurno(null)}
          />
        )}
      </Modal>

      {/* Modal trabajador */}
      <Modal
        isOpen={modalTrabajador !== null}
        onClose={() => setModalTrabajador(null)}
        title={modalTrabajador === 'new' ? 'Nuevo Trabajador' : 'Editar Trabajador'}
      >
        {modalTrabajador !== null && (
          <TrabajadorForm
            trabajador={modalTrabajador === 'new' ? null : modalTrabajador}
            onSave={(data) => {
              if (modalTrabajador === 'new') addTrabajador(data)
              else updateTrabajador(modalTrabajador.id, data)
              setModalTrabajador(null)
            }}
            onCancel={() => setModalTrabajador(null)}
          />
        )}
      </Modal>

      {/* Confirm delete trabajador */}
      <Modal isOpen={confirmDeleteTrab !== null} onClose={() => setConfirmDeleteTrab(null)} title="Eliminar trabajador" size="sm">
        {confirmDeleteTrab && (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              ¿Eliminar a <strong>"{confirmDeleteTrab.nombre}"</strong>? También se eliminarán sus turnos.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDeleteTrab(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => {
                deleteTrabajador(confirmDeleteTrab.id)
                setConfirmDeleteTrab(null)
              }}>Eliminar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
