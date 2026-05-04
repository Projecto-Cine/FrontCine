import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CalendarDays } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useApp } from '../../contexts/AppContext';
import { sessionsService } from '../../services/sessionsService';
import { moviesService } from '../../services/moviesService';
import { roomsService } from '../../services/roomsService';
import styles from './SchedulesPage.module.css';

const STATUS_MAP = { active: { label: 'Activa', v: 'green' }, full: { label: 'Llena', v: 'red' }, scheduled: { label: 'Programada', v: 'cyan' }, cancelled: { label: 'Cancelada', v: 'default' } };
const EMPTY = { movie_id: '', room_id: '', date: '', time: '', price: '', status: 'scheduled' };

export default function SchedulesPage() {
  const [sessions, setSessions] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const { toast } = useApp();

  useEffect(() => {
    sessionsService.getAll().then(setSessions).catch(() => {});
    moviesService.getAll().then(setMovies).catch(() => {});
    roomsService.getAll().then(setRooms).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal('form'); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s, movie_id: String(s.movie_id), room_id: String(s.room_id) }); setModal('form'); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = filterDate ? sessions.filter(s => s.date === filterDate) : sessions;

  const handleSave = () => {
    if (!form.movie_id || !form.room_id || !form.date || !form.time) { toast('Todos los campos son obligatorios.', 'error'); return; }
    const movie = movies.find(m => m.id === Number(form.movie_id));
    const [h, min] = form.time.split(':').map(Number);
    const endMin = (h * 60 + min + (movie?.duration || 120)) % (24 * 60);
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
    const room = rooms.find(r => r.id === Number(form.room_id));

    if (editing) {
      setSessions(p => p.map(s => s.id === editing.id ? { ...s, ...form, movie_id: Number(form.movie_id), room_id: Number(form.room_id), price: Number(form.price), end_time: endTime } : s));
      toast('Sesión actualizada.', 'success');
      sessionsService.update(editing.id, { ...form, movie_id: Number(form.movie_id), room_id: Number(form.room_id), price: Number(form.price), end_time: endTime }).catch(() => toast('Error al guardar en el servidor.', 'error'));
    } else {
      setSessions(p => [...p, { ...form, id: Date.now(), movie_id: Number(form.movie_id), room_id: Number(form.room_id), price: Number(form.price), capacity: room?.capacity || 100, sold: 0, end_time: endTime }]);
      toast('Sesión creada.', 'success');
      sessionsService.create({ ...form, movie_id: Number(form.movie_id), room_id: Number(form.room_id), price: Number(form.price) }).catch(() => toast('Error al guardar en el servidor.', 'error'));
    }
    setModal(null);
  };

  const handleDelete = () => {
    setSessions(p => p.filter(s => s.id !== deleteTarget.id));
    toast('Sesión eliminada.', 'warning');
    sessionsService.remove(deleteTarget.id).catch(() => {});
    setDeleteTarget(null);
  };

  const columns = [
    { key: 'date', label: 'Fecha', width: 100, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{v}</span> },
    { key: 'time', label: 'Hora', width: 80, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-1)', fontWeight: 600 }}>{v}</span> },
    { key: 'movie_id', label: 'Película', render: (v) => <span style={{ fontWeight: 500 }}>{movies.find(m => m.id === v)?.title || '—'}</span> },
    { key: 'room_id', label: 'Sala', width: 160, render: v => rooms.find(r => r.id === v)?.name.split('—')[0].trim() || '—' },
    { key: 'sold', label: 'Ocupación', width: 110, render: (v, row) => (
      <div className={styles.occ}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{v}/{row.capacity}</span>
        <div className={styles.bar}><div className={styles.barFill} style={{ width: `${(v / row.capacity) * 100}%`, background: v >= row.capacity ? 'var(--green)' : v > row.capacity * 0.8 ? 'var(--yellow)' : 'var(--accent)' }} /></div>
      </div>
    )},
    { key: 'price', label: 'Precio', width: 80, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>€{Number(v).toFixed(2)}</span> },
    { key: 'status', label: 'Estado', width: 120, render: v => <Badge variant={STATUS_MAP[v]?.v || 'default'} dot>{STATUS_MAP[v]?.label || v}</Badge> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Horarios"
        subtitle={`${sessions.length} sesiones · ${sessions.filter(s => s.status === 'active').length} activas hoy`}
        actions={<Button icon={Plus} onClick={openCreate}>Nueva sesión</Button>}
      />

      <div className={styles.toolbar}>
        <div className={styles.dateFilter}>
          <CalendarDays size={13} className={styles.filterIcon} />
          <input type="date" className={styles.dateInput} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          {filterDate && <button className={styles.clearDate} onClick={() => setFilterDate('')}>×</button>}
        </div>
        <div className={styles.statChips}>
          {Object.entries(STATUS_MAP).map(([k, { label, v }]) => (
            <span key={k} className={styles.chip}><Badge variant={v}>{label}</Badge> <span className={styles.chipN}>{sessions.filter(s => s.status === k).length}</span></span>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['date']}
        searchable={false}
        rowActions={(row) => (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)} />
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} />
          </div>
        )}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? 'Editar sesión' : 'Nueva sesión'}
        footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? 'Guardar' : 'Crear sesión'}</Button>
        </div>}
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label}>Película *</label>
            <select className={styles.input} value={form.movie_id} onChange={e => set('movie_id', e.target.value)}>
              <option value="">— Seleccionar película —</option>
              {movies.filter(m => m.status === 'active').map(m => <option key={m.id} value={m.id}>{m.title} ({m.duration} min)</option>)}
            </select>
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.label}>Sala *</label>
            <select className={styles.input} value={form.room_id} onChange={e => set('room_id', e.target.value)}>
              <option value="">— Seleccionar sala —</option>
              {rooms.filter(r => r.status === 'active').map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity} but.)</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Fecha *</label>
            <input className={styles.input} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Hora inicio *</label>
            <input className={styles.input} type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Precio (€)</label>
            <input className={styles.input} type="number" step="0.50" value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Estado</label>
            <select className={styles.input} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="scheduled">Programada</option>
              <option value="active">Activa</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Cancelar sesión" danger
        message="¿Seguro que quieres eliminar esta sesión? Las reservas asociadas quedarán sin asignar."
        confirmLabel="Eliminar sesión" />
    </div>
  );
}
