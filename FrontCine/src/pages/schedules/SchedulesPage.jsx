import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit2, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useApp } from '../../contexts/AppContext';
import { moviesService } from '../../services/moviesService';
import { theatersService } from '../../services/roomsService';
import { screeningsService } from '../../services/sessionsService';
import styles from './SchedulesPage.module.css';

const STATUS_MAP = {
  SCHEDULED: { label: 'Programada', v: 'cyan' },
  ACTIVE:    { label: 'Activa',     v: 'green' },
  CANCELLED: { label: 'Cancelada',  v: 'default' },
  FULL:      { label: 'Llena',      v: 'red' },
};

const EMPTY = { movieId: '', theaterId: '', dateTime: '', price: '', status: 'SCHEDULED' };

const getDate    = (s) => (s.dateTime ?? '').slice(0, 10);
const getTime    = (s) => (s.dateTime ?? '').slice(11, 16);
const getMovie   = (s, movies)   => s.movie   ?? movies.find(m => m.id === s.movieId);
const getTheater = (s, theaters) => s.theater ?? theaters.find(t => t.id === s.theaterId);
const toLocalDT  = (v) => (!v ? '' : v.length > 16 ? v.slice(0, 16) : v);

export default function SchedulesPage() {
  const [screenings, setScreenings] = useState([]);
  const [movies,     setMovies]     = useState([]);
  const [theaters,   setTheaters]   = useState([]);
  const [modal,      setModal]      = useState(null);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterDate,   setFilterDate]   = useState('');
  const { toast } = useApp();

  useEffect(() => {
    Promise.all([screeningsService.getAll(), moviesService.getAll(), theatersService.getAll()])
      .then(([sd, md, td]) => {
        setScreenings(sd ?? []);
        setMovies(md ?? []);
        setTheaters(td ?? []);
      })
      .catch(() => toast('No se pudieron cargar los horarios del backend.', 'error'));
  }, [toast]);

  const filtered = useMemo(
    () => filterDate ? screenings.filter(s => getDate(s) === filterDate) : screenings,
    [filterDate, screenings],
  );

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal('form'); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      movieId:   String(s.movie?.id   ?? s.movieId   ?? ''),
      theaterId: String(s.theater?.id ?? s.theaterId ?? ''),
      dateTime:  toLocalDT(s.dateTime),
      price:     s.price ?? '',
      status:    s.status ?? 'SCHEDULED',
    });
    setModal('form');
  };
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.movieId || !form.theaterId || !form.dateTime) {
      toast('Película, sala y fecha son obligatorios.', 'error');
      return;
    }
    const payload = {
      movieId:   Number(form.movieId),
      theaterId: Number(form.theaterId),
      dateTime:  form.dateTime,
      price:     form.price === '' ? undefined : Number(form.price),
      status:    form.status,
    };
    if (editing) {
      const saved = await screeningsService.update(editing.id, payload);
      setScreenings(prev => prev.map(s => s.id === editing.id ? saved : s));
      toast('Proyección actualizada.', 'success');
    } else {
      const saved = await screeningsService.create(payload);
      setScreenings(prev => [...prev, saved]);
      toast('Proyección creada.', 'success');
    }
    setModal(null);
  };

  const handleDelete = async () => {
    await screeningsService.remove(deleteTarget.id);
    setScreenings(prev => prev.filter(s => s.id !== deleteTarget.id));
    toast('Proyección eliminada.', 'warning');
    setDeleteTarget(null);
  };

  const columns = [
    { key: 'date',    label: 'Fecha',  width: 110, render: (_, row) => <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{getDate(row)}</span> },
    { key: 'time',    label: 'Hora',   width: 80,  render: (_, row) => <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-1)', fontWeight: 600 }}>{getTime(row)}</span> },
    { key: 'movie',   label: 'Película',            render: (_, row) => <span style={{ fontWeight: 500 }}>{getMovie(row, movies)?.title || '-'}</span> },
    { key: 'theater', label: 'Sala',   width: 160, render: (_, row) => getTheater(row, theaters)?.name || '-' },
    { key: 'price',   label: 'Precio', width: 90,  render: v => v == null ? '-' : <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>€{Number(v).toFixed(2)}</span> },
    { key: 'status',  label: 'Estado', width: 120, render: v => <Badge variant={STATUS_MAP[v]?.v || 'default'} dot>{STATUS_MAP[v]?.label || v || '-'}</Badge> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Horarios"
        subtitle={`${screenings.length} proyecciones · ${screenings.filter(s => s.status === 'ACTIVE').length} activas`}
        actions={<Button icon={Plus} onClick={openCreate}>Nueva proyección</Button>}
      />

      <div className={styles.toolbar}>
        <div className={styles.dateFilter}>
          <CalendarDays size={13} className={styles.filterIcon} />
          <input type="date" className={styles.dateInput} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          {filterDate && <button className={styles.clearDate} onClick={() => setFilterDate('')}>×</button>}
        </div>
        <div className={styles.statChips}>
          {Object.entries(STATUS_MAP).map(([key, { label, v }]) => (
            <span key={key} className={styles.chip}>
              <Badge variant={v}>{label}</Badge>
              <span className={styles.chipN}>{screenings.filter(s => s.status === key).length}</span>
            </span>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchable={false}
        rowActions={(row) => (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)} />
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} />
          </div>
        )}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? 'Editar proyección' : 'Nueva proyección'}
        footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? 'Guardar' : 'Crear proyección'}</Button>
        </div>}
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label}>Película *</label>
            <select className={styles.input} value={form.movieId} onChange={e => set('movieId', e.target.value)}>
              <option value="">Seleccionar película</option>
              {movies.filter(m => m.active !== false).map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.label}>Sala *</label>
            <select className={styles.input} value={form.theaterId} onChange={e => set('theaterId', e.target.value)}>
              <option value="">Seleccionar sala</option>
              {theaters.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.capacity} but.)</option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.label}>Fecha y hora *</label>
            <input className={styles.input} type="datetime-local" value={form.dateTime} onChange={e => set('dateTime', e.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Precio (€)</label>
            <input className={styles.input} type="number" step="0.50" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className={styles.label}>Estado</label>
            <select className={styles.input} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="SCHEDULED">Programada</option>
              <option value="ACTIVE">Activa</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Eliminar proyección" danger
        message="¿Seguro que quieres eliminar esta proyección?"
        confirmLabel="Eliminar proyección" />
    </div>
  );
}
