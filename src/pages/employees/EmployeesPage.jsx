import { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, Users } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { employeesService } from '../../services/employeesService';
import styles from './EmployeesPage.module.css';

const ROLES = ['CAJERO', 'GERENCIA', 'LIMPIEZA', 'MANTENIMIENTO'];
const ROLE_COLOR = { CAJERO: 'accent', GERENCIA: 'red', LIMPIEZA: 'green', MANTENIMIENTO: 'cyan' };
const ROLE_LABEL = { CAJERO: 'Cajero/a', GERENCIA: 'Gerencia', LIMPIEZA: 'Limpieza', MANTENIMIENTO: 'Mantenimiento' };

const EMPTY = { name: '', lastName: '', email: '', password: '', role: 'CAJERO', phoneNumber: '' };

const splitName = (full) => {
  const parts = (full ?? '').trim().split(' ');
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
};

const normalize = (e) => {
  const role = String(e.role ?? e.position ?? e.workerRole ?? 'CAJERO').toUpperCase();
  const parts = splitName(e.name ?? '');
  return {
    ...e,
    id: e.id ?? e.workerId,
    name: parts.firstName || e.username || e.email || '-',
    lastName: parts.lastName,
    role,
    active: e.active !== false && e.status !== 'INACTIVE',
    email: e.email ?? '',
    phone: e.phone ?? e.telephone ?? e.phoneNumber ?? '',
  };
};

export default function EmployeesPage() {
  const { toast } = useApp();
  const { t }     = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [errors, setErrors]       = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    employeesService.getAll()
      .then(data => setEmployees((Array.isArray(data) ? data : []).map(normalize)))
      .catch(() => toast('Error al cargar empleados.', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setModal('form'); };
  const openEdit   = (emp) => {
    const full = emp.name + (emp.lastName ? ' ' + emp.lastName : '');
    const parts = splitName(full);
    setEditing(emp);
    setForm({ name: parts.firstName, lastName: parts.lastName, email: emp.email ?? '', password: '', role: emp.role ?? 'CAJERO', phoneNumber: emp.phoneNumber ?? emp.phone ?? '' });
    setErrors({});
    setModal('form');
  };
  const set        = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())                 e.name     = 'El nombre es obligatorio.';
    if (!form.email.trim())                e.email    = 'El email es obligatorio.';
    if (!editing && !form.password.trim()) e.password = 'La contraseña es obligatoria.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const fullName = () => [form.name.trim(), form.lastName.trim()].filter(Boolean).join(' ');

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const payload = { name: fullName(), email: form.email.trim(), role: form.role, phoneNumber: form.phoneNumber.trim() || undefined };
      if (editing) {
        if (form.password.trim()) payload.password = form.password.trim();
        const saved = await employeesService.update(editing.id, payload);
        setEmployees(prev => prev.map(e => e.id === editing.id ? normalize(saved ?? { ...editing, ...payload }) : e));
        toast('Empleado actualizado.', 'success');
      } else {
        payload.password = form.password.trim();
        const saved = await employeesService.create(payload);
        setEmployees(prev => [...prev, normalize(saved)]);
        toast('Empleado creado.', 'success');
      }
      setModal(null);
    } catch (err) {
      toast(err?.status === 409 ? 'Email ya registrado.' : 'Error al guardar el empleado.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await employeesService.remove(deleteTarget.id);
      setEmployees(prev => prev.filter(e => e.id !== deleteTarget.id));
      toast('Empleado eliminado.', 'warning');
    } catch {
      toast('Error al eliminar el empleado.', 'error');
    }
    setDeleteTarget(null);
  };

  const columns = [
    { key: 'name', label: 'Nombre', render: v => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'lastName', label: 'Apellidos', render: v => <span style={{ color: 'var(--text-1)' }}>{v || '-'}</span> },
    { key: 'email', label: 'Email',    render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{v}</span> },
    { key: 'role',  label: 'Rol',      width: 130, render: v => <Badge variant={ROLE_COLOR[v] || 'default'}>{ROLE_LABEL[v] || v}</Badge> },
    { key: 'phone', label: 'Teléfono', width: 130, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{v || '—'}</span> },
    { key: 'active',label: 'Estado',   width: 100, render: v => <Badge variant={v !== false ? 'green' : 'default'} dot>{v !== false ? 'Activo' : 'Inactivo'}</Badge> },
  ];

  const byRole = ROLES.reduce((acc, r) => ({ ...acc, [r]: employees.filter(e => e.role === r).length }), {});
  const visibleRoles = ROLES.filter(r => byRole[r] > 0);

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('nav.employees')}
        subtitle={`${employees.length} empleados · ${employees.filter(e => e.active !== false).length} activos`}
        actions={<Button icon={Plus} onClick={openCreate}>Nuevo empleado</Button>}
      />

      <div className={styles.kpiRow}>
        {(visibleRoles.length ? visibleRoles : ROLES.slice(0, 4)).map(r => (
          <KPICard key={r} label={ROLE_LABEL[r]} value={byRole[r]} icon={Users} color={ROLE_COLOR[r]} />
        ))}
      </div>

      <DataTable
        columns={columns}
        data={employees}
        searchKeys={['name', 'email']}
        loading={loading}
        rowActions={(row) => (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Edit2}  onClick={() => openEdit(row)} />
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} />
          </div>
        )}
      />

      <Modal
        open={modal === 'form'}
        onClose={() => setModal(null)}
        title={editing ? 'Editar empleado' : 'Nuevo empleado'}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={handleSave}>{editing ? t('common.save') : 'Crear empleado'}</Button>
          </div>
        }
      >
        <div className={styles.formGrid}>
          <div>
            <label className={styles.label} htmlFor="emp-name">Nombre *</label>
            <input id="emp-name" className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre" />
            {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          </div>
          <div>
            <label className={styles.label} htmlFor="emp-lastname">Apellidos</label>
            <input id="emp-lastname" className={styles.input}
              value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Apellidos" />
          </div>
          <div>
            <label className={styles.label} htmlFor="emp-email">Email *</label>
            <input id="emp-email" className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="correo@ejemplo.com" />
            {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
          </div>
          <div>
            <label className={styles.label} htmlFor="emp-pass">{editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
            <input id="emp-pass" className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              type="password" value={form.password} onChange={e => set('password', e.target.value)}
              placeholder={editing ? '••••••••' : 'Mínimo 6 caracteres'} />
            {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
          </div>
          <div>
            <label className={styles.label} htmlFor="emp-role">Rol</label>
            <select id="emp-role" className={styles.input} value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="emp-phone">Teléfono</label>
            <input id="emp-phone" className={styles.input} value={form.phoneNumber}
              onChange={e => set('phoneNumber', e.target.value)} placeholder="+34 600 000 000" />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar empleado"
        danger
        message={`¿Eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
