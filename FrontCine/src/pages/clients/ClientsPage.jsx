import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Users, GraduationCap, Star, UserCheck, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import PageHeader    from '../../components/shared/PageHeader';
import DataTable     from '../../components/shared/DataTable';
import Badge         from '../../components/ui/Badge';
import Button        from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard       from '../../components/shared/KPICard';
import { useApp }    from '../../contexts/AppContext';
import { clientsService } from '../../services/clientsService';
import styles from './ClientsPage.module.css';

/* ── Local persistence ───────────────────────────────── */
const LOCAL_KEY  = 'lumen_clients';
const loadLocal  = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]'); } catch { return []; } };
const saveLocal  = (list) => localStorage.setItem(LOCAL_KEY, JSON.stringify(list.filter(c => c._local)));

/* ── Constants ───────────────────────────────────────── */
const STATUS_COLOR = { ACTIVE: 'green', INACTIVE: 'default', SUSPENDED: 'red' };
const STATUS_LABEL = { ACTIVE: 'Activo', INACTIVE: 'Inactivo', SUSPENDED: 'Suspendido' };

const EMPTY_FORM = {
  name: '', username: '', email: '', password: '',
  dateOfBirth: '', student: false, visitsPerYear: '',
};

/* ── Helpers ─────────────────────────────────────────── */
function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?';
}

function normalizeClient(raw, fallback = {}) {
  const visits = Number(raw?.visitsPerYear ?? fallback.visitsPerYear ?? 0);
  return {
    ...raw,
    id:                      raw?.id ?? raw?.userId ?? raw?.clientId ?? ('CLI-' + Date.now()),
    name:                    raw?.name ?? fallback.name ?? raw?.username ?? '-',
    email:                   raw?.email ?? fallback.email ?? '-',
    username:                raw?.username ?? fallback.username ?? '',
    student:                 raw?.student ?? raw?.isStudent ?? fallback.student ?? false,
    status:                  raw?.status ?? 'ACTIVE',
    visitsPerYear:           visits,
    fidelityDiscountEligible: raw?.fidelityDiscountEligible ?? (visits >= 10),
    dateOfBirth:             raw?.dateOfBirth ?? raw?.birthDate ?? fallback.dateOfBirth ?? null,
  };
}

/* ── Component ───────────────────────────────────────── */
export default function ClientsPage() {
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [query,        setQuery]        = useState('');
  const [filterType,   setFilterType]   = useState('all');
  const [detail,       setDetail]       = useState(null);
  const [detailLoading,setDetailLoading]= useState(false);
  const [modal,        setModal]        = useState(null);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast } = useApp();
  const fetchedRef = useRef(false);

  /* ── Load on mount ───────────────────────────────── */
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const local = loadLocal();
    if (local.length) setClients(local);

    clientsService.getAll()
      .then(data => {
        const backend  = (Array.isArray(data) ? data : (data?.content ?? [])).map(c => normalizeClient(c));
        const localOnly = local.filter(lc => lc._local && !backend.some(bc => bc.email === lc.email));
        setClients([...backend, ...localOnly]);
      })
      .catch(() => {/* keep local */})
      .finally(() => setLoading(false));
  }, []);

  /* ── Filtered list ───────────────────────────────── */
  const filtered = useMemo(() => {
    let list = clients;
    if (filterType === 'student')  list = list.filter(c => c.student || c.isStudent);
    if (filterType === 'fidelity') list = list.filter(c => c.fidelityDiscountEligible);
    if (filterType === 'active')   list = list.filter(c => (c.status ?? 'ACTIVE') === 'ACTIVE');
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(c =>
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.username ?? '').toLowerCase().includes(q)
    );
  }, [clients, query, filterType]);

  /* ── KPIs ────────────────────────────────────────── */
  const students = clients.filter(c => c.student || c.isStudent);
  const fidelity = clients.filter(c => c.fidelityDiscountEligible);
  const active   = clients.filter(c => (c.status ?? 'ACTIVE') === 'ACTIVE');

  /* ── Form helpers ────────────────────────────────── */
  const setField   = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal('form'); };
  const openEdit   = (row) => {
    setEditing(row);
    setForm({
      name:         row.name ?? '',
      username:     row.username ?? '',
      email:        row.email ?? '',
      password:     '',
      dateOfBirth:  row.dateOfBirth ?? row.birthDate ?? '',
      student:      !!(row.student || row.isStudent),
      visitsPerYear: String(row.visitsPerYear ?? ''),
    });
    setModal('form');
  };

  /* ── Save ────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.name.trim())  { toast('El nombre es obligatorio.', 'error');     return; }
    if (!form.email.trim()) { toast('El email es obligatorio.', 'error');      return; }
    if (!editing && !form.password.trim()) { toast('La contraseña es obligatoria.', 'error'); return; }
    setSaving(true);

    const visits   = form.visitsPerYear ? Number(form.visitsPerYear) : 0;
    const fidelOk  = visits >= 10;
    const payload  = {
      name:                    form.name,
      username:                form.username || form.email,
      email:                   form.email,
      dateOfBirth:             form.dateOfBirth || null,
      student:                 form.student,
      visitsPerYear:           visits || undefined,
      fidelityDiscountEligible: fidelOk,
      role:                    'CLIENT',
    };
    if (!editing)            payload.password = form.password;
    if (editing && form.password.trim()) payload.password = form.password;

    try {
      if (editing) {
        const updated = await clientsService.update(editing.id, payload).catch(() => null);
        const merged  = normalizeClient(updated ?? {}, { ...editing, ...payload });
        setClients(prev => {
          const next = prev.map(c => c.id === editing.id ? merged : c);
          saveLocal(next);
          return next;
        });
        if (detail?.id === editing.id) setDetail(merged);
        toast('Cliente actualizado.', 'success');
      } else {
        try {
          const raw     = await clientsService.create(payload);
          const created = normalizeClient(raw, payload);
          setClients(prev => { const next = [...prev, created]; saveLocal(next); return next; });
          toast('Cliente creado.', 'success');
        } catch (err) {
          if (err?.status === 409) {
            toast('Este email o usuario ya está registrado.', 'error');
            setSaving(false); setModal(null); return;
          }
          // Local fallback: backend not available
          const local = normalizeClient({}, payload);
          local._local = true;
          setClients(prev => { const next = [...prev, local]; saveLocal(next); return next; });
          toast('Cliente guardado localmente.', 'warning');
        }
      }
    } catch {
      // Edit fallback: update locally
      const merged = normalizeClient({}, { ...editing, ...payload });
      merged._local = editing?._local ?? true;
      setClients(prev => {
        const next = prev.map(c => c.id === editing.id ? merged : c);
        saveLocal(next);
        return next;
      });
      toast('Cliente actualizado localmente.', 'warning');
    }

    setSaving(false);
    setModal(null);
  };

  /* ── Delete ──────────────────────────────────────── */
  const handleDelete = async () => {
    await clientsService.remove(deleteTarget.id).catch(() => null);
    setClients(prev => {
      const next = prev.filter(c => c.id !== deleteTarget.id);
      saveLocal(next);
      return next;
    });
    if (detail?.id === deleteTarget.id) setDetail(null);
    toast('Cliente eliminado.', 'warning');
    setDeleteTarget(null);
  };

  /* ── Detail ──────────────────────────────────────── */
  const openDetail = async (row) => {
    setDetail(row);
    if (row._local) return;
    setDetailLoading(true);
    try {
      const full = await clientsService.getById(row.id);
      setDetail(normalizeClient(full, row) ?? row);
    } catch { /* keep row */ }
    setDetailLoading(false);
  };

  /* ── Refresh from backend ────────────────────────── */
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data    = await clientsService.getAll();
      const backend = (Array.isArray(data) ? data : (data?.content ?? [])).map(c => normalizeClient(c));
      const local   = loadLocal();
      const localOnly = local.filter(lc => lc._local && !backend.some(bc => bc.email === lc.email));
      setClients([...backend, ...localOnly]);
      toast('Lista actualizada.', 'success');
    } catch {
      toast('No se pudo conectar con el servidor.', 'error');
    }
    setLoading(false);
  };

  /* ── Columns ─────────────────────────────────────── */
  const columns = [
    { key: 'name', label: 'Cliente', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className={styles.detailAvatar} style={{ width: 28, height: 28, fontSize: 11 }}>
          {initials(v ?? row.username)}
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: 12 }}>
            {v ?? row.username ?? '-'}
            {row._local && <span style={{ marginLeft: 5, fontSize: 9, color: 'var(--yellow)', fontWeight: 600 }}>LOCAL</span>}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{row.email ?? ''}</div>
        </div>
      </div>
    )},
    { key: 'student', label: 'Tipo', width: 110, render: (v, row) =>
      (v || row.isStudent)
        ? <Badge variant="purple">Estudiante</Badge>
        : <Badge variant="default">Estándar</Badge> },
    { key: 'visitsPerYear', label: 'Visitas/año', width: 100, render: v =>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{v ?? 0}</span> },
    { key: 'fidelityDiscountEligible', label: 'Fidelidad', width: 110, render: v =>
      v ? <Badge variant="accent" dot>Socio −10%</Badge> : <Badge variant="default">No</Badge> },
    { key: 'status', label: 'Estado', width: 110, render: v => {
      const s = v ?? 'ACTIVE';
      return <Badge variant={STATUS_COLOR[s] ?? 'default'} dot>{STATUS_LABEL[s] ?? s}</Badge>;
    }},
  ];

  const fidelVisits = Number(form.visitsPerYear ?? 0);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} clientes · ${fidelity.length} socios · ${students.length} estudiantes`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon={RefreshCw} onClick={handleRefresh} disabled={loading} />
            <Button icon={Plus} onClick={openCreate}>Nuevo cliente</Button>
          </div>
        }
      />

      <div className={styles.kpiRow}>
        <KPICard label="Total clientes"    value={clients.length}  icon={Users}         color="accent" />
        <KPICard label="Activos"           value={active.length}   icon={UserCheck}     color="green" />
        <KPICard label="Estudiantes"       value={students.length} icon={GraduationCap} color="purple" />
        <KPICard label="Socios fidelidad"  value={fidelity.length} icon={Star}          color="cyan" />
      </div>

      {/* ── Search + filter bar ── */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nombre, email o usuario…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all','Todos'],['active','Activos'],['student','Estudiantes'],['fidelity','Socios']].map(([k, label]) => (
            <button key={k}
              className={`${styles.filterBtn ?? ''} ${filterType === k ? styles.filterActive ?? '' : ''}`}
              style={{
                padding: '4px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
                background: filterType === k ? 'var(--accent)' : 'var(--bg-2)',
                color: filterType === k ? 'var(--bg-1)' : 'var(--text-2)',
                fontSize: 11, cursor: 'pointer', fontWeight: filterType === k ? 700 : 400,
              }}
              onClick={() => setFilterType(k)}>
              {label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
          {loading ? 'Cargando…' : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['name', 'email', 'username']}
        onRowClick={openDetail}
        rowKey="id"
        rowActions={(row) => (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Edit2}  onClick={() => openEdit(row)}         title="Editar" />
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)}  title="Eliminar" />
          </div>
        )}
      />

      {/* ── Form modal ── */}
      <Modal
        open={modal === 'form'}
        onClose={() => setModal(null)}
        title={editing ? `Editar — ${editing.name ?? editing.email}` : 'Nuevo cliente'}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {editing ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </div>
        }
      >
        <div className={styles.formGrid}>
          <div>
            <label className={styles.formLabel}>Nombre completo *</label>
            <input className={styles.formInput} value={form.name}
              onChange={e => setField('name', e.target.value)} placeholder="María García" />
          </div>
          <div>
            <label className={styles.formLabel}>Usuario</label>
            <input className={styles.formInput} value={form.username}
              onChange={e => setField('username', e.target.value)} placeholder="maria.garcia" />
          </div>
          <div>
            <label className={styles.formLabel}>Email *</label>
            <input className={styles.formInput} type="email" value={form.email}
              onChange={e => setField('email', e.target.value)} placeholder="maria@ejemplo.com" />
          </div>
          <div>
            <label className={styles.formLabel}>{editing ? 'Nueva contraseña (vacío = sin cambio)' : 'Contraseña *'}</label>
            <input className={styles.formInput} type="password" value={form.password}
              onChange={e => setField('password', e.target.value)} placeholder={editing ? '••••••••' : 'Mínimo 6 caracteres'} />
          </div>
          <div>
            <label className={styles.formLabel}>Fecha de nacimiento</label>
            <input className={styles.formInput} type="date" value={form.dateOfBirth}
              onChange={e => setField('dateOfBirth', e.target.value)} />
          </div>
          <div>
            <label className={styles.formLabel}>Visitas por año</label>
            <input className={styles.formInput} type="number" min="0" value={form.visitsPerYear}
              onChange={e => setField('visitsPerYear', e.target.value)} placeholder="0" />
            {fidelVisits >= 10 && (
              <p style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={10} /> Elegible para descuento fidelidad −10%
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
            <input type="checkbox" id="student-check" checked={form.student}
              onChange={e => setField('student', e.target.checked)}
              style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer' }} />
            <label htmlFor="student-check" style={{ fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
              Cliente estudiante (precio reducido)
            </label>
          </div>
        </div>
      </Modal>

      {/* ── Detail modal ── */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detailLoading ? 'Cargando…' : `Cliente — ${detail?.name ?? detail?.username ?? detail?.id}`}
        size="sm"
      >
        {detail && !detailLoading && (() => {
          const eligible = detail.fidelityDiscountEligible;
          const status   = detail.status ?? 'ACTIVE';
          return (
            <div className={styles.detail}>
              <div className={styles.detailHeader}>
                <div className={styles.detailAvatar}>{initials(detail.name ?? detail.username)}</div>
                <div>
                  <div className={styles.detailName}>
                    {detail.name ?? detail.username ?? '-'}
                    {detail._local && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--yellow)', fontWeight: 600 }}>GUARDADO LOCALMENTE</span>}
                  </div>
                  <div className={styles.detailEmail}>{detail.email ?? '-'}</div>
                </div>
              </div>

              {eligible && (
                <div className={styles.fidelityBanner}>
                  <Star size={14} />
                  Socio fidelidad — descuento −10% en entradas de adulto
                </div>
              )}

              <div className={styles.detailGrid}>
                <div className={styles.detailCard}>
                  <span className={styles.detailLbl}>Usuario</span>
                  <span className={styles.detailVal}>{detail.username ?? '-'}</span>
                </div>
                <div className={styles.detailCard}>
                  <span className={styles.detailLbl}>Estado</span>
                  <Badge variant={STATUS_COLOR[status] ?? 'default'} dot>{STATUS_LABEL[status] ?? status}</Badge>
                </div>
                <div className={styles.detailCard}>
                  <span className={styles.detailLbl}>Tipo</span>
                  <span className={styles.detailVal}>{(detail.student || detail.isStudent) ? 'Estudiante' : 'Estándar'}</span>
                </div>
                <div className={styles.detailCard}>
                  <span className={styles.detailLbl}>Visitas / año</span>
                  <span className={styles.detailVal} style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>
                    {detail.visitsPerYear ?? 0}
                    {!eligible && Number(detail.visitsPerYear ?? 0) > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 6 }}>
                        ({10 - Number(detail.visitsPerYear)} para fidelidad)
                      </span>
                    )}
                  </span>
                </div>
                <div className={styles.detailCard}>
                  <span className={styles.detailLbl}>Fidelidad</span>
                  <span className={styles.detailVal}>{eligible ? '✓ Sí (≥ 10 visitas)' : 'No'}</span>
                </div>
                <div className={styles.detailCard}>
                  <span className={styles.detailLbl}>Fecha nacimiento</span>
                  <span className={styles.detailVal} style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                    {detail.dateOfBirth ?? detail.birthDate ?? '-'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                <Button variant="secondary" size="sm" icon={Edit2}
                  onClick={() => { setDetail(null); openEdit(detail); }}>Editar</Button>
                <Button variant="danger" size="sm" icon={Trash2}
                  onClick={() => { setDetail(null); setDeleteTarget(detail); }}>Eliminar</Button>
              </div>
            </div>
          );
        })()}
        {detailLoading && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
            Cargando datos del cliente…
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar cliente"
        danger
        message={`¿Eliminar el cliente ${deleteTarget?.name ?? deleteTarget?.email}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar cliente"
      />
    </div>
  );
}
