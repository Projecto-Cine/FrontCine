import { useEffect, useMemo, useState } from 'react';
import { Edit2, Film, Plus, Search, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
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
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_MOVIE);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast } = useApp();

  useEffect(() => {
    moviesService.getAll()
      .then(data => setMovies((data ?? []).map(normalizeMovie)))
      .catch(() => toast('No se pudieron cargar las películas del backend.', 'error'));
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? movies.filter(m => (m.title ?? '').toLowerCase().includes(q) || (m.genre ?? '').toLowerCase().includes(q) || (m.director ?? '').toLowerCase().includes(q))
      : movies;
  }, [movies, search]);

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

  return (
    <div className={styles.page}>
      <PageHeader
        title="Películas"
        subtitle={`${movies.filter(m => m.active).length} activas · ${movies.filter(m => !m.active).length} inactivas`}
        actions={<Button icon={Plus} onClick={openCreate}>Nueva película</Button>}
      />

      <div className={styles.topBar}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por título, género o director…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterChip}>
          <Badge variant="green">{movies.filter(m => m.active).length} activas</Badge>
          <Badge variant="default">{movies.filter(m => !m.active).length} inactivas</Badge>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          {search ? `Sin resultados para "${search}"` : 'No hay películas registradas'}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(movie => (
            <div key={movie.id} className={styles.card} onClick={() => openDetail(movie)}>
              <div className={styles.poster}>
                {movie.imageUrl ? (
                  <img
                    src={movie.imageUrl}
                    alt={movie.title}
                    className={styles.posterImg}
                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div className={styles.posterFallback} style={movie.imageUrl ? { display: 'none' } : {}}>
                  <Film size={32} />
                  <span className={styles.posterFallbackText}>{movie.title}</span>
                </div>
                <div className={styles.statusOverlay}>
                  <Badge variant={movie.active ? 'green' : 'default'} dot>
                    {movie.active ? 'Activa' : 'Baja'}
                  </Badge>
                </div>
                {movie.ageRating && (
                  <div className={styles.ratingOverlay}>
                    <Badge variant={RATING_COLOR[movie.ageRating] || 'default'}>{movie.ageRating}</Badge>
                  </div>
                )}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{movie.title}</div>
                {(movie.director || movie.year) && (
                  <div className={styles.cardMeta}>
                    {[movie.director, movie.year].filter(Boolean).join(' · ')}
                  </div>
                )}
                {movie.genre && <div className={styles.cardMeta}>{movie.genre}</div>}
                <div className={styles.cardBadges}>
                  {movie.format && <Badge variant={FORMAT_COLOR[movie.format] || 'default'}>{movie.format}</Badge>}
                  {movie.language && <Badge variant="default">{movie.language}</Badge>}
                </div>
                {movie.durationMin && (
                  <div className={styles.cardDuration}>{movie.durationMin} min</div>
                )}
              </div>

              <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(movie)}>Editar</Button>
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(movie)} title="Eliminar" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Form modal ── */}
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
            <input className={styles.input} type="number" value={form.durationMin} onChange={e => set('durationMin', e.target.value)} />
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
            <select className={styles.input} value={form.ageRating} onChange={e => set('ageRating', e.target.value)}>
              {['G', 'PG', 'PG-13', 'R', 'NC-17'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Estado</label>
            <select className={styles.input} value={form.active ? 'active' : 'inactive'} onChange={e => set('active', e.target.value === 'active')}>
              <option value="active">Activa</option>
              <option value="inactive">Baja</option>
            </select>
          </div>
          <div>
            <label className={styles.label}>Imagen URL (póster)</label>
            <input className={styles.input} value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://…" />
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.label}>Descripción</label>
            <textarea className={styles.input} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* ── Detail modal ── */}
      <Modal open={modal === 'detail'} onClose={() => setModal(null)} title="Detalle de película" size="sm">
        {editing && (
          <div className={styles.detail}>
            <h2 className={styles.detailTitle}>{editing.title}</h2>
            <p className={styles.detailDir}>{editing.director} · {editing.year}</p>
            <div className={styles.detailBadges}>
              <Badge variant={FORMAT_COLOR[editing.format] || 'default'}>{editing.format}</Badge>
              <Badge variant={RATING_COLOR[editing.ageRating] || 'default'}>{editing.ageRating}</Badge>
              <Badge variant={editing.active ? STATUS_MAP.active.v : STATUS_MAP.inactive.v} dot>
                {editing.active ? STATUS_MAP.active.label : STATUS_MAP.inactive.label}
              </Badge>
            </div>
            <div className={styles.detailGrid}>
              <div><span className={styles.detailLbl}>Género</span><span>{editing.genre || '-'}</span></div>
              <div><span className={styles.detailLbl}>Duración</span><span>{editing.durationMin} min</span></div>
              <div><span className={styles.detailLbl}>Idioma</span><span>{editing.language || '-'}</span></div>
              <div><span className={styles.detailLbl}>Formato</span><span>{editing.format || '-'}</span></div>
            </div>
            {editing.description && <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.6 }}>{editing.description}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setModal(null)}>Cerrar</Button>
              <Button variant="primary" icon={Edit2} onClick={() => openEdit(editing)}>Editar</Button>
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
