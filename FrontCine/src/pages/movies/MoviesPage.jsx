import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Eye, Upload, Loader, X } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { moviesService } from '../../services/moviesService';
import { uploadImage } from '../../services/cloudinaryService';
import styles from './MoviesPage.module.css';

const FORMAT_COLOR = { IMAX: 'purple', '4DX': 'red', '3D': 'cyan', '2D': 'default', 'IMAX 3D': 'purple', '2D/3D': 'cyan' };
const RATING_COLOR = { 'PG': 'green', 'PG-13': 'yellow', 'R': 'red' };

const AGE_DISPLAY_TO_API = { 'ALL': 'ALL', '7': 'SEVEN', '12': 'TWELVE', '16': 'SIXTEEN', '18': 'EIGHTEEN' };
const AGE_API_TO_DISPLAY = { 'ALL': 'ALL', 'SEVEN': '7', 'TWELVE': '12', 'SIXTEEN': '16', 'EIGHTEEN': '18' };

const EMPTY_MOVIE = { title: '', durationMin: '', genre: '', language: 'ES', format: '2D', ageRating: '12', active: true, director: '', year: new Date().getFullYear(), description: '', imageUrl: '' };

const MOV_IMG_KEY = 'lumen_movie_posters';
const getStoredPosters = () => { try { return JSON.parse(localStorage.getItem(MOV_IMG_KEY) ?? '{}'); } catch { return {}; } };
const saveStoredPoster = (id, url, title) => { try { const s = getStoredPosters(); const tk = title ? `title:${title}` : null; if (url) { s[String(id)] = url; if (tk) s[tk] = url; } else { delete s[String(id)]; if (tk) delete s[tk]; } localStorage.setItem(MOV_IMG_KEY, JSON.stringify(s)); window.dispatchEvent(new CustomEvent('lumen:poster-updated')); } catch {} };
const mergePosters = (list) => { const s = getStoredPosters(); return list.map(m => ({ ...m, imageUrl: s[String(m.id)] || m.imageUrl || '' })); };

const normalizeMovie = (movie) => {
  const rawRating = movie.ageRating ?? movie.rating ?? '';
  return {
    ...movie,
    durationMin: movie.durationMin ?? movie.duration ?? '',
    ageRating: AGE_API_TO_DISPLAY[rawRating] ?? rawRating,
    imageUrl: movie.imageUrl ?? movie.poster ?? '',
    active: movie.active ?? movie.status === 'active',
  };
};

const toPayload = (movie) => ({
  ...movie,
  durationMin: Number(movie.durationMin),
  year: movie.year ? Number(movie.year) : undefined,
  active: Boolean(movie.active),
  ageRating: AGE_DISPLAY_TO_API[movie.ageRating] ?? movie.ageRating,
});

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_MOVIE);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useApp();
  const { t } = useLanguage();

  const STATUS_MAP = {
    active:   { label: t('movies.status.active'),   v: 'green' },
    inactive: { label: t('movies.status.inactive'), v: 'default' },
  };

  useEffect(() => {
    moviesService.getAll()
      .then(data => setMovies(mergePosters((data ?? []).map(normalizeMovie))))
      .catch(() => toast('No se pudieron cargar las películas.', 'error'));
  }, [toast]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingImg(true);
    try {
      const url = await uploadImage(file);
      set('imageUrl', url);
      toast('Póster subido correctamente.', 'success');
    } catch (err) {
      toast(err.message ?? 'Error al subir el póster.', 'error');
    }
    setUploadingImg(false);
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_MOVIE); setErrors({}); setModal('form'); };
  const openEdit = (movie) => { setEditing(movie); setForm({ ...movie }); setErrors({}); setModal('form'); };
  const validateField = (name, value) => {
    setErrors(e => ({ ...e, [name]: !String(value).trim() ? t('common.fieldRequired') : undefined }));
  };
  const openDetail = (movie) => { setEditing(movie); setModal('detail'); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.durationMin) { toast('Título y duración son obligatorios.', 'error'); return; }
    const payload = toPayload(form);
    if (editing) {
      const saved = normalizeMovie(await moviesService.update(editing.id, payload));
      const merged = { ...saved, imageUrl: form.imageUrl || saved.imageUrl };
      saveStoredPoster(editing.id, merged.imageUrl, form.title);
      setMovies(prev => prev.map(m => m.id === editing.id ? merged : m));
      toast(`"${form.title}" actualizada.`, 'success');
    } else {
      const saved = normalizeMovie(await moviesService.create(payload));
      const merged = { ...saved, imageUrl: form.imageUrl || saved.imageUrl };
      saveStoredPoster(saved.id, merged.imageUrl, form.title);
      setMovies(prev => [...prev, merged]);
      toast(`"${form.title}" añadida.`, 'success');
    }
    setModal(null);
  };

  const handleDelete = async () => {
    await moviesService.remove(deleteTarget.id);
    saveStoredPoster(deleteTarget.id, '', deleteTarget.title);
    setMovies(prev => prev.filter(m => m.id !== deleteTarget.id));
    toast(`"${deleteTarget.title}" eliminada.`, 'warning');
    setDeleteTarget(null);
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const columns = [
    { key: 'title',     label: t('movies.col.title'),    render: (v) => <span className={styles.title}>{v}</span> },
    { key: 'genre',     label: t('movies.col.genre') },
    { key: 'durationMin', label: t('movies.col.duration'), render: v => <span className={styles.mono}>{v} min</span>, width: 90 },
    { key: 'language',  label: t('movies.col.language'), width: 80, render: v => <Badge variant="default">{v}</Badge> },
    { key: 'format',    label: t('movies.col.format'),   width: 90, render: v => <Badge variant={FORMAT_COLOR[v] || 'default'}>{v}</Badge> },
    { key: 'ageRating', label: t('movies.col.rating'),   width: 100, render: v => <Badge variant={RATING_COLOR[v] || 'default'}>{v}</Badge> },
    { key: 'active',    label: t('movies.col.status'),   width: 120, render: v => <Badge variant={v ? STATUS_MAP.active.v : STATUS_MAP.inactive.v} dot>{v ? STATUS_MAP.active.label : STATUS_MAP.inactive.label}</Badge> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('movies.title')}
        subtitle={t('movies.subtitle', { active: movies.filter(m => m.active).length, inactive: movies.filter(m => !m.active).length })}
        actions={<Button icon={Plus} onClick={openCreate}>{t('movies.createBtn')}</Button>}
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
            <Button variant="ghost" size="sm" icon={Eye}   onClick={() => openDetail(row)} title={t('common.edit')} />
            <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)}   title={t('common.edit')} />
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} title={t('common.delete')} />
          </div>
        )}
        bulkActions={(ids, clear) => (
          <Button variant="danger" size="sm" onClick={() => setBulkDeleteIds({ ids, clear })}>
            {t('movies.deleteSelected', { count: ids.length })}
          </Button>
        )}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? t('movies.modalEdit') : t('movies.modalCreate')}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={handleSave}>{editing ? t('common.saveChanges') : t('movies.createMovie')}</Button>
          </div>
        }
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="mov-title">{t('movies.form.title')}</label>
            <input id="mov-title"
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              value={form.title} onChange={e => set('title', e.target.value)}
              onBlur={e => validateField('title', e.target.value)}
              placeholder={t('movies.form.titlePh')}
              aria-invalid={!!errors.title} aria-describedby={errors.title ? 'err-mov-title' : undefined}
            />
            {errors.title && <span id="err-mov-title" role="alert" className={styles.fieldError}>{errors.title}</span>}
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-director">{t('movies.form.director')}</label>
            <input id="mov-director" className={styles.input} value={form.director} onChange={e => set('director', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-year">{t('movies.form.year')}</label>
            <input id="mov-year" className={styles.input} type="number" value={form.year} onChange={e => set('year', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-genre">{t('movies.form.genre')}</label>
            <input id="mov-genre" className={styles.input} value={form.genre} onChange={e => set('genre', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-duration">{t('movies.form.duration')}</label>
            <input id="mov-duration"
              className={`${styles.input} ${errors.durationMin ? styles.inputError : ''}`}
              type="number" value={form.durationMin} onChange={e => set('durationMin', e.target.value)}
              onBlur={e => validateField('durationMin', e.target.value)}
              aria-invalid={!!errors.durationMin} aria-describedby={errors.durationMin ? 'err-mov-dur' : undefined}
            />
            {errors.durationMin && <span id="err-mov-dur" role="alert" className={styles.fieldError}>{errors.durationMin}</span>}
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-language">{t('movies.form.language')}</label>
            <select id="mov-language" className={styles.input} value={form.language} onChange={e => set('language', e.target.value)}>
              <option value="ES">{t('movies.form.langES')}</option>
              <option value="VO">{t('movies.form.langVO')}</option>
              <option value="VOSE">{t('movies.form.langVOSE')}</option>
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-format">{t('movies.form.format')}</label>
            <select id="mov-format" className={styles.input} value={form.format} onChange={e => set('format', e.target.value)}>
              {['2D', '3D', 'IMAX', '4DX', 'IMAX 3D', '2D/3D'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-rating">{t('movies.form.rating')}</label>
            <select id="mov-rating" className={styles.input} value={form.ageRating} onChange={e => set('ageRating', e.target.value)}>
              {['ALL', '7', '12', '16', '18'].map(r => <option key={r} value={r}>{r === 'ALL' ? 'Todos' : `+${r}`}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="mov-status">{t('movies.form.status')}</label>
            <select id="mov-status" className={styles.input} value={form.active ? 'active' : 'inactive'} onChange={e => set('active', e.target.value === 'active')}>
              <option value="active">{t('movies.status.active')}</option>
              <option value="inactive">{t('movies.status.inactive')}</option>
            </select>
          </div>
          <div>
            <label className={styles.label}>{t('movies.form.poster')}</label>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            {form.imageUrl ? (
              <div className={styles.posterPreviewWrap}>
                <img src={form.imageUrl} alt="Vista previa" className={styles.imagePreview} onError={e => { e.currentTarget.style.display = 'none'; }} />
                <button type="button" className={styles.imgRemoveBtn} onClick={() => set('imageUrl', '')}>
                  <X size={11} /> {t('movies.poster.remove')}
                </button>
              </div>
            ) : (
              <button type="button" className={styles.imgUploadBtn} onClick={() => fileInputRef.current?.click()} disabled={uploadingImg}>
                {uploadingImg ? <Loader size={14} className={styles.spin} /> : <Upload size={14} />}
                {uploadingImg ? t('movies.poster.uploading') : t('movies.poster.select')}
              </button>
            )}
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="mov-desc">{t('movies.form.description')}</label>
            <textarea id="mov-desc" className={styles.input} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'detail'} onClose={() => setModal(null)} title={t('movies.modalDetail')} size="sm">
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
              <div><span className={styles.detailLbl}>{t('movies.detail.genre')}</span><span>{editing.genre}</span></div>
              <div><span className={styles.detailLbl}>{t('movies.detail.duration')}</span><span>{editing.durationMin} min</span></div>
              <div><span className={styles.detailLbl}>{t('movies.detail.language')}</span><span>{editing.language}</span></div>
              <div><span className={styles.detailLbl}>{t('movies.detail.status')}</span><span>{editing.active ? STATUS_MAP.active.label : STATUS_MAP.inactive.label}</span></div>
            </div>
            {editing.description && <p style={{ marginTop: 12, color: 'var(--text-2)', fontSize: 12 }}>{editing.description}</p>}
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={t('movies.deleteTitle')} danger
        message={t('movies.deleteMsg', { title: deleteTarget?.title ?? '' })}
        confirmLabel={t('common.delete')} />

      <ConfirmModal
        open={!!bulkDeleteIds}
        onClose={() => setBulkDeleteIds(null)}
        onConfirm={() => {
          setMovies(prev => prev.filter(m => !bulkDeleteIds.ids.includes(m.id)));
          toast(`${bulkDeleteIds.ids.length} película(s) eliminadas.`, 'warning');
          bulkDeleteIds.clear();
          setBulkDeleteIds(null);
        }}
        title={t('movies.deleteBulkTitle')} danger
        message={t('movies.deleteBulkMsg', { count: bulkDeleteIds?.ids.length })}
        confirmLabel={t('movies.deleteAll')} />
    </div>
  );
}
