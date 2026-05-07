import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Info, LogIn, LogOut, Edit2, Trash2, Settings, Key } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable  from '../../components/shared/DataTable';
import Badge      from '../../components/ui/Badge';
import KPICard    from '../../components/shared/KPICard';
import { auditService }  from '../../services/auditService';
import { workersService }  from '../../services/workersService';
import SkeletonPage from '../../components/shared/Skeleton';
import styles from './AuditPage.module.css';

const SEVERITY_MAP = {
  info:    { label: 'Info',   v: 'accent', Icon: Info          },
  warning: { label: 'Aviso', v: 'yellow', Icon: AlertTriangle  },
  danger:  { label: 'Alerta',v: 'red',    Icon: AlertTriangle  },
};
const ACTION_ICON  = { LOGIN: LogIn, LOGOUT: LogOut, UPDATE: Edit2, CREATE: Edit2, DELETE: Trash2, PERMISSION: Key, CONFIG: Settings, LOGIN_FAIL: AlertTriangle };
const ACTION_COLOR = { LOGIN: 'green', LOGOUT: 'default', UPDATE: 'accent', CREATE: 'cyan', DELETE: 'red', PERMISSION: 'purple', CONFIG: 'yellow', LOGIN_FAIL: 'red' };

export default function AuditPage() {
  const [logs, setLogs]           = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterUser, setFilterUser]         = useState('all');

  useEffect(() => {
    Promise.all([
      auditService.getAll().catch(() => []),
      workersService.getAll().catch(() => []),
    ]).then(([auditLogs, users]) => {
      setLogs(Array.isArray(auditLogs) ? auditLogs : []);
      const today = new Date().toISOString().split('T')[0];
      const active = Array.isArray(users)
        ? users.filter(u => u.status === 'active' && (u.last_login ?? '').includes(today))
        : [];
      setActiveUsers(active);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    if (filterSeverity !== 'all' && l.severity !== filterSeverity) return false;
    if (filterUser !== 'all' && l.user !== filterUser) return false;
    return true;
  });

  const alerts      = logs.filter(l => l.severity === 'danger');
  const warnings    = logs.filter(l => l.severity === 'warning');
  const uniqueUsers = [...new Set(logs.map(l => l.user))];

  const columns = [
    { key: 'timestamp', label: 'Timestamp', width: 140, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{v}</span> },
    { key: 'user',      label: 'Usuario',   width: 120, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{v}</span> },
    { key: 'action',    label: 'Acción',    width: 110, render: v => {
      const Icon = ACTION_ICON[v] || Info;
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={12} style={{ color: `var(--${ACTION_COLOR[v] === 'accent' ? 'accent' : ACTION_COLOR[v] === 'green' ? 'green' : ACTION_COLOR[v] === 'red' ? 'red' : ACTION_COLOR[v] === 'cyan' ? 'cyan' : ACTION_COLOR[v] === 'purple' ? 'purple' : ACTION_COLOR[v] === 'yellow' ? 'yellow' : 'text-3'})` }} />
          <Badge variant={ACTION_COLOR[v] || 'default'}>{v}</Badge>
        </span>
      );
    }},
    { key: 'resource',  label: 'Recurso',   width: 160, render: v => <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{v}</span> },
    { key: 'detail',    label: 'Detalle',               render: v => <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{v}</span> },
    { key: 'ip',        label: 'IP',        width: 120, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{v}</span> },
    { key: 'severity',  label: 'Severidad', width: 90,  render: v => {
      const s = SEVERITY_MAP[v];
      return s ? <Badge variant={s.v}>{s.label}</Badge> : null;
    }},
  ];

  if (loading) return <SkeletonPage />;

  return (
    <div className={styles.page}>
      <PageHeader
        title="Auditoría y Seguridad"
        subtitle={`${logs.length} eventos registrados · ${alerts.length} alertas críticas`}
      />

      <div className={styles.kpiRow}>
        <KPICard label="Eventos totales"    value={logs.length}        icon={ShieldCheck}   color="accent" />
        <KPICard label="Alertas críticas"   value={alerts.length}      icon={AlertTriangle} color={alerts.length > 0 ? 'red' : 'green'} />
        <KPICard label="Avisos"             value={warnings.length}    icon={AlertTriangle} color="yellow" />
        <KPICard label="Usuarios activos hoy" value={activeUsers.length} icon={ShieldCheck} color="cyan" />
      </div>

      {alerts.length > 0 && (
        <div className={styles.alertSection}>
          <h3 className={styles.alertTitle}><AlertTriangle size={14} /> Alertas de seguridad</h3>
          {alerts.map(a => (
            <div key={a.id} className={styles.alertItem}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{a.timestamp}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)', flexShrink: 0 }}>{a.user}</span>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{a.detail}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto', flexShrink: 0 }}>{a.ip}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Severidad</span>
          {[['all', 'Todas'], ['info', 'Info'], ['warning', 'Aviso'], ['danger', 'Alerta']].map(([k, label]) => (
            <button key={k} className={`${styles.filterBtn} ${filterSeverity === k ? styles.filterActive : ''}`} onClick={() => setFilterSeverity(k)}>{label}</button>
          ))}
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Usuario</span>
          <select className={styles.filterSelect} value={filterUser} onChange={e => setFilterUser(e.target.value)}>
            <option value="all">Todos</option>
            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['user', 'action', 'resource', 'detail', 'ip']}
        pageSize={20}
      />

      {activeUsers.length > 0 && (
        <div className={styles.sessionPanel}>
          <h3 className={styles.sectionTitle}>Sesiones activas hoy</h3>
          <div className={styles.sessionGrid}>
            {activeUsers.map(u => (
              <div key={u.id} className={styles.sessionCard}>
                <div className={styles.sessionAvatar}>{(u.name ?? u.username ?? '?').charAt(0)}</div>
                <div className={styles.sessionInfo}>
                  <span className={styles.sessionUser}>{u.name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{u.username}</span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{u.last_login?.split(' ')?.[1] ?? u.last_login?.split('T')?.[1]?.substring(0, 5) ?? ''}</span>
                  <Badge variant="green" dot>Activa</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
