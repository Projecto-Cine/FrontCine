import { useState, useEffect } from 'react';
import { Ticket, Building2, AlertTriangle, Euro, Film } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import KPICard from '../components/shared/KPICard';
import PageHeader from '../components/shared/PageHeader';
import Badge from '../components/ui/Badge';
import SkeletonPage from '../components/shared/Skeleton';
import { reportsService } from '../services/reportsService';
import { sessionsService } from '../services/sessionsService';
import { incidentsService } from '../services/incidentsService';
import styles from './Dashboard.module.css';

const PRIORITY_COLOR = { critical: 'red', high: 'yellow', medium: 'accent', low: 'green' };
const STATUS_COLOR   = { open: 'red', in_progress: 'yellow', resolved: 'green' };
const STATUS_LABEL   = { open: 'Abierta', in_progress: 'En curso', resolved: 'Resuelta' };
const SCR_BADGE  = { ACTIVE: 'green', FULL: 'red', SCHEDULED: 'cyan', CANCELLED: 'default' };
const SCR_LABEL  = { ACTIVE: 'Activa', FULL: 'Llena', SCHEDULED: 'Programada', CANCELLED: 'Cancelada' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-l)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
      <p style={{ color: 'var(--text-2)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color || 'var(--text-1)' }}>€{p.value?.toLocaleString('es-ES')}</p>)}
    </div>
  );
};

export default function Dashboard() {
  const [kpis, setKpis]             = useState(null);
  const [salesWeek, setSalesWeek]   = useState([]);
  const [occupancy, setOccupancy]   = useState([]);
  const [sessions, setSessions]     = useState([]);
  const [incidents, setIncidents]   = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      reportsService.kpis().catch(() => null),
      reportsService.salesWeek().catch(() => []),
      reportsService.occupancy().catch(() => []),
      sessionsService.getAll({ date: today }).catch(() => []),
      incidentsService.getAll().catch(() => []),
    ]).then(([k, sw, occ, scr, inc]) => {
      setKpis(k);
      setSalesWeek((sw ?? []).map(d => ({
        day:     d.day,
        revenue: d.ventas   ?? d.revenue ?? 0,
        tickets: d.entradas ?? d.tickets ?? 0,
      })));
      setOccupancy((occ ?? []).map(d => ({ room: d.sala ?? d.room, pct: d.pct })));
      setSessions(Array.isArray(scr) ? scr.filter(s => s.status !== 'CANCELLED') : []);
      setIncidents(Array.isArray(inc) ? inc.filter(i => i.status !== 'resolved') : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonPage />;

  const criticalInc = incidents.filter(i => i.priority === 'critical');

  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard"
        subtitle={`Resumen operativo — ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard label="Ingresos hoy"        value={`€${(kpis?.revenue_today ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 0 })}`} icon={Euro}          color="green"  trend={12} sub="vs. ayer" />
        <KPICard label="Sesiones activas"    value={kpis?.active_sessions ?? sessions.length}                                                 icon={Film}          color="accent" sub={`${sessions.filter(s => s.status === 'ACTIVE').length} en marcha`} />
        <KPICard label="Ocupación media"     value={`${kpis?.occupancy_avg ?? 0}%`}                                                           icon={Building2}     color="cyan"   trend={-3} sub="sesiones de hoy" />
        <KPICard label="Reservas hoy"        value={kpis?.reservations_today ?? 0}                                                            icon={Ticket}        color="purple" trend={8} />
        <KPICard label="Incidencias abiertas" value={kpis?.incidents_open ?? incidents.length}                                                icon={AlertTriangle} color={criticalInc.length > 0 ? 'red' : 'yellow'} sub={`${criticalInc.length} crítica(s)`} />
        <KPICard label="Salas operativas"    value={kpis?.operational_rooms ?? '—'}                                                           icon={Building2}     color="green"  sub="en servicio" />
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Ingresos — últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={salesWeek} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Ocupación por sala (%)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={occupancy} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="room" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-l)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
                  <p style={{ color: 'var(--text-2)' }}>{label}</p>
                  <p style={{ color: 'var(--text-1)' }}>{payload[0].value}%</p>
                </div>
              ) : null} />
              <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                {occupancy.map((e, i) => (
                  <Cell key={i} fill={e.pct === 0 ? 'var(--bg-4)' : e.pct >= 90 ? 'var(--green)' : e.pct >= 70 ? 'var(--accent)' : 'var(--yellow)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.tableCard}>
          <h3 className={styles.sectionTitle}>Sesiones de hoy</h3>
          <table className={styles.miniTable}>
            <thead>
              <tr><th>Película</th><th>Sala</th><th>Hora</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td className={styles.tdMovie}>{s.movie?.title ?? '—'}</td>
                  <td>{s.theater?.name?.split('—')[0]?.trim() ?? '—'}</td>
                  <td className={styles.mono}>{s.dateTime?.split('T')[1]?.substring(0, 5) ?? '—'}</td>
                  <td><Badge variant={SCR_BADGE[s.status] ?? 'default'} dot>{SCR_LABEL[s.status] ?? s.status}</Badge></td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>Sin sesiones hoy</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.sideCol}>
          <div className={styles.tableCard}>
            <h3 className={styles.sectionTitle}>Incidencias abiertas</h3>
            <div className={styles.incList}>
              {incidents.slice(0, 4).map(inc => (
                <div key={inc.id} className={styles.incItem}>
                  <div className={styles.incTop}>
                    <span className={styles.incId}>{inc.id}</span>
                    <Badge variant={PRIORITY_COLOR[inc.priority]}>{inc.priority}</Badge>
                    <Badge variant={STATUS_COLOR[inc.status]}>{STATUS_LABEL[inc.status]}</Badge>
                  </div>
                  <p className={styles.incTitle}>{inc.title}</p>
                  <p className={styles.incRoom}>{inc.room}</p>
                </div>
              ))}
              {incidents.length === 0 && <p className={styles.empty}>Sin incidencias activas</p>}
            </div>
          </div>

          <div className={styles.tableCard}>
            <h3 className={styles.sectionTitle}>Alertas del sistema</h3>
            <div className={styles.alertList}>
              {criticalInc.slice(0, 3).map(inc => (
                <div key={inc.id} className={styles.alert + ' ' + styles.alertRed}>
                  <AlertTriangle size={13} />
                  <span>{inc.title}{inc.room ? ` — ${inc.room}` : ''}</span>
                </div>
              ))}
              {criticalInc.length === 0 && (
                <div className={styles.alert + ' ' + styles.alertYellow}>
                  <AlertTriangle size={13} />
                  <span>Sin alertas críticas activas</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
