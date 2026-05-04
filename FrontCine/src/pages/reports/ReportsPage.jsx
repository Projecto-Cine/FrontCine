import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import PageHeader from '../../components/shared/PageHeader';
import KPICard from '../../components/shared/KPICard';
import { Euro, TrendingUp, Users, Film, Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import { reportsService } from '../../services/reportsService';
import { moviesService } from '../../services/moviesService';
import styles from './ReportsPage.module.css';

const PIE_COLORS = ['var(--accent)', 'var(--purple)', 'var(--cyan)', 'var(--green)', 'var(--red)', 'var(--yellow)'];

const INCIDENT_BY_CAT = [
  { name: 'Técnico', value: 0 }, { name: 'Infraestructura', value: 0 },
  { name: 'Mobiliario', value: 0 }, { name: 'Software', value: 0 },
  { name: 'Seguridad', value: 0 }, { name: 'Operativo', value: 0 },
];

const FORMAT_STATS = [
  { format: 'IMAX', revenue: 18200, sessions: 14, pct: 32 },
  { format: '4DX', revenue: 12400, sessions: 11, pct: 22 },
  { format: 'VIP', revenue: 9800, sessions: 9, pct: 17 },
  { format: '3D', revenue: 8600, sessions: 18, pct: 15 },
  { format: '2D', revenue: 7900, sessions: 24, pct: 14 },
];

const CustomTT = ({ active, payload, label }) => active && payload?.length ? (
  <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-l)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
    <p style={{ color: 'var(--text-2)', marginBottom: 4 }}>{label}</p>
    {payload.map((p, i) => <p key={i} style={{ color: p.color || 'var(--text-1)' }}>{p.name}: {typeof p.value === 'number' && p.name?.includes('€') ? `€${p.value.toLocaleString()}` : p.value}</p>)}
  </div>
) : null;

export default function ReportsPage() {
  const [salesWeek, setSalesWeek] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [movies, setMovies] = useState([]);
  const [incidentByCat, setIncidentByCat] = useState([]);

  useEffect(() => {
    reportsService.salesWeek()
      .then(data => setSalesWeek(data.map(d => ({ day: d.day, revenue: d.ventas ?? d.revenue ?? 0, tickets: d.entradas ?? d.tickets ?? 0 }))))
      .catch(() => {});
    reportsService.occupancy()
      .then(data => setOccupancy(data.map(d => ({ room: d.sala ?? d.room, pct: d.pct }))))
      .catch(() => {});
    moviesService.getAll().then(setMovies).catch(() => {});
  }, []);

  const totalWeek = salesWeek.reduce((s, d) => s + d.revenue, 0);
  const totalTickets = salesWeek.reduce((s, d) => s + d.tickets, 0);
  const bestDay = salesWeek.length ? salesWeek.reduce((a, b) => b.revenue > a.revenue ? b : a) : { day: '—', revenue: 0 };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Informes y Estadísticas"
        subtitle="Datos del periodo: 24 — 30 Abril 2024"
        actions={<Button variant="secondary" icon={Download}>Exportar CSV</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label="Ingresos semana" value={`€${totalWeek.toLocaleString('es-ES')}`} icon={Euro} color="green" trend={8} sub="vs. semana anterior" />
        <KPICard label="Entradas vendidas" value={totalTickets.toLocaleString()} icon={Users} color="accent" trend={5} />
        <KPICard label="Mejor día" value={bestDay.day} icon={TrendingUp} color="cyan" sub={`€${bestDay.revenue.toLocaleString()}`} />
        <KPICard label="Películas activas" value={movies.filter(m => m.status === 'active').length} icon={Film} color="purple" />
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Ingresos diarios — semana</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesWeek} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTT />} />
              <Bar dataKey="revenue" name="€ Ingresos" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Entradas vendidas — semana</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesWeek} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTT />} />
              <Line type="monotone" dataKey="tickets" name="Entradas" stroke="var(--cyan)" strokeWidth={2} dot={{ r: 3, fill: 'var(--cyan)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Ocupación por sala (%)</h3>
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
          <h3 className={styles.chartTitle}>Incidencias por categoría</h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={INCIDENT_BY_CAT} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {INCIDENT_BY_CAT.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {INCIDENT_BY_CAT.map((e, i) => (
                <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-2)' }}>{e.name}</span>
                  <span style={{ color: 'var(--text-3)', marginLeft: 'auto', fontFamily: 'var(--mono)' }}>{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h3 className={styles.sectionTitle}>Rendimiento por formato</h3>
        <table className={styles.table}>
          <thead><tr><th>Formato</th><th>Ingresos</th><th>Sesiones</th><th>% del total</th><th>Ing./sesión media</th></tr></thead>
          <tbody>
            {FORMAT_STATS.map(r => (
              <tr key={r.format}>
                <td style={{ fontWeight: 500 }}>{r.format}</td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--green)' }}>€{r.revenue.toLocaleString()}</td>
                <td style={{ fontFamily: 'var(--mono)' }}>{r.sessions}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--bg-4)', borderRadius: 99 }}>
                      <div style={{ width: `${r.pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)', width: 30 }}>{r.pct}%</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--mono)' }}>€{Math.round(r.revenue / r.sessions).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
