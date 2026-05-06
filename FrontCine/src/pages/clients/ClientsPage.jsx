import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Users, GraduationCap, Star, UserCheck, Plus, Edit2, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { useApp } from '../../contexts/AppContext';
import { clientsService } from '../../services/clientsService';
import styles from './ClientsPage.module.css';

const STATUS_COLOR = { ACTIVE: 'green', INACTIVE: 'default', SUSPENDED: 'red' };
const STATUS_LABEL = { ACTIVE: 'Activo', INACTIVE: 'Inactivo', SUSPENDED: 'Suspendido' };

const EMPTY_FORM = {
  name: '', username: '', email: '', password: '',
  dateOfBirth: '', student: false,
};

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?';
}

// Backend /auth/register may return { userId, username } instead of { id, name }
function normalizeClient(apiRes, formData = {}) {
  return {
    ...apiRes,
    id:       apiRes?.id ?? apiRes?.userId ?? apiRes?.clientId ?? ('CLI-' + Date.now()),
    name:     apiRes?.name ?? formData.name ?? apiRes?.username ?? '-',
    email:    apiRes?.email ?? formData.email ?? '-',
    username: apiRes?.username ?? formData.username ?? '',
    student:  apiRes?.student ?? apiRes?.isStudent ?? formData.student ?? false,
    status:   apiRes?.status ?? 'ACTIVE',
  };
}

export default function ClientsPage() {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [searched, setSearched]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [detail, setDetail]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modal, setModal]         = useState(null);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debounceRef = useRef(null);
  const { toast } = useApp();

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const data = await clientsService.search(q);
      const raw  = Array.isArray(data) ? data : (data?.content ?? []);
      setResults(raw.map(c => normalizeClient(c)));
      setSearched(true);
    } catch {
      toast('Error al buscar clientes.', 'error');
      setResults([]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal('form');
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name:        row.name ?? '',
      username:    row.username ?? '',
      email:       row.email ?? '',
      password:    '',
      dateOfBirth: row.dateOfBirth ?? row.birthDate ?? '',
      student:     !!(row.student || row.isStudent),
    });
    setModal('form');
  };

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.email.trim()) { toast('El email es obligatorio.', 'error'); return; }
    if (!editing && !form.password.trim()) { toast('La contraseña es obligatoria.', 'error'); return; }
    if (!form.name.trim()) { toast('El nombre es obligatorio.', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        const payload = {
          name:        form.name,
          username:    form.username || undefined,
          email:       form.email,
          dateOfBirth: form.dateOfBirth || null,
          student:     form.student,
        };
        if (form.password.trim()) payload.password = form.password;
        const updated = await clientsService.update(editing.id, payload).catch(() => null);
        const merged  = updated ?? { ...editing, ...payload };
        setResults(prev => prev.map(c => c.id === editing.id ? merged : c));
        if (detail?.id === editing.id) setDetail(merged);
        toast('Cliente actualizado.', 'success');
      } else {
        const payload = {
          name:        form.name,
          username:    form.username || form.email,
          email:       form.email,
          password:    form.password,
          dateOfBirth: form.dateOfBirth || null,
          student:     form.student,
          role:        'CLIENT',
        };
        const raw     = await clientsService.create(payload);
        const created = normalizeClient(raw, payload);
        setResults(prev => [...prev, created]);
        setSearched(true);
        toast('Cliente creado.', 'success');
      }
    } catch (err) {
      if (err?.status === 409) {
        toast('Este email o usuario ya está registrado.', 'error');
      } else if (err?.status === 400) {
        toast('Datos incorrectos. Revisa los campos e inténtalo de nuevo.', 'error');
      } else {
        toast('Error al guardar el cliente.', 'error');
      }
    }
    setSaving(false);
    setModal(null);
  };

  const handleDelete = async () => {
    try {
      await clientsService.remove(deleteTarget.id).catch(() => null);
      setResults(prev => prev.filter(c => c.id !== deleteTarget.id));
      if (detail?.id === deleteTarget.id) setDetail(null);
      toast('Cliente eliminado.', 'warning');
    } catch {
      toast('Error al eliminar el cliente.', 'error');
    }
    setDeleteTarget(null);
  };

  const openDetail = async (row) => {
    setDetail(row);
    setDetailLoading(true);
    try {
      const full = await clientsService.getById(row.id);
      setDetail(full ?? row);
    } catch { /* keep row data */ }
    setDetailLoading(false);
  };

  const students = results.filter(c => c.student || c.isStudent);
  const fidelity = results.filter(c => c.fidelityDiscountEligible);
  const active   = results.filter(c => (c.status ?? 'ACTIVE') === 'ACTIVE');

  const columns = [
    { key: 'id', label: 'ID', width: 80, render: v =>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{v}</span> },
    { key: 'name', label: 'Nombre', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className={styles.detailAvatar} style={{ width: 28, height: 28, fontSize: 11 }}>
          {initials(v ?? row.username)}
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: 12 }}>{v ?? row.username ?? '-'}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{row.username ?? ''}</div>
        </div>
      </div>
    )},
    { key: 'email', label: 'Email', render: v =>
      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{v ?? '-'}</span> },
    { key: 'student', label: 'Tipo', width: 100, render: (v, row) =>
      (v || row.isStudent)
        ? <Badge variant="purple">Estudiante</Badge>
        : <Badge variant="default">Estándar</Badge> },
    { key: 'visitsPerYear', label: 'Visitas/año', width: 100, render: v =>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{v ?? '-'}</span> },
    { key: 'fidelityDiscountEligible', label: 'Fidelidad', width: 110, render: v =>
      v ? <Badge variant="accent" dot>Socio</Badge> : <Badge variant="default">No</Badge> },
    { key: 'status', label: 'Estado', width: 110, render: v => {
      const s = v ?? 'ACTIVE';
      return <Badge variant={STATUS_COLOR[s] ?? 'default'} dot>{STATUS_LABEL[s] ?? s}</Badge>;
    }},
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Clientes"
        subtitle="Búsqueda y gestión de clientes registrados"
        actions={<Button icon={Plus} onClick={openCreate}>Nuevo cliente</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label="Resultados"       value={results.length}  icon={Users}         color="accent" />
        <KPICard label="Activos"          value={active.length}   icon={UserCheck}     color="green" />
        <KPICard label="Estudiantes"      value={students.length} icon={GraduationCap} color="purple" />
        <KPICard label="Socios fidelidad" value={fidelity.length} icon={Star}          color="cyan" />
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nombre, email o usuario…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        {loading && <span className={styles.searchHint}>Buscando…</span>}
        {!loading && searched && (
          <span className={styles.searchHint}>
            {results.length === 0 ? 'Sin resultados.' : `${results.length} resultado${results.length !== 1 ? 's' : ''}`}
          </span>
        )}
        {!loading && !searched && (
          <span className={styles.searchHint}>Escribe para buscar clientes</span>
        )}
      </div>

      {searched && (
        <DataTable
          columns={columns}
          data={results}
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
      )}

      {/* ── Form modal (create / edit) ── */}
      <Modal
        open={modal === 'form'}
        onClose={() => setModal(null)}
        title={editing ? `Editar cliente — ${editing.name ?? editing.email}` : 'Nuevo cliente'}
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
            <label className={styles.formLabel}>{editing ? 'Nueva contraseña (dejar vacío = sin cambio)' : 'Contraseña *'}</label>
            <input className={styles.formInput} type="password" value={form.password}
              onChange={e => setField('password', e.target.value)} placeholder={editing ? '••••••••' : 'Mínimo 6 caracteres'} />
          </div>
          <div>
            <label className={styles.formLabel}>Fecha de nacimiento</label>
            <input className={styles.formInput} type="date" value={form.dateOfBirth}
              onChange={e => setField('dateOfBirth', e.target.value)} />
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
                  <div className={styles.detailName}>{detail.name ?? detail.username ?? '-'}</div>
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
                  <span className={styles.detailVal}>
                    {(detail.student || detail.isStudent) ? 'Estudiante' : 'Estándar'}
                  </span>
                </div>
                <div className={styles.detailCard}>
                  <span className={styles.detailLbl}>Visitas / año</span>
                  <span className={styles.detailVal}>{detail.visitsPerYear ?? '-'}</span>
                </div>
                <div className={styles.detailCard}>
                  <span className={styles.detailLbl}>Fidelidad</span>
                  <span className={styles.detailVal}>{eligible ? 'Sí (> 10 visitas)' : 'No'}</span>
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
                  onClick={() => { setDetail(null); openEdit(detail); }}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" icon={Trash2}
                  onClick={() => { setDetail(null); setDeleteTarget(detail); }}>
                  Eliminar
                </Button>
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
