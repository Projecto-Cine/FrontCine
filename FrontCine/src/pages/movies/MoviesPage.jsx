import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useApp } from '../../contexts/AppContext';
import { moviesService } from '../../services/moviesService';
import styles from './MoviesPage.module.css';

const STATUS_MAP = { active: { label: 'Activa', v: 'green' }, upcoming: { label: 'Próximamente', v: 'cyan' }, inactive: { label: 'Baja', v: 'default' } };
const FORMAT_COLOR = { IMAX: 'purple', '4DX': 'red', '3D': 'cyan', '2D': 'default', 'IMAX 3D': 'purple', '2D/3D': 'cyan' };
const RATING_COLOR = { 'PG': 'green', 'PG-13': 'yellow', 'R': 'red' };

const EMPTY_MOVIE = { title: '', duration: '', genre: '', language: 'ES', format: '2D', rating: 'PG-13', status: 'active', director: '', year: new Date().getFullYear() };

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_MOVIE);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast } = useApp();

  useEffect(() => {
    moviesService.getAll().then(setMovies).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_MOVIE); setModal('form'); };
  const openEdit = (movie) => { setEditing(movie); setForm({ ...movie }); setModal('form'); };
  const openDetail = (movie) => { setEditing(movie); setModal('detail'); };

  const handleSave = () => {
    if (!form.title.trim() || !form.duration) { toast('Título y duración son obligatorios.', 'error'); return; }
    if (editing) {
      setMovies(prev => prev.map(m => m.id === editing.id ? { ...m, ...form } : m));
      toast(`"${form.title}" actualizada.`, 'success');
      moviesService.update(editing.id, form).catch(() => toast('Error al guardar en el servidor.', 'error'));
    } else {
      const newMovie = { ...form, id: Date.now(), duration: Number(form.duration) };
      setMovies(prev => [...prev, newMovie]);
      toast(`"${form.title}" añadida.`, 'success');
      moviesService.create({ ...form, duration: Number(form.duration) }).catch(() => toast('Error al guardar en el servidor.', 'error'));
    }
    setModal(null);
  };

  const handleDelete = () => {
    setMovies(prev => prev.filter(m => m.id !== deleteTarget.id));
    toast(`"${deleteTarget.title}" eliminada.`, 'warning');
    moviesService.remove(deleteTarget.id).catch(() => {});
    setDeleteTarget(null);
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const columns = [
    { key: 'title', label: 'Título', render: (v, row) => <span className={styles.title}>{v}</span> },
    { key: 'genre', label: 'Género' },
    { key: 'duration', label: 'Duración', render: v => <span className={styles.mono}>{v} min</span>, width: 90 },
    { key: 'language', label: 'Idioma', width: 80, render: v => <Badge variant="default">{v}</Badge> },
    { key: 'format', label: 'Formato', width: 90, render: v => <Badge variant={FORMAT_COLOR[v] || 'default'}>{v}</Badge> },
    { key: 'rating', label: 'Clasificación', width: 100, render: v => <Badge variant={RATING_COLOR[v] || 'default'}>{v}</Badge> },
    { key: 'status', label: 'Estado', width: 120, render: v => <Badge variant={STATUS_MAP[v]?.v || 'default'} dot>{STATUS_MAP[v]?.label || v}</Badge> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Películas"
        subtitle={`${movies.filter(m => m.status === 'active').length} activas · ${movies.filter(m => m.status === 'upcoming').length} próximamente`}
        actions={<Button icon={Plus} onClick={openCreate}>Nueva película</Button>}
      />

      <div className={styles.filters}>
        {Object.entries(STATUS_MAP).map(([k, { label, v }]) => (
          <span key={k} className={styles.filterChip}>
            <Badge variant={v}>{label}</Badge>
            <span className={styles.filterCount}>{movies.filter(m => m.status === k).length}</span>
          </span>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={movies}
        searchKeys={['title', 'genre', 'director']}
        onRowClick={openDetail}
        rowActions={(row) => (
          <div className={styles.rowActions}>
            <Button variant="ghost" size="sm" icon={Eye} onClick={() => openDetail(row)} title="Ver detalle" />
            <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)} title="Editar" />
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} title="Eliminar" />
          </div>
        )}
        bulkActions={(ids, clear) => (
          <Button variant="danger" size="sm" onClick={() => {
            setMovies(prev => prev.filter(m => !ids.includes(m.id)));
            toast(`${ids.length} película(s) eliminadas.`, 'warning'); clear();
          }}>Eliminar selección ({ids.length})</Button>
        )}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? 'Editar película' : 'Nueva película'}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave}>{editing ? 'Guardar cambios' : 'Crear película'}</Button>
          </div>
        }
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label}>Título *</label>
            <input className={styles.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Título de la película" />
          </div>
          <div>
            <label className={styles.label}>Director</label>
            <input className={styles.input} value={form.director} onChange={e => set('director', e.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Año</label>
            <input className={styles.input} type="number" value={form.year} onChange={e => set('year', e.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Género</label>
            <input className={styles.input} value={form.genre} onChange={e => set('genre', e.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Duración (min) *</label>
            <input className={styles.input} type="number" value={form.duration} onChange={e => set('duration', e.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Idioma</label>
            <select className={styles.input} value={form.language} onChange={e => set('language', e.target.value)}>
              <option value="ES">ES — Doblada</option>
              <option value="VO">VO — Original</option>
              <option value="VOSE">VOSE — Subtitulada</option>
            </select>
          </div>
          <div>
            <label className={styles.label}>Formato</label>
            <select className={styles.input} value={form.format} onChange={e => set('format', e.target.value)}>
              {['2D', '3D', 'IMAX', '4DX', 'IMAX 3D', '2D/3D'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Clasificación</label>
            <select className={styles.input} value={form.rating} onChange={e => set('rating', e.target.value)}>
              {['G', 'PG', 'PG-13', 'R', 'NC-17'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Estado</label>
            <select className={styles.input} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Activa</option>
              <option value="upcoming">Próximamente</option>
              <option value="inactive">Baja</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'detail'} onClose={() => setModal(null)} title="Detalle de película" size="sm">
        {editing && (
          <div className={styles.detail}>
            <h2 className={styles.detailTitle}>{editing.title}</h2>
            <p className={styles.detailDir}>{editing.director} · {editing.year}</p>
            <div className={styles.detailBadges}>
              <Badge variant={FORMAT_COLOR[editing.format] || 'default'}>{editing.format}</Badge>
              <Badge variant={RATING_COLOR[editing.rating] || 'default'}>{editing.rating}</Badge>
              <Badge variant={STATUS_MAP[editing.status]?.v} dot>{STATUS_MAP[editing.status]?.label}</Badge>
            </div>
            <div className={styles.detailGrid}>
              <div><span className={styles.detailLbl}>Género</span><span>{editing.genre}</span></div>
              <div><span className={styles.detailLbl}>Duración</span><span>{editing.duration} min</span></div>
              <div><span className={styles.detailLbl}>Idioma</span><span>{editing.language}</span></div>
              <div><span className={styles.detailLbl}>Estado</span><span>{STATUS_MAP[editing.status]?.label}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Eliminar película" danger
        message={`¿Seguro que quieres eliminar "${deleteTarget?.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar" />
    </div>
  );
}
