import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PageHeader from '../../components/shared/PageHeader';
import KPICard    from '../../components/shared/KPICard';
import { Euro, TrendingUp, Users, Film, Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import SkeletonPage from '../../components/shared/Skeleton';
import { reportsService }   from '../../services/reportsService';
import { moviesService }    from '../../services/moviesService';
import { incidentsService } from '../../services/incidentsService';
import { useLanguage } from '../../i18n/LanguageContext';
import styles from './ReportsPage.module.css';

const PIE_COLORS = ['var(--accent)', 'var(--purple)', 'var(--cyan)', 'var(--green)', 'var(--red)', 'var(--yellow)'];

const CustomTT = ({ active, payload, label }) => active && payload?.length ? (
  <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-l)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
    <p style={{ color: 'var(--text-2)', marginBottom: 4 }}>{label}</p>
    {payload.map((p, i) => <p key={i} style={{ color: p.color || 'var(--text-1)' }}>{p.name}: {typeof p.value === 'number' ? (p.name?.includes('€') || p.dataKey === 'revenue' ? `€${p.value.toLocaleString()}` : p.value) : p.value}</p>)}
  </div>
) : null;

export default function ReportsPage() {
  const [salesWeek, setSalesWeek]       = useState([]);
  const [occupancy, setOccupancy]       = useState([]);
  const [incidentByCat, setIncidentByCat] = useState([]);
  const [activeMovies, setActiveMovies] = useState(0);
  const [loading, setLoading]           = useState(true);
  const { t, fmt } = useLanguage();

  useEffect(() => {
    Promise.all([
      reportsService.salesWeek().catch(() => []),
      reportsService.occupancy().catch(() => []),
      moviesService.getAll().catch(() => []),
      incidentsService.getAll().catch(() => []),
    ]).then(([sw, occ, movies, incidents]) => {
      setSalesWeek((sw ?? []).map(d => ({
        day:     d.day,
        revenue: d.ventas   ?? d.revenue ?? 0,
        tickets: d.entradas ?? d.tickets ?? 0,
      })));
      setOccupancy((occ ?? []).map(d => ({ room: d.sala ?? d.room, pct: d.pct })));

      const activeMov = Array.isArray(movies) ? movies.filter(m => m.active !== false && m.status !== 'inactive').length : 0;
      setActiveMovies(activeMov);

      const cats = {};
      (Array.isArray(incidents) ? incidents : []).forEach(i => {
        const cat = i.category ?? 'Otros';
        cats[cat] = (cats[cat] ?? 0) + 1;
      });
      setIncidentByCat(Object.entries(cats).map(([name, value]) => ({ name, value })));
    }).finally(() => setLoading(false));
  }, []);

  const totalWeek    = salesWeek.reduce((s, d) => s + d.revenue, 0);
  const totalTickets = salesWeek.reduce((s, d) => s + d.tickets, 0);
  const bestDay      = salesWeek.length > 0 ? salesWeek.reduce((a, b) => b.revenue > a.revenue ? b : a) : { day: '—', revenue: 0 };

  const exportCSV = () => {
    const rows = [
      [t('reports.csv.day'), t('reports.csv.revenue'), t('reports.csv.tickets')],
      ...salesWeek.map(d => [d.day, d.revenue, d.tickets]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'lumen_informe_semana.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <SkeletonPage />;

  const period = fmt.date(new Date(), { month: 'long', year: 'numeric' });

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle', { period })}
        actions={<Button variant="secondary" icon={Download} onClick={exportCSV}>{t('reports.exportCSV')}</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label={t('reports.kpi.weekRevenue')}   value={`€${totalWeek.toLocaleString('es-ES')}`}    icon={Euro}       color="green"  trend={8} sub={t('reports.kpi.vsPrevWeek')} />
        <KPICard label={t('reports.kpi.ticketsSold')}   value={totalTickets.toLocaleString()}                icon={Users}      color="accent" trend={5} />
        <KPICard label={t('reports.kpi.bestDay')}       value={bestDay.day}                                  icon={TrendingUp} color="cyan"   sub={`€${bestDay.revenue.toLocaleString()}`} />
        <KPICard label={t('reports.kpi.activeMovies')}  value={activeMovies}                                 icon={Film}       color="purple" />
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{t('reports.chart.dailyRevenue')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesWeek} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="day"     tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis                   tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTT />} />
              <Bar dataKey="revenue" name={t('reports.chart.revenue')} fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{t('reports.chart.ticketsSold')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesWeek} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="day"    tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis                  tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTT />} />
              <Line type="monotone" dataKey="tickets" name={t('reports.chart.tickets')} stroke="var(--cyan)" strokeWidth={2} dot={{ r: 3, fill: 'var(--cyan)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{t('reports.chart.occupancy')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={occupancy} layout="vertical" margin={{ top: 0, right: 8, left: 20, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="room" type="category" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-l)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
                  <p style={{ color: 'var(--text-2)' }}>{label}</p><p style={{ color: 'var(--text-1)' }}>{payload[0].value}%</p>
                </div>
              ) : null} />
              <Bar dataKey="pct" radius={[0, 3, 3, 0]}>
                {occupancy.map((e, i) => <Cell key={i} fill={e.pct === 0 ? 'var(--bg-4)' : e.pct >= 90 ? 'var(--green)' : 'var(--accent)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{t('reports.chart.incidentsByCat')}</h3>
          {incidentByCat.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={incidentByCat} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {incidentByCat.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {incidentByCat.map((e, i) => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-2)' }}>{e.name}</span>
                    <span style={{ color: 'var(--text-3)', marginLeft: 'auto', fontFamily: 'var(--mono)' }}>{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>{t('reports.chart.noIncidents')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
