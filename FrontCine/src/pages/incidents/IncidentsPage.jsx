import { useState, useEffect } from 'react';
import { Plus, Edit2, CheckCircle, Eye } from 'lucide-react';
import PageHeader  from '../../components/shared/PageHeader';
import DataTable   from '../../components/shared/DataTable';
import Badge       from '../../components/ui/Badge';
import Button      from '../../components/ui/Button';
import Modal       from '../../components/ui/Modal';
import KPICard     from '../../components/shared/KPICard';
import { AlertTriangle, Clock, CheckSquare } from 'lucide-react';
import { useApp }  from '../../contexts/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { incidentsService } from '../../services/incidentsService';
import { usersService }     from '../../services/usersService';
import SkeletonPage from '../../components/shared/Skeleton';
import styles from './IncidentsPage.module.css';

const PRIORITY_COLOR  = { critical: 'red', high: 'yellow', medium: 'accent', low: 'green' };
const STATUS_COLOR    = { open: 'red', in_progress: 'yellow', resolved: 'green' };
const CATEGORY_COLOR  = { Técnico: 'accent', Infraestructura: 'purple', Mobiliario: 'cyan', Software: 'green', Seguridad: 'red', Operativo: 'yellow' };
const CATEGORIES      = ['Técnico', 'Infraestructura', 'Mobiliario', 'Software', 'Seguridad', 'Operativo'];

const EMPTY = { title: '', category: 'Técnico', priority: 'medium', status: 'open', room: '', description: '', assigned_to: '' };

export default function IncidentsPage() {
  const { toast } = useApp();
  const { t } = useLanguage();
  const [incidents, setIncidents]     = useState([]);
  const [staffUsers, setStaffUsers]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(null);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(EMPTY);
  const [detail, setDetail]           = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const PRIORITY_MAP = {
    critical: { label: t('incidents.priority.critical'), v: 'red' },
    high:     { label: t('incidents.priority.high'),     v: 'yellow' },
    medium:   { label: t('incidents.priority.medium'),   v: 'accent' },
    low:      { label: t('incidents.priority.low'),      v: 'green' },
  };
  const STATUS_MAP = {
    open:        { label: t('incidents.status.open'),        v: 'red' },
    in_progress: { label: t('incidents.status.in_progress'), v: 'yellow' },
    resolved:    { label: t('incidents.status.resolved'),    v: 'green' },
  };

  useEffect(() => {
    Promise.all([
      incidentsService.getAll().catch(() => []),
      usersService.getAll().catch(() => []),
    ]).then(([inc, users]) => {
      setIncidents(Array.isArray(inc) ? inc : []);
      const staff = Array.isArray(users)
        ? users.filter(u => ['maintenance', 'operator', 'supervisor', 'admin'].includes((u.role ?? '').toLowerCase()))
        : [];
      setStaffUsers(staff);
    }).finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal('form'); };
  const openEdit   = (i)  => { setEditing(i);   setForm({ ...i }); setModal('form'); };
  const set        = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = filterStatus === 'all' ? incidents : incidents.filter(i => i.status === filterStatus);

  const handleSave = async () => {
    if (!form.title.trim()) { toast(t('incidents.form.title') + ' ' + t('common.confirmDelete'), 'error'); return; }
    try {
      if (editing) {
        const updated = await incidentsService.update(editing.id, form).catch(() => null);
        setIncidents(p => p.map(i => i.id === editing.id ? (updated ?? { ...i, ...form }) : i));
        toast(t('incidents.modalEdit') + ' ✓', 'success');
      } else {
        const created = await incidentsService.create(form);
        setIncidents(p => [...p, created]);
        toast(t('incidents.register') + ' ✓', 'success');
      }
      setModal(null);
    } catch (err) {
      toast(err?.status === 401 ? 'Sesión expirada.' : 'Error al guardar la incidencia.', 'error');
    }
  };

  const resolve = async (inc) => {
    try {
      const updated = await incidentsService.update(inc.id, { ...inc, status: 'resolved' });
      setIncidents(p => p.map(i => i.id === inc.id ? (updated ?? { ...i, status: 'resolved' }) : i));
      toast(`${t('incidents.markResolved')} ${inc.id}`, 'success');
    } catch {
      toast('Error al resolver la incidencia.', 'error');
    }
  };

  const columns = [
    { key: 'id',          label: t('incidents.col.id'),         width: 90,  render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{v}</span> },
    { key: 'title',       label: t('incidents.col.title'),                   render: v => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'category',    label: t('incidents.col.category'),   width: 120, render: v => <Badge variant={CATEGORY_COLOR[v] || 'default'}>{t(`incidents.categories.${v}`) || v}</Badge> },
    { key: 'priority',    label: t('incidents.col.priority'),   width: 100, render: v => <Badge variant={PRIORITY_MAP[v]?.v || 'default'}>{PRIORITY_MAP[v]?.label}</Badge> },
    { key: 'room',        label: t('incidents.col.location'),   width: 160, render: v => <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{v || '—'}</span> },
    { key: 'assigned_to', label: t('incidents.col.assignedTo'), width: 140, render: v => v ? <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{v}</span> : <span style={{ color: 'var(--text-3)' }}>{t('incidents.form.unassigned')}</span> },
    { key: 'status',      label: t('incidents.col.status'),     width: 120, render: v => <Badge variant={STATUS_MAP[v]?.v || 'default'} dot>{STATUS_MAP[v]?.label}</Badge> },
    { key: 'updated_at',  label: t('incidents.col.updated'),    width: 130, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{v}</span> },
  ];

  const open     = incidents.filter(i => i.status !== 'resolved');
  const critical = incidents.filter(i => i.priority === 'critical' && i.status !== 'resolved');

  if (loading) return <SkeletonPage />;

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('incidents.title')}
        subtitle={t('incidents.subtitle', { active: open.length, critical: critical.length })}
        actions={<Button icon={Plus} onClick={openCreate}>{t('incidents.createBtn')}</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label={t('incidents.kpi.open')}           value={incidents.filter(i => i.status === 'open').length}        icon={AlertTriangle} color="red" />
        <KPICard label={t('incidents.kpi.inProgress')}     value={incidents.filter(i => i.status === 'in_progress').length}  icon={Clock}         color="yellow" />
        <KPICard label={t('incidents.kpi.resolved')}       value={incidents.filter(i => i.status === 'resolved').length}     icon={CheckSquare}   color="green" />
        <KPICard label={t('incidents.kpi.criticalActive')} value={critical.length}                                           icon={AlertTriangle}  color={critical.length > 0 ? 'red' : 'green'} />
      </div>

      <div className={styles.filterRow}>
        {[[
          'all',
          t('incidents.filter.all'),
        ], ...Object.entries(STATUS_MAP).map(([k, { label }]) => [k, label])].map(([k, label]) => (
          <button key={k} className={`${styles.filterBtn} ${filterStatus === k ? styles.filterActive : ''}`}
            onClick={() => setFilterStatus(k)}>
            {label}
            <span className={styles.filterCount}>{k === 'all' ? incidents.length : incidents.filter(i => i.status === k).length}</span>
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['id', 'title', 'room', 'assigned_to']}
        onRowClick={setDetail}
        rowActions={(row) => (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Eye}         onClick={() => setDetail(row)} />
            <Button variant="ghost" size="sm" icon={Edit2}       onClick={() => openEdit(row)} />
            {row.status !== 'resolved' && <Button variant="ghost" size="sm" icon={CheckCircle} onClick={() => resolve(row)} title={t('incidents.markResolved')} />}
          </div>
        )}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? t('incidents.modalEdit') : t('incidents.modalCreate')}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
            <Button variant="primary"   onClick={handleSave}>{editing ? t('common.save') : t('incidents.register')}</Button>
          </div>
        }
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="inc-title">{t('incidents.form.title')}</label>
            <input id="inc-title" className={styles.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder={t('incidents.form.titlePh')} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inc-cat">{t('incidents.form.category')}</label>
            <select id="inc-cat" className={styles.input} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{t(`incidents.categories.${c}`) || c}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="inc-priority">{t('incidents.form.priority')}</label>
            <select id="inc-priority" className={styles.input} value={form.priority} onChange={e => set('priority', e.target.value)}>
              {Object.entries(PRIORITY_MAP).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="inc-room">{t('incidents.form.location')}</label>
            <input id="inc-room" className={styles.input} value={form.room} onChange={e => set('room', e.target.value)} placeholder={t('incidents.form.locationPh')} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inc-assign">{t('incidents.form.assignTo')}</label>
            <select id="inc-assign" className={styles.input} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
              <option value="">{t('incidents.form.unassigned')}</option>
              {staffUsers.map(u => (
                <option key={u.id ?? u.username} value={u.username ?? u.name}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="inc-status">{t('incidents.form.status')}</label>
            <select id="inc-status" className={styles.input} value={form.status} onChange={e => set('status', e.target.value)}>
              {Object.entries(STATUS_MAP).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="inc-desc">{t('incidents.form.description')}</label>
            <textarea id="inc-desc" className={`${styles.input} ${styles.textarea}`} value={form.description} onChange={e => set('description', e.target.value)} placeholder={t('incidents.form.descPh')} rows={4} />
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.id || 'Detalle'} size="md">
        {detail && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <h3 className={styles.detailTitle}>{detail.title}</h3>
              <div className={styles.detailBadges}>
                <Badge variant={PRIORITY_MAP[detail.priority]?.v}>{PRIORITY_MAP[detail.priority]?.label}</Badge>
                <Badge variant={CATEGORY_COLOR[detail.category] || 'default'}>{t(`incidents.categories.${detail.category}`) || detail.category}</Badge>
                <Badge variant={STATUS_MAP[detail.status]?.v} dot>{STATUS_MAP[detail.status]?.label}</Badge>
              </div>
            </div>
            <div className={styles.detailGrid}>
              <div><span className={styles.detailLbl}>{t('incidents.detail.location')}</span><span>{detail.room || '—'}</span></div>
              <div><span className={styles.detailLbl}>{t('incidents.detail.reportedBy')}</span><span style={{ fontFamily: 'var(--mono)' }}>{detail.reported_by}</span></div>
              <div><span className={styles.detailLbl}>{t('incidents.detail.assignedTo')}</span><span style={{ fontFamily: 'var(--mono)' }}>{detail.assigned_to || '—'}</span></div>
              <div><span className={styles.detailLbl}>{t('incidents.detail.created')}</span><span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{detail.created_at}</span></div>
            </div>
            {detail.description && (
              <div className={styles.description}>
                <p className={styles.detailLbl} style={{ marginBottom: 6 }}>{t('incidents.detail.description')}</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{detail.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
