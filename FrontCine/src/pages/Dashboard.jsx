import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, Euro, Film, Ticket, Users } from 'lucide-react';
import { Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import KPICard from '../components/shared/KPICard';
import PageHeader from '../components/shared/PageHeader';
import Badge from '../components/ui/Badge';
import { clientsService } from '../services/clientsService';
import { incidentsService } from '../services/incidentsService';
import { reportsService } from '../services/reportsService';
import { purchasesService } from '../services/reservationsService';
import { sessionsService } from '../services/sessionsService';
import styles from './Dashboard.module.css';

const PRIORITY_COLOR = { critical: 'red', high: 'yellow', medium: 'accent', low: 'green' };
const PRIORITY_LABEL = { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja' };
const STATUS_COLOR = { open: 'red', in_progress: 'yellow', resolved: 'green' };
const STATUS_LABEL = { open: 'Abierta', in_progress: 'En curso', resolved: 'Resuelta' };
const SCREENING_BADGE = { ACTIVE: 'green', FULL: 'red', SCHEDULED: 'cyan', CANCELLED: 'default' };
const SCREENING_LABEL = { ACTIVE: 'Activa', FULL: 'Llena', SCHEDULED: 'Programada', CANCELLED: 'Cancelada' };
const PAID_STATUSES = new Set(['CONFIRMED', 'PAID']);

const toArray = (value) => Array.isArray(value) ? value : value?.content ?? [];
const money = (value, decimals = 2) => `€${Number(value ?? 0).toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
const localISODate = (date = new Date()) => {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
};
const dayLabel = (isoDate) => {
  const day = new Date(`${isoDate}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short' });
  return day.charAt(0).toUpperCase() + day.slice(1);
};
const getAmount = (purchase) => Number(purchase?.total ?? purchase?.amount ?? purchase?.totalAmount ?? 0);
const getStatus = (purchase) => purchase?.status ?? purchase?.purchaseStatus ?? 'PENDING';
const getDateValue = (item) => item?.createdAt ?? item?.purchaseDate ?? item?.dateTime ?? '';
const getSold = (screening) => Number(screening?.soldCount ?? screening?.sold ?? screening?.ticketsSold ?? 0);
const getCapacity = (screening) => Number(screening?.theater?.capacity ?? screening?.capacity ?? 0);
const getRoomName = (screening) => screening?.theater?.name?.split('-')[0]?.trim() ?? `Sala ${screening?.theater?.id ?? '?'}`;
const isOpenIncident = (incident) => incident?.status !== 'resolved';

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>{money(payload[0]?.value)}</p>
    </div>
  );
};

const PercentTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>{payload[0]?.value}%</p>
    </div>
  );
};

function buildFallbackData({ reportKpis, reportSalesWeek, reportOccupancy, purchases, screenings, incidents, clients, today }) {
  const todayPurchases = purchases.filter(purchase => getDateValue(purchase).startsWith(today));
  const paidPurchases = purchases.filter(purchase => PAID_STATUSES.has(getStatus(purchase)));
  const paidToday = todayPurchases.filter(purchase => PAID_STATUSES.has(getStatus(purchase)));
  const activeScreenings = screenings.filter(screening => screening.status === 'ACTIVE');
  const occupancyValues = screenings
    .map(screening => {
      const capacity = getCapacity(screening);
      return capacity > 0 ? Math.round((getSold(screening) / capacity) * 100) : null;
    })
    .filter(value => value !== null);
  const roomIds = new Set(screenings.map(screening => screening.theater?.id).filter(Boolean));

  const fallbackKpis = {
    revenue_today: paidToday.reduce((sum, purchase) => sum + getAmount(purchase), 0),
    tickets_today: paidToday.reduce((sum, purchase) => sum + (purchase.tickets?.length ?? purchase.seats?.length ?? 1), 0),
    occupancy_avg: occupancyValues.length ? Math.round(occupancyValues.reduce((sum, value) => sum + value, 0) / occupancyValues.length) : 0,
    incidents_open: incidents.length,
    active_sessions: activeScreenings.length,
    sessions_today: screenings.length,
    reservations_today: todayPurchases.length,
    operational_rooms: roomIds.size || null,
    total_clients: clients.length,
    total_revenue: paidPurchases.reduce((sum, purchase) => sum + getAmount(purchase), 0),
  };

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() - (6 - index));
    return localISODate(date);
  });

  const fallbackSalesWeek = days.map(day => {
    const dayPurchases = purchases.filter(purchase => getDateValue(purchase).startsWith(day) && PAID_STATUSES.has(getStatus(purchase)));
    return {
      day: dayLabel(day),
      revenue: dayPurchases.reduce((sum, purchase) => sum + getAmount(purchase), 0),
      tickets: dayPurchases.reduce((sum, purchase) => sum + (purchase.tickets?.length ?? purchase.seats?.length ?? 1), 0),
    };
  });

  const rooms = screenings.reduce((acc, screening) => {
    const capacity = getCapacity(screening);
    if (capacity <= 0) return acc;
    const name = getRoomName(screening);
    acc[name] ??= { sold: 0, capacity: 0 };
    acc[name].sold += getSold(screening);
    acc[name].capacity += capacity;
    return acc;
  }, {});

  const fallbackOccupancy = Object.entries(rooms).map(([room, totals]) => ({
    room,
    pct: Math.round((totals.sold / totals.capacity) * 100),
  }));

  return {
    kpis: { ...fallbackKpis, ...(reportKpis ?? {}) },
    salesWeek: toArray(reportSalesWeek).length
      ? toArray(reportSalesWeek).map(item => ({ day: item.day, revenue: item.ventas ?? item.revenue ?? 0, tickets: item.entradas ?? item.tickets ?? 0 }))
      : fallbackSalesWeek,
    occupancy: toArray(reportOccupancy).length
      ? toArray(reportOccupancy).map(item => ({ room: item.sala ?? item.room ?? item.name ?? 'Sala', pct: item.pct ?? item.occupancy ?? 0 }))
      : fallbackOccupancy,
  };
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState({ kpis: null, salesWeek: [], occupancy: [], sessions: [], incidents: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const today = localISODate();

    Promise.all([
      reportsService.kpis().catch(() => null),
      reportsService.salesWeek().catch(() => null),
      reportsService.occupancy().catch(() => null),
      sessionsService.getAll({ date: today }).catch(() => []),
      incidentsService.getAll().catch(() => []),
      purchasesService.getAll().catch(() => []),
      clientsService.getAll().catch(() => []),
    ]).then(([reportKpis, reportSalesWeek, reportOccupancy, screeningsData, incidentsData, purchasesData, clientsData]) => {
      if (ignore) return;
      const sessions = toArray(screeningsData).filter(screening => screening.status !== 'CANCELLED');
      const incidents = toArray(incidentsData).filter(isOpenIncident);
      const purchases = toArray(purchasesData);
      const clients = toArray(clientsData);
      const computed = buildFallbackData({ reportKpis, reportSalesWeek, reportOccupancy, purchases, screenings: sessions, incidents, clients, today });

      setDashboard({ ...computed, sessions, incidents });
    }).finally(() => {
      if (!ignore) setLoading(false);
    });

    return () => { ignore = true; };
  }, []);

  const { kpis, salesWeek, occupancy, sessions, incidents } = dashboard;
  const criticalIncidents = useMemo(
    () => incidents.filter(incident => incident.priority === 'critical'),
    [incidents],
  );

  if (loading) {
    return <div className={styles.loading}>Cargando dashboard...</div>;
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard"
        subtitle={`Resumen operativo — ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard label="Ingresos hoy" value={money(kpis?.revenue_today)} icon={Euro} color="green" sub={`${kpis?.tickets_today ?? 0} entradas vendidas`} />
        <KPICard label="Sesiones hoy" value={kpis?.sessions_today ?? sessions.length} icon={Film} color="accent" sub={`${kpis?.active_sessions ?? 0} en marcha`} />
        <KPICard label="Ocupación media" value={`${Math.round(kpis?.occupancy_avg ?? 0)}%`} icon={Building2} color="cyan" sub="proyecciones de hoy" />
        <KPICard label="Reservas hoy" value={kpis?.reservations_today ?? 0} icon={Ticket} color="purple" sub={`${money(kpis?.total_revenue, 0)} acumulado`} />
        <KPICard label="Incidencias abiertas" value={kpis?.incidents_open ?? incidents.length} icon={AlertTriangle} color={criticalIncidents.length > 0 ? 'red' : 'yellow'} sub={`${criticalIncidents.length} críticas`} />
        <KPICard label={kpis?.operational_rooms != null ? 'Salas operativas' : 'Clientes'} value={kpis?.operational_rooms ?? kpis?.total_clients ?? '-'} icon={kpis?.operational_rooms != null ? Building2 : Users} color="green" sub={kpis?.operational_rooms != null ? 'en servicio' : 'registrados'} />
      </div>

      <div className={styles.chartsRow}>
        <section className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Ingresos - últimos 7 días</h3>
          {salesWeek.length === 0 || salesWeek.every(day => Number(day.revenue) === 0) ? (
            <div className={styles.emptyChart}>Sin datos de ventas esta semana</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={salesWeek} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<RevenueTooltip />} />
                <Line type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Ocupación por sala hoy (%)</h3>
          {occupancy.length === 0 ? (
            <div className={styles.emptyChart}>Sin sesiones hoy</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={occupancy} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="room" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<PercentTooltip />} />
                <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                  {occupancy.map((entry) => (
                    <Cell key={entry.room} fill={entry.pct === 0 ? 'var(--bg-4)' : entry.pct >= 90 ? 'var(--green)' : entry.pct >= 70 ? 'var(--accent)' : 'var(--yellow)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <div className={styles.bottomRow}>
        <section className={styles.tableCard}>
          <h3 className={styles.sectionTitle}>Sesiones de hoy</h3>
          <table className={styles.miniTable}>
            <thead>
              <tr><th>Película</th><th>Sala</th><th>Hora</th><th>Ocup.</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {sessions.slice(0, 8).map(screening => {
                const capacity = getCapacity(screening);
                const sold = getSold(screening);
                const pct = capacity > 0 ? Math.round((sold / capacity) * 100) : null;
                return (
                  <tr key={screening.id}>
                    <td className={styles.tdMovie}>{screening.movie?.title ?? '-'}</td>
                    <td>{getRoomName(screening)}</td>
                    <td className={styles.mono}>{screening.dateTime?.slice(11, 16) ?? '-'}</td>
                    <td className={styles.mono} style={{ color: pct == null ? 'var(--text-3)' : pct >= 90 ? 'var(--green)' : pct >= 70 ? 'var(--accent)' : 'var(--text-2)' }}>{pct != null ? `${sold}/${capacity}` : '-'}</td>
                    <td><Badge variant={SCREENING_BADGE[screening.status] ?? 'default'} dot>{SCREENING_LABEL[screening.status] ?? screening.status ?? '-'}</Badge></td>
                  </tr>
                );
              })}
              {sessions.length === 0 && (
                <tr><td colSpan={5} className={styles.emptyCell}>Sin sesiones hoy</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <div className={styles.sideCol}>
          <section className={styles.tableCard}>
            <h3 className={styles.sectionTitle}>Incidencias abiertas</h3>
            <div className={styles.incList}>
              {incidents.slice(0, 4).map(incident => (
                <div key={incident.id} className={styles.incItem}>
                  <div className={styles.incTop}>
                    <span className={styles.incId}>{incident.id}</span>
                    <Badge variant={PRIORITY_COLOR[incident.priority] ?? 'default'}>{PRIORITY_LABEL[incident.priority] ?? incident.priority ?? '-'}</Badge>
                    <Badge variant={STATUS_COLOR[incident.status] ?? 'default'}>{STATUS_LABEL[incident.status] ?? incident.status ?? '-'}</Badge>
                  </div>
                  <p className={styles.incTitle}>{incident.title}</p>
                  <p className={styles.incRoom}>{incident.room || 'Sin ubicación'}</p>
                </div>
              ))}
              {incidents.length === 0 && <p className={styles.empty}>Sin incidencias activas</p>}
            </div>
          </section>

          <section className={styles.tableCard}>
            <h3 className={styles.sectionTitle}>Alertas del sistema</h3>
            <div className={styles.alertList}>
              {criticalIncidents.slice(0, 3).map(incident => (
                <div key={incident.id} className={`${styles.alert} ${styles.alertRed}`}>
                  <AlertTriangle size={13} />
                  <span>{incident.title}{incident.room ? ` — ${incident.room}` : ''}</span>
                </div>
              ))}
              {criticalIncidents.length === 0 && (
                <div className={`${styles.alert} ${styles.alertYellow}`}>
                  <AlertTriangle size={13} />
                  <span>Sin alertas críticas activas</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
