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

const EMPTY = { movie_id: '', room_id: '', date: '', time: '', price: '' };

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
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      movie_id: String(s.movie?.id ?? ''),
      room_id:  String(s.theater?.id ?? ''),
      date:     s.fechaHora?.slice(0, 10) ?? '',
      time:     s.fechaHora?.slice(11, 16) ?? '',
      price:    String(s.precioBase ?? ''),
    });
    setModal('form');
  };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = filterDate
    ? sessions.filter(s => s.fechaHora?.slice(0, 10) === filterDate)
    : sessions;

  const handleSave = () => {
    if (!form.movie_id || !form.room_id || !form.date || !form.time) {
      toast('Todos los campos son obligatorios.', 'error'); return;
    }
    const fechaHora = `${form.date}T${form.time}:00`;

    if (editing) {
      sessionsService.update(editing.id, {
        fechaHora,
        precioBase: Number(form.price) || 0,
      })
        .then(updated => {
          setSessions(p => p.map(s => s.id === editing.id
            ? { ...s, fechaHora, precioBase: Number(form.price) || 0 }
            : s
          ));
          toast('Sesión actualizada.', 'success');
        })
        .catch(() => toast('Error al guardar en el servidor.', 'error'));
    } else {
      sessionsService.create({
        movieId:   Number(form.movie_id),
        theaterId: Number(form.room_id),
        fechaHora,
        precioBase: Number(form.price) || 0,
      })
        .then(created => {
          setSessions(p => [...p, created]);
          toast('Sesión creada.', 'success');
        })
        .catch(() => toast('Error al guardar en el servidor.', 'error'));
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
    { key: 'fechaHora', label: 'Fecha', width: 100,
      render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{v?.slice(0, 10) ?? '—'}</span> },
    { key: '_hora', label: 'Hora', width: 80, sortable: false,
      render: (_, row) => <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-1)', fontWeight: 600 }}>{row.fechaHora?.slice(11, 16) ?? '—'}</span> },
    { key: 'movie', label: 'Película',
      render: v => <span style={{ fontWeight: 500 }}>{v?.titulo ?? '—'}</span> },
    { key: 'theater', label: 'Sala', width: 160,
      render: v => v?.nombre?.split('—')[0].trim() ?? '—' },
    { key: 'asientosDisponibles', label: 'Ocupación', width: 110, render: (v, row) => {
      const cap   = row.theater?.totalSeats ?? row.theater?.capacidad ?? 100;
      const avail = v != null ? v : cap;
      const sold  = cap - avail;
      return (
        <div className={styles.occ}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{sold}/{cap}</span>
          <div className={styles.bar}><div className={styles.barFill} style={{ width: `${cap > 0 ? (sold / cap) * 100 : 0}%`, background: sold >= cap ? 'var(--red)' : sold > cap * 0.8 ? 'var(--yellow)' : 'var(--accent)' }} /></div>
        </div>
      );
    }},
    { key: 'precioBase', label: 'Precio', width: 80,
      render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>€{Number(v ?? 0).toFixed(2)}</span> },
    { key: 'completo', label: 'Estado', width: 120, render: (v, row) => {
      const isPast = row.fechaHora ? new Date(row.fechaHora) < new Date() : false;
      if (isPast) return <Badge variant="default" dot>Finalizada</Badge>;
      if (v)      return <Badge variant="red" dot>Llena</Badge>;
      return <Badge variant="green" dot>Activa</Badge>;
    }},
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Horarios"
        subtitle={`${sessions.length} sesiones · ${sessions.filter(s => !s.completo && s.fechaHora && new Date(s.fechaHora) > new Date()).length} próximas`}
        actions={<Button icon={Plus} onClick={openCreate}>Nueva sesión</Button>}
      />

      <div className={styles.toolbar}>
        <div className={styles.dateFilter}>
          <CalendarDays size={13} className={styles.filterIcon} />
          <input type="date" className={styles.dateInput} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          {filterDate && <button className={styles.clearDate} onClick={() => setFilterDate('')}>×</button>}
        </div>
        <div className={styles.statChips}>
          <span className={styles.chip}><Badge variant="green">Activas</Badge> <span className={styles.chipN}>{sessions.filter(s => !s.completo && s.fechaHora && new Date(s.fechaHora) > new Date()).length}</span></span>
          <span className={styles.chip}><Badge variant="red">Llenas</Badge> <span className={styles.chipN}>{sessions.filter(s => s.completo).length}</span></span>
          <span className={styles.chip}><Badge variant="default">Finalizadas</Badge> <span className={styles.chipN}>{sessions.filter(s => s.fechaHora && new Date(s.fechaHora) < new Date()).length}</span></span>
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
              {movies.filter(m => m.active !== false).map(m => <option key={m.id} value={m.id}>{m.titulo} ({m.duracionMin} min)</option>)}
            </select>
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.label}>Sala *</label>
            <select className={styles.input} value={form.room_id} onChange={e => set('room_id', e.target.value)}>
              <option value="">— Seleccionar sala —</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.totalSeats ?? r.capacidad} but.)</option>)}
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
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Cancelar sesión" danger
        message="¿Seguro que quieres eliminar esta sesión? Las reservas asociadas quedarán sin asignar."
        confirmLabel="Eliminar sesión" />
    </div>
  );
}
