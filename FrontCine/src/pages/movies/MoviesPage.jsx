import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useApp } from '../../contexts/AppContext';
import { moviesService } from '../../services/moviesService';
import styles from './MoviesPage.module.css';

const STATUS_MAP = { active: { label: 'Activa', v: 'green' }, inactive: { label: 'Baja', v: 'default' } };
const FORMAT_COLOR = { IMAX: 'purple', '4DX': 'red', '3D': 'cyan', '2D': 'default', 'IMAX 3D': 'purple', '2D/3D': 'cyan' };
const RATING_COLOR = { 'PG': 'green', 'PG-13': 'yellow', 'R': 'red' };

const EMPTY_MOVIE = { title: '', durationMin: '', genre: '', language: 'ES', format: '2D', ageRating: 'PG-13', active: true, director: '', year: new Date().getFullYear(), description: '', imageUrl: '' };

const normalizeMovie = (movie) => ({
  ...movie,
  durationMin: movie.durationMin ?? movie.duration ?? '',
  ageRating: movie.ageRating ?? movie.rating ?? '',
  imageUrl: movie.imageUrl ?? movie.poster ?? '',
  active: movie.active ?? movie.status === 'active',
});

const toPayload = (movie) => ({
  ...movie,
  durationMin: Number(movie.durationMin),
  year: movie.year ? Number(movie.year) : undefined,
  active: Boolean(movie.active),
});

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_MOVIE);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null);
  const { toast } = useApp();

  useEffect(() => {
    moviesService.getAll()
      .then(data => setMovies((data ?? []).map(normalizeMovie)))
      .catch(() => toast('No se pudieron cargar las películas.', 'error'));
  }, [toast]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_MOVIE); setModal('form'); };
  const openEdit = (movie) => { setEditing(movie); setForm({ ...movie }); setModal('form'); };
  const openDetail = (movie) => { setEditing(movie); setModal('detail'); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.durationMin) { toast('Título y duración son obligatorios.', 'error'); return; }
    const payload = toPayload(form);
    if (editing) {
      const saved = normalizeMovie(await moviesService.update(editing.id, payload));
      setMovies(prev => prev.map(m => m.id === editing.id ? saved : m));
      toast(`"${form.title}" actualizada.`, 'success');
    } else {
      const saved = normalizeMovie(await moviesService.create(payload));
      setMovies(prev => [...prev, saved]);
      toast(`"${form.title}" añadida.`, 'success');
    }
    setModal(null);
  };

  const handleDelete = async () => {
    await moviesService.remove(deleteTarget.id);
    setMovies(prev => prev.filter(m => m.id !== deleteTarget.id));
    toast(`"${deleteTarget.title}" eliminada.`, 'warning');
    setDeleteTarget(null);
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const columns = [
    { key: 'title', label: 'Título', render: (v) => <span className={styles.title}>{v}</span> },
    { key: 'genre', label: 'Género' },
    { key: 'durationMin', label: 'Duración', render: v => <span className={styles.mono}>{v} min</span>, width: 90 },
    { key: 'language', label: 'Idioma', width: 80, render: v => <Badge variant="default">{v}</Badge> },
    { key: 'format', label: 'Formato', width: 90, render: v => <Badge variant={FORMAT_COLOR[v] || 'default'}>{v}</Badge> },
    { key: 'ageRating', label: 'Clasificación', width: 100, render: v => <Badge variant={RATING_COLOR[v] || 'default'}>{v}</Badge> },
    { key: 'active', label: 'Estado', width: 120, render: v => <Badge variant={v ? STATUS_MAP.active.v : STATUS_MAP.inactive.v} dot>{v ? STATUS_MAP.active.label : STATUS_MAP.inactive.label}</Badge> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Películas"
        subtitle={`${movies.filter(m => m.active).length} activas · ${movies.filter(m => !m.active).length} inactivas`}
        actions={<Button icon={Plus} onClick={openCreate}>Nueva película</Button>}
      />

      <div className={styles.filters}>
        {Object.entries(STATUS_MAP).map(([k, { label, v }]) => (
          <span key={k} className={styles.filterChip}>
            <Badge variant={v}>{label}</Badge>
            <span className={styles.filterCount}>{movies.filter(m => k === 'active' ? m.active : !m.active).length}</span>
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
          <Button variant="danger" size="sm" onClick={() => setBulkDeleteIds({ ids, clear })}>
            Eliminar selección ({ids.length})
          </Button>
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
            <label className={styles.label} htmlFor="mov-title">Título *</label>
            <input id="mov-title" className={styles.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Título de la película" />
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-director">Director</label>
            <input id="mov-director" className={styles.input} value={form.director} onChange={e => set('director', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-year">Año</label>
            <input id="mov-year" className={styles.input} type="number" value={form.year} onChange={e => set('year', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-genre">Género</label>
            <input id="mov-genre" className={styles.input} value={form.genre} onChange={e => set('genre', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-duration">Duración (min) *</label>
            <input id="mov-duration" className={styles.input} type="number" value={form.durationMin} onChange={e => set('durationMin', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-language">Idioma</label>
            <select id="mov-language" className={styles.input} value={form.language} onChange={e => set('language', e.target.value)}>
              <option value="ES">ES — Doblada</option>
              <option value="VO">VO — Original</option>
              <option value="VOSE">VOSE — Subtitulada</option>
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-format">Formato</label>
            <select id="mov-format" className={styles.input} value={form.format} onChange={e => set('format', e.target.value)}>
              {['2D', '3D', 'IMAX', '4DX', 'IMAX 3D', '2D/3D'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-rating">Clasificación</label>
            <select id="mov-rating" className={styles.input} value={form.ageRating} onChange={e => set('ageRating', e.target.value)}>
              {['G', 'PG', 'PG-13', 'R', 'NC-17'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-status">Estado</label>
            <select id="mov-status" className={styles.input} value={form.active ? 'active' : 'inactive'} onChange={e => set('active', e.target.value === 'active')}>
              <option value="active">Activa</option>
              <option value="inactive">Baja</option>
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-image">Imagen URL</label>
            <input id="mov-image" className={styles.input} value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Vista previa" className={styles.imagePreview} onError={e => { e.target.style.display = 'none'; }} />
            )}
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="mov-desc">Descripción</label>
            <textarea id="mov-desc" className={styles.input} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
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
              <Badge variant={RATING_COLOR[editing.ageRating] || 'default'}>{editing.ageRating}</Badge>
              <Badge variant={editing.active ? STATUS_MAP.active.v : STATUS_MAP.inactive.v} dot>{editing.active ? STATUS_MAP.active.label : STATUS_MAP.inactive.label}</Badge>
            </div>
            <div className={styles.detailGrid}>
              <div><span className={styles.detailLbl}>Género</span><span>{editing.genre}</span></div>
              <div><span className={styles.detailLbl}>Duración</span><span>{editing.durationMin} min</span></div>
              <div><span className={styles.detailLbl}>Idioma</span><span>{editing.language}</span></div>
              <div><span className={styles.detailLbl}>Estado</span><span>{editing.active ? STATUS_MAP.active.label : STATUS_MAP.inactive.label}</span></div>
            </div>
            {editing.description && <p style={{ marginTop: 12, color: 'var(--text-2)', fontSize: 12 }}>{editing.description}</p>}
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Eliminar película" danger
        message={`¿Seguro que quieres eliminar "${deleteTarget?.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar" />

      <ConfirmModal
        open={!!bulkDeleteIds}
        onClose={() => setBulkDeleteIds(null)}
        onConfirm={() => {
          setMovies(prev => prev.filter(m => !bulkDeleteIds.ids.includes(m.id)));
          toast(`${bulkDeleteIds.ids.length} película(s) eliminadas.`, 'warning');
          bulkDeleteIds.clear();
          setBulkDeleteIds(null);
        }}
        title="Eliminar selección" danger
        message={`¿Eliminar ${bulkDeleteIds?.ids.length} película(s)? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar todas" />
    </div>
  );
}
