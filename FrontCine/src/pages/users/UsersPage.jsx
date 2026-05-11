import { useEffect, useState } from 'react';
import { Edit2, Plus, Shield, Trash2, UserCheck, Users } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { usersService } from '../../services/usersService';
import styles from './UsersPage.module.css';

const ROLE_COLOR = { ADMIN: 'red', CLIENT: 'green' };
const EMPTY = { email: '', role: 'CLIENT', dateOfBirth: '' };

const normalizeUser = (user) => ({
  ...user,
  role: String(user.role ?? 'CLIENT').toUpperCase(),
  dateOfBirth: user.dateOfBirth ?? user.birthDate ?? '',
});

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast } = useApp();
  const { user: me } = useAuth();
  const { t } = useLanguage();

  const ROLES = {
    ADMIN:  { label: t('users.role.ADMIN'),  color: 'red' },
    CLIENT: { label: t('users.role.CLIENT'), color: 'green' },
  };

  const isAdmin = ['admin', 'ADMIN'].includes(me?.role);

  useEffect(() => {
    usersService.getAll()
      .then(data => setUsers((data ?? []).map(normalizeUser)))
      .catch(() => toast('No se pudieron cargar los usuarios del backend.', 'error'));
  }, [toast]);

  const openCreate = () => { if (!isAdmin) return; setEditing(null); setForm(EMPTY); setErrors({}); setModal('form'); };
  const openEdit = (user) => { if (!isAdmin) return; setEditing(user); setForm(normalizeUser(user)); setErrors({}); setModal('form'); };
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const validateField = (name, value) => {
    setErrors(e => ({ ...e, [name]: !String(value).trim() ? t('common.fieldRequired') : undefined }));
  };

  const handleSave = async () => {
    if (!form.email.trim()) {
      toast('Email obligatorio.', 'error');
      return;
    }

    const payload = { email: form.email.trim(), role: form.role, dateOfBirth: form.dateOfBirth || null };
    if (editing) {
      const saved = normalizeUser(await usersService.update(editing.id, payload));
      setUsers(prev => prev.map(user => user.id === editing.id ? saved : user));
      toast(t('users.modalEdit') + ' ✓', 'success');
    } else {
      const saved = normalizeUser(await usersService.create(payload));
      setUsers(prev => [...prev, saved]);
      toast(t('users.modalCreate') + ' ✓', 'success');
    }
    setModal(null);
  };

  const handleDelete = async () => {
    await usersService.remove(deleteTarget.id);
    setUsers(prev => prev.filter(user => user.id !== deleteTarget.id));
    toast(t('users.deleteTitle') + ' ✓', 'warning');
    setDeleteTarget(null);
  };

  const columns = [
    { key: 'email', label: t('users.col.email'), render: value => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-dim2)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{value?.charAt(0)?.toUpperCase()}</div>
        <span style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 500 }}>{value}</span>
      </div>
    )},
    { key: 'role', label: t('users.col.role'), width: 140, render: value => <Badge variant={ROLE_COLOR[value] || 'default'}>{ROLES[value]?.label || value}</Badge> },
    { key: 'dateOfBirth', label: t('users.col.dateOfBirth'), width: 160, render: value => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{value || '-'}</span> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle', { count: users.length, admins: users.filter(user => user.role === 'ADMIN').length })}
        actions={isAdmin && <Button icon={Plus} onClick={openCreate}>{t('users.createBtn')}</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label={t('users.kpi.staff')}  value={users.length}                                         icon={Users}     color="accent" />
        <KPICard label={t('users.kpi.admins')} value={users.filter(user => user.role === 'ADMIN').length}   icon={Shield}    color="red" />
        <KPICard label={t('users.kpi.clients')}value={users.filter(user => user.role === 'CLIENT').length}  icon={UserCheck} color="green" />
      </div>

      <div className={styles.rolesGrid}>
        {Object.entries(ROLES).map(([key, role]) => (
          <div key={key} className={styles.roleCard}>
            <div className={styles.roleTop}>
              <Badge variant={role.color}>{role.label}</Badge>
              <span className={styles.roleCount}>{users.filter(user => user.role === key).length} {t('users.usersLabel')}</span>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKeys={['email', 'role']}
        rowActions={(row) => isAdmin ? (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)} />
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} title={t('common.delete')} />
          </div>
        ) : null}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? t('users.modalEdit') : t('users.modalCreate')}
        footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? t('common.save') : t('users.createUser')}</Button>
        </div>}
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="usr-email">{t('users.form.email')}</label>
<<<<<<< HEAD
            <input id="usr-email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              type="email" value={form.email} onChange={e => set('email', e.target.value)}
              onBlur={e => validateField('email', e.target.value)}
              aria-invalid={!!errors.email} aria-describedby={errors.email ? 'err-usr-email' : undefined}
            />
            {errors.email && <span id="err-usr-email" role="alert" className={styles.fieldError}>{errors.email}</span>}
=======
            <input id="usr-email" className={styles.input} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
>>>>>>> b80d8bd (feat(i18n): traducción completa de todas las páginas y componentes)
          </div>
          <div>
            <label className={styles.label} htmlFor="usr-role">{t('users.form.role')}</label>
            <select id="usr-role" className={styles.input} value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="ADMIN">{ROLES.ADMIN.label}</option>
              <option value="CLIENT">{ROLES.CLIENT.label}</option>
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="usr-dob">{t('users.form.dateOfBirth')}</label>
            <input id="usr-dob" className={styles.input} type="date" value={form.dateOfBirth || ''} onChange={e => set('dateOfBirth', e.target.value)} />
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={t('users.deleteTitle')} danger
        message={t('users.deleteMsg', { email: deleteTarget?.email ?? '' })}
        confirmLabel={t('common.delete')} />
    </div>
  );
}
