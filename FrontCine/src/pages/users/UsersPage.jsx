import { useState, useEffect } from 'react';
import { Plus, Edit2, Lock, Unlock, Shield } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { Users, UserCheck, UserX } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/usersService';
import styles from './UsersPage.module.css';

const ROLES = {
  admin:       { label: 'Administrador', color: 'red',    permissions: ['*'] },
  supervisor:  { label: 'Supervisor',    color: 'purple', permissions: ['read', 'create', 'update', 'approve'] },
  operator:    { label: 'Operador',      color: 'accent', permissions: ['read', 'create', 'update'] },
  ticket:      { label: 'Taquilla',      color: 'cyan',   permissions: ['read', 'create_reservation'] },
  maintenance: { label: 'Mantenimiento', color: 'yellow', permissions: ['read', 'create_incident', 'update_incident'] },
  readonly:    { label: 'Consulta',      color: 'green',  permissions: ['read'] },
};

const PERMISSIONS_DETAIL = {
  admin: ['Acceso total al sistema', 'Gestión de usuarios y permisos', 'Auditoría completa', 'Configuración del sistema'],
  supervisor: ['Ver todos los módulos', 'Crear y editar registros', 'Aprobar acciones', 'Ver informes'],
  operator: ['Ver todos los módulos', 'Crear y editar registros', 'Registrar incidencias'],
  ticket: ['Ver reservas', 'Crear y cancelar reservas', 'Ver horarios'],
  maintenance: ['Ver incidencias', 'Crear y actualizar incidencias', 'Ver inventario'],
  readonly: ['Solo lectura en todos los módulos'],
};

const EMPTY = { name: '', username: '', email: '', role: 'operator', status: 'active' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [permDetail, setPermDetail] = useState(null);
  const { toast } = useApp();
  const { user: me } = useAuth();

  useEffect(() => {
    usersService.getAll().then(setUsers).catch(() => {});
  }, []);

  const isAdmin = me?.role === 'admin';
  const openCreate = () => { if (!isAdmin) return; setEditing(null); setForm(EMPTY); setModal('form'); };
  const openEdit = (u) => { if (!isAdmin) return; setEditing(u); setForm({ ...u }); setModal('form'); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim() || !form.username.trim() || !form.email.trim()) { toast('Nombre, usuario y email son obligatorios.', 'error'); return; }
    if (editing) {
      setUsers(p => p.map(u => u.id === editing.id ? { ...u, ...form } : u));
      toast('Usuario actualizado.', 'success');
      usersService.update(editing.id, form).catch(() => toast('Error al guardar en el servidor.', 'error'));
    } else {
      setUsers(p => [...p, { ...form, id: Date.now(), last_login: '—', created_at: new Date().toISOString().slice(0, 10) }]);
      toast('Usuario creado.', 'success');
      usersService.create(form).catch(() => toast('Error al guardar en el servidor.', 'error'));
    }
    setModal(null);
  };

  const handleToggle = () => {
    const newStatus = toggleTarget.status === 'active' ? 'inactive' : 'active';
    setUsers(p => p.map(u => u.id === toggleTarget.id ? { ...u, status: newStatus } : u));
    toast(`Usuario ${toggleTarget.status === 'active' ? 'desactivado' : 'activado'}.`, 'warning');
    usersService.update(toggleTarget.id, { ...toggleTarget, status: newStatus }).catch(() => {});
    setToggleTarget(null);
  };

  const columns = [
    { key: 'name', label: 'Nombre', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-dim2)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{v.charAt(0)}</div>
        <div><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{row.username}</div></div>
      </div>
    )},
    { key: 'email', label: 'Email', render: v => <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{v}</span> },
    { key: 'role', label: 'Rol', width: 130, render: v => {
      const r = ROLES[v];
      return r ? <Badge variant={r.color}>{r.label}</Badge> : <Badge>{v}</Badge>;
    }},
    { key: 'status', label: 'Estado', width: 100, render: v => <Badge variant={v === 'active' ? 'green' : 'default'} dot>{v === 'active' ? 'Activo' : 'Inactivo'}</Badge> },
    { key: 'last_login', label: 'Último acceso', width: 140, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{v}</span> },
    { key: 'created_at', label: 'Alta', width: 100, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{v}</span> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Trabajadores y Permisos"
        subtitle={`${users.filter(u => u.status === 'active').length} activos · ${users.length} total`}
        actions={isAdmin && <Button icon={Plus} onClick={openCreate}>Nuevo usuario</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label="Trabajadores totales" value={users.length} icon={Users} color="accent" />
        <KPICard label="Activos" value={users.filter(u => u.status === 'active').length} icon={UserCheck} color="green" />
        <KPICard label="Inactivos" value={users.filter(u => u.status === 'inactive').length} icon={UserX} color="red" />
        <KPICard label="Roles distintos" value={Object.keys(ROLES).length} icon={Shield} color="purple" />
      </div>

      <div className={styles.rolesGrid}>
        {Object.entries(ROLES).map(([key, r]) => (
          <div key={key} className={styles.roleCard} onClick={() => setPermDetail(key)}>
            <div className={styles.roleTop}>
              <Badge variant={r.color}>{r.label}</Badge>
              <span className={styles.roleCount}>{users.filter(u => u.role === key).length} trabajadores</span>
            </div>
            <ul className={styles.rolePerms}>
              {PERMISSIONS_DETAIL[key]?.slice(0, 2).map((p, i) => <li key={i}>{p}</li>)}
              {PERMISSIONS_DETAIL[key]?.length > 2 && <li className={styles.roleMore}>+{PERMISSIONS_DETAIL[key].length - 2} más</li>}
            </ul>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKeys={['name', 'username', 'email']}
        rowActions={(row) => isAdmin ? (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)} />
            <Button variant="ghost" size="sm"
              icon={row.status === 'active' ? Lock : Unlock}
              onClick={() => setToggleTarget(row)}
              title={row.status === 'active' ? 'Desactivar' : 'Activar'} />
          </div>
        ) : null}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}
        footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? 'Guardar' : 'Crear usuario'}</Button>
        </div>}
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label}>Nombre completo *</label>
            <input className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Usuario *</label>
            <input className={styles.input} value={form.username} onChange={e => set('username', e.target.value)} style={{ fontFamily: 'var(--mono)' }} />
          </div>
          <div>
            <label className={styles.label}>Email *</label>
            <input className={styles.input} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Rol</label>
            <select className={styles.input} value={form.role} onChange={e => set('role', e.target.value)}>
              {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Estado</label>
            <select className={styles.input} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          {form.role && (
            <div className={`${styles.fieldFull} ${styles.permInfo}`}>
              <p className={styles.permTitle}>Permisos del rol <strong>{ROLES[form.role]?.label}</strong></p>
              <ul className={styles.permList}>{PERMISSIONS_DETAIL[form.role]?.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={!!permDetail} onClose={() => setPermDetail(null)} title={`Permisos — ${ROLES[permDetail]?.label}`} size="sm">
        {permDetail && (
          <div className={styles.permDetail}>
            <Badge variant={ROLES[permDetail]?.color} size="md">{ROLES[permDetail]?.label}</Badge>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{users.filter(u => u.role === permDetail).length} trabajadores con este rol</p>
            <ul className={styles.permDetailList}>
              {PERMISSIONS_DETAIL[permDetail]?.map((p, i) => <li key={i}><span className={styles.permDot} />  {p}</li>)}
            </ul>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!toggleTarget} onClose={() => setToggleTarget(null)} onConfirm={handleToggle}
        title={toggleTarget?.status === 'active' ? 'Desactivar usuario' : 'Activar usuario'}
        danger={toggleTarget?.status === 'active'}
        message={`¿${toggleTarget?.status === 'active' ? 'Desactivar' : 'Activar'} la cuenta de ${toggleTarget?.name}?`}
        confirmLabel={toggleTarget?.status === 'active' ? 'Desactivar' : 'Activar'} />
    </div>
  );
}
