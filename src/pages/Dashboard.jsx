import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Building2, AlertTriangle, Euro, Film, ShoppingBag, CalendarDays } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import KPICard from '../components/shared/KPICard';
import PageHeader from '../components/shared/PageHeader';
import Badge from '../components/ui/Badge';
import SkeletonPage from '../components/shared/Skeleton';
import { dashboardService } from '../services/dashboardService';
import { reportsService } from '../services/reportsService';
import { sessionsService } from '../services/sessionsService';
import { incidentsService } from '../services/incidentsService';
import { merchandiseSalesService } from '../services/merchandiseSalesService';
import { useLanguage } from '../i18n/LanguageContext';
import styles from './Dashboard.module.css';

const PRIORITY_COLOR = { critical: 'red', high: 'yellow', medium: 'accent', low: 'green' };
const STATUS_COLOR   = { open: 'red', in_progress: 'yellow', resolved: 'green' };
const SCR_BADGE      = { ACTIVE: 'green', FULL: 'red', SCHEDULED: 'cyan', CANCELLED: 'default' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-l)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
      <p style={{ color: 'var(--text-2)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color || 'var(--text-1)' }}>€{p.value?.toLocaleString('es-ES')}</p>)}
    </div>
  );
};

function RankList({ items, valueKey = 'revenue', nameKey = 'title', max }) {
  const topVal = max ?? (items[0]?.[valueKey] ?? 1);
  return (
    <div className={styles.rankList}>
      {items.map((item, i) => {
        const val = item[valueKey] ?? 0;
        const pct = topVal > 0 ? Math.round((val / topVal) * 100) : 0;
        return (
          <div key={i} className={styles.rankItem}>
            <span className={styles.rankPos}>{i + 1}</span>
            <div className={styles.rankInfo}>
              <span className={styles.rankName}>{item[nameKey]}</span>
              <div className={styles.rankBarWrap}>
                <div className={styles.rankBar}>
                  <div className={styles.rankBarFill} style={{ width: `${pct}%`, background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--cyan)' : 'var(--green)' }} />
                </div>
                <span className={styles.rankVal}>€{val.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        );
      })}
      {items.length === 0 && <p className={styles.empty}>Sin datos</p>}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, fmt } = useLanguage();
  const [kpis, setKpis]               = useState(null);
  const [salesWeek, setSalesWeek]     = useState([]);
  const [occupancy, setOccupancy]     = useState([]);
  const [sessions, setSessions]       = useState([]);
  const [incidents, setIncidents]     = useState([]);
  const [topMovies, setTopMovies]     = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueSplit, setRevenueSplit] = useState({ tickets: 0, merch: 0 });
  const [yearStats, setYearStats]     = useState({ sessions: 0, movies: 0 });
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const today       = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear().toString();

    Promise.all([
      dashboardService.get().catch(() => null),
      reportsService.salesWeek().catch(() => []),
      reportsService.occupancy().catch(() => []),
      sessionsService.getUpcoming().catch(() => []),
      incidentsService.getAll().catch(() => []),
      dashboardService.getPurchases().catch(() => []),
      merchandiseSalesService.getAll().catch(() => []),
      sessionsService.getAll().catch(() => []),
    ]).then(([dash, sw, occ, scr, inc, purchases, merchSales, allScreenings]) => {

      setKpis(dash ? {
        revenue_today:      dash.weeklyRevenue ?? 0,
        active_sessions:    dash.activeScreenings ?? 0,
        occupancy_avg:      0,
        reservations_today: dash.paidPurchases ?? 0,
        incidents_open:     dash.unresolvedIncidents ?? 0,
        operational_rooms:  dash.activeMovies ?? '—',
      } : null);

      setSalesWeek((sw ?? []).map(d => ({
        day:     d.date ?? d.day,
        revenue: d.revenue ?? 0,
        tickets: d.totalPurchases ?? d.tickets ?? 0,
      })));

      const byRoom = {};
      (occ ?? []).forEach(d => {
        const room = d.theaterName ?? d.sala ?? d.room ?? '—';
        const pct  = d.occupancyPercentage ?? d.pct ?? 0;
        if (!byRoom[room] || pct > byRoom[room]) byRoom[room] = pct;
      });
      setOccupancy(Object.entries(byRoom).map(([room, pct]) => ({ room, pct: Math.round(pct) })));

      const todaySessions = (Array.isArray(scr) ? scr : [])
        .filter(s => (s.startTime ?? s.dateTime ?? '').startsWith(today));
      setSessions(todaySessions);

      const SEVERITY_MAP = { HIGH: 'critical', MEDIUM: 'high', LOW: 'medium', ALTA: 'critical', MEDIA: 'high', BAJA: 'low' };
      const mapped = (Array.isArray(inc) ? inc : [])
        .filter(i => !i.resolved)
        .map(i => ({ ...i, priority: SEVERITY_MAP[i.severity] ?? SEVERITY_MAP[i.priority] ?? 'low', status: 'open' }));
      setIncidents(mapped);

      console.log('📊 Dashboard API raw:', { purchases, merchSales, allScreenings: allScreenings?.length });

      const confirmed   = s => ['CONFIRMED','PAID','COMPLETED','confirmed','paid','completed'].includes(s?.status);
      const normTotal   = p => Number(p?.totalAmount ?? p?.total ?? p?.amount ?? p?.price ?? 0);
      const normQty     = s => Number(s?.quantity ?? s?.qty ?? 1);
      const normUPrice  = s => Number(s?.unitPrice ?? s?.unit_price ?? s?.price ?? 0);
      const normDate    = p => p?.createdAt ?? p?.created_at ?? p?.saleDate ?? p?.date ?? '';
      const normTitle   = p => p?.movieTitle ?? p?.screening?.movie?.title ?? p?.movie?.title ?? p?.movie_name ?? p?.title ?? String(p?.movie ?? p?.screening?.movie ?? '');
      const normName    = s => s?.merchandiseName ?? s?.merchandise?.name ?? s?.product?.name ?? s?.product_name ?? s?.name ?? String(s?.merchandise ?? s?.product ?? '');
      const normStart   = s => s?.startTime ?? s?.start_time ?? s?.dateTime ?? s?.date_time ?? '';
      const normMid     = s => s?.movie?.id ?? s?.movieId ?? s?.movie_id ?? null;

      const purchaseList = Array.isArray(purchases) ? purchases : [];
      const confirmedPurchases = purchaseList.filter(confirmed);
      const ticketRevenue = confirmedPurchases.reduce((sum, p) => sum + normTotal(p), 0);

      const movieRevMap = {};
      confirmedPurchases.forEach(p => {
        const title = normTitle(p);
        if (title) movieRevMap[title] = (movieRevMap[title] ?? 0) + normTotal(p);
      });
      const top3Movies = Object.entries(movieRevMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([title, revenue]) => ({ title, revenue }));

      console.log('📊 Movie revenue map:', movieRevMap, 'top3:', top3Movies);

      const merchList = Array.isArray(merchSales) ? merchSales : [];
      const productRevMap = {};
      merchList.forEach(sale => {
        const name = normName(sale);
        const total = normTotal(sale) || (normQty(sale) * normUPrice(sale));
        if (name) productRevMap[name] = (productRevMap[name] ?? 0) + total;
      });
      const top3Products = Object.entries(productRevMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, revenue]) => ({ name, revenue }));
      const merchandiseRevenue = Object.values(productRevMap).reduce((s, v) => s + v, 0);

      console.log('📊 Product revenue map:', productRevMap, 'top3:', top3Products);

      setRevenueSplit({ tickets: ticketRevenue, merch: merchandiseRevenue });
      setTopMovies(top3Movies);
      setTopProducts(top3Products);

      const allScr = Array.isArray(allScreenings) ? allScreenings : [];
      const yearScr = allScr.filter(s => normStart(s).startsWith(currentYear));
      const yearMovieIds = new Set(yearScr.map(s => normMid(s)).filter(Boolean));
      setYearStats({ sessions: yearScr.length, movies: yearMovieIds.size });

    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonPage />;

  const criticalInc    = incidents.filter(i => i.priority === 'critical');
  const subtitle       = `${t('dashboard.subtitle')} — ${fmt.date(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
  const totalRevenue   = revenueSplit.tickets + revenueSplit.merch;
  const splitData      = [
    { label: t('dashboard.label.tickets'), value: revenueSplit.tickets, fill: 'var(--accent)' },
    { label: t('dashboard.label.merch'),   value: revenueSplit.merch,   fill: 'var(--cyan)'   },
  ];

  return (
    <div className={styles.page}>
      <PageHeader title="Dashboard" subtitle={subtitle} />

      <div className={styles.kpiGrid}>
        <KPICard label={t('dashboard.kpi.revenueToday')}      value={`€${(kpis?.revenue_today ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 0 })}`} icon={Euro}          color="green"  trend={12} sub={t('dashboard.kpi.vsYesterday')} onClick={() => navigate('/informes')} />
        <KPICard label={t('dashboard.kpi.activeSessions')}    value={kpis?.active_sessions ?? sessions.length}                                                 icon={Film}          color="accent" sub={`${sessions.filter(s => s.status === 'ACTIVE').length} ${t('dashboard.kpi.running')}`} onClick={() => navigate('/horarios')} />
        <KPICard label={t('dashboard.kpi.occupancyAvg')}      value={`${kpis?.occupancy_avg ?? 0}%`}                                                           icon={Building2}     color="cyan"   trend={-3} sub={t('dashboard.kpi.todaySessions')} onClick={() => navigate('/salas')} />
        <KPICard label={t('dashboard.kpi.reservationsToday')} value={kpis?.reservations_today ?? 0}                                                            icon={Ticket}        color="purple" trend={8} onClick={() => navigate('/reservas')} />
        <KPICard label={t('dashboard.kpi.yearSessions')}      value={yearStats.sessions}                                                                        icon={CalendarDays}  color="yellow" sub={t('dashboard.kpi.yearMovies', { count: yearStats.movies })} onClick={() => navigate('/horarios')} />
        <KPICard label={t('dashboard.kpi.incidentsOpen')}     value={kpis?.incidents_open ?? incidents.length}                                                 icon={AlertTriangle} color={criticalInc.length > 0 ? 'red' : 'yellow'} sub={t('dashboard.kpi.criticals', { count: criticalInc.length })} onClick={() => navigate('/incidencias')} />
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{t('dashboard.chart.revenue7d')}</h3>
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
          <h3 className={styles.chartTitle}>{t('dashboard.chart.occupancy')}</h3>
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

      {/* ── Analytics row ───────────────────────────────────── */}
      <div className={styles.analyticsRow}>
        <div className={styles.analyticsCard}>
          <h3 className={styles.sectionTitle}>{t('dashboard.section.revenueBreakdown')}</h3>
          <div className={styles.splitStats}>
            {splitData.map(d => (
              <div key={d.label} className={styles.splitStat}>
                <span className={styles.splitStatLabel}>{d.label}</span>
                <span className={styles.splitStatVal} style={{ color: d.fill }}>
                  €{d.value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className={styles.splitStatPct}>
                  {totalRevenue > 0 ? Math.round((d.value / totalRevenue) * 100) : 0}%
                </span>
              </div>
            ))}
            <div className={styles.splitStat} style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <span className={styles.splitStatLabel}>Total</span>
              <span className={styles.splitStatVal}>€{totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={splitData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(v) => `€${v.toLocaleString('es-ES', { minimumFractionDigits: 0 })}`} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {splitData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.analyticsCard}>
          <h3 className={styles.sectionTitle}>{t('dashboard.section.topMovies')}</h3>
          <RankList items={topMovies} valueKey="revenue" nameKey="title" />
        </div>

        <div className={styles.analyticsCard}>
          <h3 className={styles.sectionTitle}>{t('dashboard.section.topProducts')}</h3>
          <RankList items={topProducts} valueKey="revenue" nameKey="name" />
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.tableCard}>
          <h3 className={styles.sectionTitle}>{t('dashboard.section.todaySessions')}</h3>
          <table className={styles.miniTable}>
            <thead>
              <tr>
                <th>{t('dashboard.col.movie')}</th>
                <th>{t('dashboard.col.room')}</th>
                <th>{t('dashboard.col.time')}</th>
                <th>{t('dashboard.col.status')}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td className={styles.tdMovie}>{s.movie?.title ?? '—'}</td>
                  <td>{s.theater?.name?.split('—')[0]?.trim() ?? '—'}</td>
                  <td className={styles.mono}>{(s.startTime ?? s.dateTime ?? '').split('T')[1]?.substring(0, 5) ?? '—'}</td>
                  <td><Badge variant={SCR_BADGE[s.status] ?? 'default'} dot>{t(`dashboard.session.${s.status}`) || s.status}</Badge></td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>{t('dashboard.noSessions')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.sideCol}>
          <div className={styles.tableCard}>
            <h3 className={styles.sectionTitle}>{t('dashboard.section.openIncidents')}</h3>
            <div className={styles.incList}>
              {incidents.slice(0, 4).map(inc => (
                <div key={inc.id} className={styles.incItem}>
                  <div className={styles.incTop}>
                    <span className={styles.incId}>{inc.id}</span>
                    <Badge variant={PRIORITY_COLOR[inc.priority]}>{inc.priority}</Badge>
                    <Badge variant={STATUS_COLOR[inc.status]}>{t(`dashboard.status.${inc.status}`)}</Badge>
                  </div>
                  <p className={styles.incTitle}>{inc.title}</p>
                  <p className={styles.incRoom}>{inc.room}</p>
                </div>
              ))}
              {incidents.length === 0 && <p className={styles.empty}>{t('dashboard.noIncidents')}</p>}
            </div>
          </div>

          <div className={styles.tableCard}>
            <h3 className={styles.sectionTitle}>{t('dashboard.section.systemAlerts')}</h3>
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
                  <span>{t('dashboard.noAlerts')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
