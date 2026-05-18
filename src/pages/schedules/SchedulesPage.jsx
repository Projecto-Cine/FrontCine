import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit2, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { moviesService } from '../../services/moviesService';
import { theatersService } from '../../services/roomsService';
import { screeningsService } from '../../services/sessionsService';
import styles from './SchedulesPage.module.css';

const STATUS_BADGE = { SCHEDULED: 'cyan', ACTIVE: 'green', CANCELLED: 'default', FULL: 'red' };
const EMPTY = { movieId: '', theaterId: '', dateTime: '', price: '', status: 'SCHEDULED' };

const getDate    = (s) => (s.dateTime ?? '').slice(0, 10);
const getTime    = (s) => (s.dateTime ?? '').slice(11, 16);
const getMovie   = (s, movies) => s.movie ?? movies.find(m => m.id === s.movieId);
const getTheater = (s, theaters) => s.theater ?? theaters.find(t => t.id === s.theaterId);
const toLocalDT  = (v) => !v ? '' : v.length > 16 ? v.slice(0, 16) : v;

export default function SchedulesPage() {
  const [screenings, setScreenings] = useState([]);
  const [movies, setMovies]         = useState([]);
  const [theaters, setTheaters]     = useState([]);
  const [modal, setModal]           = useState(null);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const { toast } = useApp();
  const { t } = useLanguage();

  useEffect(() => {
    Promise.all([screeningsService.getAll(), moviesService.getAll(), theatersService.getAll()])
      .then(([sd, md, td]) => { setScreenings((sd ?? []).map(normalizeFromBackend)); setMovies(md ?? []); setTheaters(td ?? []); })
      .catch(() => toast('No se pudieron cargar los horarios.', 'error'));
  }, [toast]);

  const filtered = useMemo(
    () => filterDate ? screenings.filter(s => getDate(s) === filterDate) : screenings,
    [filterDate, screenings],
  );

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal('form'); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      movieId:   String(s.movie?.id ?? s.movieId ?? ''),
      theaterId: String(s.theater?.id ?? s.theaterId ?? ''),
      dateTime:  toLocalDT(s.dateTime),
      price:     s.price ?? '',
      status:    s.status ?? 'SCHEDULED',
    });
    setModal('form');
  };
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  function normalizeFromBackend(s) {
    if (!s) return s;
    const now = new Date();
    const start = new Date(s.startTime ?? s.dateTime);
    const end = new Date(s.endDatetime);
    let status = s.status;
    if (!status) {
      if (s.full) status = 'FULL';
      else if (now >= start && now <= end) status = 'ACTIVE';
      else if (now > end) status = 'SCHEDULED';
      else status = 'SCHEDULED';
    }
    return { ...s, dateTime: s.dateTime ?? s.startTime, price: s.price ?? s.basePrice, status };
  }

  const handleSave = async () => {
    if (!form.movieId || !form.theaterId || !form.dateTime) {
      toast('Película, sala y fecha son obligatorios.', 'error'); return;
    }
    const payload = {
      movieId:   Number(form.movieId),
      theaterId: Number(form.theaterId),
      startTime: form.dateTime,
      basePrice: form.price === '' ? undefined : Number(form.price),
    };
    if (editing) {
      const saved = await screeningsService.update(editing.id, payload);
      setScreenings(prev => prev.map(s => s.id === editing.id ? normalizeFromBackend(saved) : s));
      toast('Proyección actualizada.', 'success');
    } else {
      const saved = await screeningsService.create(payload);
      setScreenings(prev => [...prev, normalizeFromBackend(saved)]);
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
    { key: 'date',   label: t('schedules.col.date'),   width: 110, render: (_, row) => <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{getDate(row)}</span> },
    { key: 'time',   label: t('schedules.col.time'),   width: 80,  render: (_, row) => <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-1)', fontWeight: 600 }}>{getTime(row)}</span> },
    { key: 'movie',  label: t('schedules.col.movie'),              render: (_, row) => <span style={{ fontWeight: 500 }}>{getMovie(row, movies)?.title || '-'}</span> },
    { key: 'theater',label: t('schedules.col.room'),   width: 160, render: (_, row) => getTheater(row, theaters)?.name || '-' },
    { key: 'price',  label: t('schedules.col.price'),  width: 90,  render: v => v == null ? '-' : <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>€{Number(v).toFixed(2)}</span> },
    { key: 'status', label: t('schedules.col.status'), width: 120, render: v => <Badge variant={STATUS_BADGE[v] || 'default'} dot>{t(`schedules.status.${v}`) || v || '-'}</Badge> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('schedules.title')}
        subtitle={t('schedules.subtitle', { count: screenings.length, active: screenings.filter(s => s.status === 'ACTIVE').length })}
        actions={<Button icon={Plus} onClick={openCreate}>{t('schedules.createBtn')}</Button>}
      />

      <div className={styles.toolbar}>
        <div className={styles.dateFilter}>
          <CalendarDays size={13} className={styles.filterIcon} />
          <input type="date" className={styles.dateInput} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          <button className={styles.todayBtn} onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}>{t('schedules.today')}</button>
          {filterDate && <button className={styles.clearDate} onClick={() => setFilterDate('')}>×</button>}
        </div>
        <div className={styles.statChips}>
          {Object.keys(STATUS_BADGE).map(key => (
            <span key={key} className={styles.chip}>
              <Badge variant={STATUS_BADGE[key]}>{t(`schedules.status.${key}`)}</Badge>
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
            <Button variant="ghost" size="sm" icon={Edit2}  onClick={() => openEdit(row)} />
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} />
          </div>
        )}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? t('schedules.modalEdit') : t('schedules.modalCreate')}
        footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? t('common.save') : t('schedules.createScreening')}</Button>
        </div>}
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="scr-movie">{t('schedules.form.movie')}</label>
            <select id="scr-movie" className={styles.input} value={form.movieId} onChange={e => set('movieId', e.target.value)}>
              <option value="">{t('schedules.form.selectMovie')}</option>
              {movies.filter(m => m.active !== false).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="scr-room">{t('schedules.form.room')}</label>
            <select id="scr-room" className={styles.input} value={form.theaterId} onChange={e => set('theaterId', e.target.value)}>
              <option value="">{t('schedules.form.selectRoom')}</option>
              {theaters.map(th => <option key={th.id} value={th.id}>{th.name} ({th.capacity} but.)</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="scr-dt">{t('schedules.form.datetime')}</label>
            <input id="scr-dt" className={styles.input} type="datetime-local" value={form.dateTime} onChange={e => set('dateTime', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="scr-price">{t('schedules.form.price')}</label>
            <input id="scr-price" className={styles.input} type="number" step="0.50" value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="scr-status">{t('schedules.form.status')}</label>
            <select id="scr-status" className={styles.input} value={form.status} onChange={e => set('status', e.target.value)}>
              {['SCHEDULED', 'ACTIVE', 'CANCELLED'].map(k => <option key={k} value={k}>{t(`schedules.status.${k}`)}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={t('schedules.deleteTitle')} danger
        message={t('schedules.deleteMsg')}
        confirmLabel={t('schedules.deleteTitle')} />
    </div>
  );
}
