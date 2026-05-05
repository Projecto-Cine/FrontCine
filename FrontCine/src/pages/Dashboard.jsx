import { useState, useEffect } from 'react';
import { Ticket, Building2, AlertTriangle, TrendingUp, Users, Package, Euro, Film } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import KPICard from '../components/shared/KPICard';
import PageHeader from '../components/shared/PageHeader';
import Badge from '../components/ui/Badge';
import { reportsService } from '../services/reportsService';
import { sessionsService } from '../services/sessionsService';
import { incidentsService } from '../services/incidentsService';
import { roomsService } from '../services/roomsService';
import { moviesService } from '../services/moviesService';
import styles from './Dashboard.module.css';

const PRIORITY_COLOR = { critical: 'red', high: 'yellow', medium: 'accent', low: 'green' };
const STATUS_COLOR = { open: 'red', in_progress: 'yellow', resolved: 'green' };
const STATUS_LABEL = { open: 'Abierta', in_progress: 'En curso', resolved: 'Resuelta' };
const SESSION_STATUS = { active: 'green', full: 'red', scheduled: 'cyan' };
const SESSION_STATUS_LABEL = { active: 'Activa', full: 'Llena', scheduled: 'Programada' };

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
  const [salesWeek, setSalesWeek] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    reportsService.salesWeek()
      .then(data => setSalesWeek(data.map(d => ({
        day:     d.date     ?? d.day,
        revenue: d.revenue  ?? d.ventas   ?? 0,
        tickets: d.totalPurchases ?? d.entradas ?? d.tickets ?? 0,
      }))))
      .catch(() => {});
    reportsService.occupancy()
      .then(data => setOccupancy(data.map(d => ({
        room: d.theaterName ?? d.sala ?? d.room ?? '—',
        pct:  d.occupancyPercentage ?? d.pct ?? 0,
      }))))
      .catch(() => {});
    sessionsService.getAll().then(setSessions).catch(() => {});
    incidentsService.getAll()
      .then(data => setIncidents((Array.isArray(data) ? data : []).map(i => ({
        ...i,
        priority: i.severity ?? i.priority ?? 'medium',
        status:   i.resolved === true ? 'resolved' : (i.status ?? 'open'),
      }))))
      .catch(() => {});
    roomsService.getAll().then(setRooms).catch(() => {});
    moviesService.getAll().then(setMovies).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter(s => (s.fechaHora?.slice(0, 10) ?? s.date) === today);
  const openIncidents = incidents.filter(i => i.status !== 'resolved');
  const todayRevenue = todaySessions.reduce((sum, s) => {
    const cap   = s.theater?.totalSeats ?? s.theater?.capacidad ?? 0;
    const avail = s.asientosDisponibles ?? cap;
    return sum + (cap - avail) * (s.precioBase ?? s.price ?? 0);
  }, 0);
  const avgOccupancy = Math.round(todaySessions.reduce((sum, s) => {
    const cap   = s.theater?.totalSeats ?? s.theater?.capacidad ?? 1;
    const avail = s.asientosDisponibles ?? cap;
    return sum + ((cap - avail) / cap) * 100;
  }, 0) / (todaySessions.length || 1));
  const operativeRooms = rooms.filter(r => r.status == null || r.status === 'active').length;

  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard"
        subtitle={`Resumen operativo — ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard label="Ingresos hoy" value={`€${todayRevenue.toLocaleString('es-ES', { minimumFractionDigits: 0 })}`} icon={Euro} color="green" trend={12} sub="vs. ayer" />
        <KPICard label="Sesiones activas" value={todaySessions.length} icon={Film} color="accent" sub={`${todaySessions.filter(s => !s.completo).length} con butacas libres`} />
        <KPICard label="Ocupación media" value={`${avgOccupancy}%`} icon={Building2} color="cyan" trend={-3} sub="sesiones de hoy" />
        <KPICard label="Reservas totales" value={reservations.length} icon={Ticket} color="purple" sub="15 última hora" trend={8} />
        <KPICard label="Incidencias abiertas" value={openIncidents.length} icon={AlertTriangle} color={openIncidents.some(i => i.priority === 'critical') ? 'red' : 'yellow'} sub={`${openIncidents.filter(i => i.priority === 'critical').length} crítica(s)`} />
        <KPICard label="Salas operativas" value={`${operativeRooms}/${rooms.length}`} icon={Building2} color="green" sub="Salas activas" />
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
                {occupancy.map((entry, i) => (
                  <Cell key={i} fill={entry.pct === 0 ? 'var(--bg-4)' : entry.pct >= 90 ? 'var(--green)' : entry.pct >= 70 ? 'var(--accent)' : 'var(--yellow)'} />
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
              <tr>
                <th>Película</th><th>Sala</th><th>Hora</th><th>Vendidas</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {todaySessions.map(s => {
                const movie  = s.movie   ?? movies.find(m => m.id === (s.peliculaId ?? s.movieId ?? s.movie_id));
                const room   = s.theater ?? rooms.find(r => r.id  === (s.salaId     ?? s.theaterId ?? s.room_id));
                const title  = movie?.titulo ?? movie?.title ?? '—';
                const rmName = room?.nombre  ?? room?.name   ?? '—';
                const time   = s.fechaHora?.slice(11, 16) ?? s.time ?? '';
                const cap    = room?.totalSeats ?? room?.capacidad ?? room?.capacity ?? 0;
                const avail  = s.asientosDisponibles ?? cap;
                const sold   = cap - avail;
                const isFull = s.completo ?? (avail <= 0);
                const statusKey = isFull ? 'full' : 'active';
                return (
                  <tr key={s.id}>
                    <td className={styles.tdMovie}>{title}</td>
                    <td>{rmName.split('—')[0].trim()}</td>
                    <td className={styles.mono}>{time}</td>
                    <td>
                      <span className={styles.sold}>{sold}/{cap}</span>
                      <div className={styles.bar}><div className={styles.barFill} style={{ width: `${cap > 0 ? (sold / cap) * 100 : 0}%`, background: isFull ? 'var(--green)' : 'var(--accent)' }} /></div>
                    </td>
                    <td><Badge variant={SESSION_STATUS[statusKey]} dot>{SESSION_STATUS_LABEL[statusKey]}</Badge></td>
                  </tr>
                );
              })}
              {todaySessions.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '16px 0', fontSize: 12 }}>Sin sesiones hoy</td></tr>}
            </tbody>
          </table>
        </div>

        <div className={styles.sideCol}>
          <div className={styles.tableCard}>
            <h3 className={styles.sectionTitle}>Incidencias abiertas</h3>
            <div className={styles.incList}>
              {openIncidents.slice(0, 4).map(inc => {
                const prio = inc.priority ?? inc.severity ?? 'medium';
                return (
                  <div key={inc.id} className={styles.incItem}>
                    <div className={styles.incTop}>
                      <span className={styles.incId}>#{inc.id}</span>
                      <Badge variant={PRIORITY_COLOR[prio]}>{prio}</Badge>
                      <Badge variant={STATUS_COLOR[inc.status]}>{STATUS_LABEL[inc.status]}</Badge>
                    </div>
                    <p className={styles.incTitle}>{inc.title}</p>
                    {inc.room && <p className={styles.incRoom}>{inc.room}</p>}
                  </div>
                );
              })}
              {openIncidents.length === 0 && <p className={styles.empty}>Sin incidencias activas</p>}
            </div>
          </div>

          <div className={styles.tableCard}>
            <h3 className={styles.sectionTitle}>Alertas del sistema</h3>
            <div className={styles.alertList}>
              <div className={styles.alert + ' ' + styles.alertRed}><AlertTriangle size={13} /><span>Sala 5 fuera de servicio — HVAC averiado</span></div>
              <div className={styles.alert + ' ' + styles.alertYellow}><AlertTriangle size={13} /><span>Stock bajo: Aceite palomitero (6 uds, mín. 8)</span></div>
              <div className={styles.alert + ' ' + styles.alertYellow}><AlertTriangle size={13} /><span>Sala 6 VIP — 100% ocupación (3 sesiones)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
