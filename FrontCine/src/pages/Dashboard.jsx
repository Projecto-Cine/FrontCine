import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useData } from '../context/DataContext'
import { formatPrice } from '../utils/formatters'

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${color}40`,
      borderRadius: 'var(--radius-md)',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flex: 1,
      minWidth: 200,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 'var(--radius-sm)',
        background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { peliculas, sesiones, productos } = useData()
  const [year, setYear] = useState(new Date().getFullYear())

  const stats = useMemo(() => {
    const sesionesYear = sesiones.filter(s => new Date(s.fecha).getFullYear() === year)
    const gananciaEntradas = sesionesYear.reduce((sum, s) => sum + (s.entradasVendidas * s.precioEntrada), 0)
    const gananciaMerchandising = 0 // conectar a ventas reales cuando haya backend

    const topPeliculas = peliculas
      .map(p => ({
        ...p,
        sesionesCount: sesiones.filter(s => s.peliculaId === p.id).length,
        entradas: sesiones.filter(s => s.peliculaId === p.id).reduce((sum, s) => sum + s.entradasVendidas, 0),
      }))
      .sort((a, b) => b.entradas - a.entradas)
      .slice(0, 3)

    const topProductos = productos.sort((a, b) => b.stock - a.stock).slice(0, 3)

    return { sesionesYear, gananciaEntradas, gananciaMerchandising, topPeliculas, topProductos }
  }, [peliculas, sesiones, productos, year])

  const chartData = [
    { name: 'Entradas', value: stats.gananciaEntradas },
    { name: 'Merchandising', value: stats.gananciaMerchandising },
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Dashboard</h1>
          <p>Estadísticas y métricas del cine</p>
        </div>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="form-input"
          style={{ width: 'auto', minWidth: 100 }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Películas Proyectadas" value={peliculas.length} icon="🎬" color="#c9a84c" />
        <StatCard label="Sesiones Proyectadas" value={stats.sesionesYear.length} icon="📅" color="#c9a84c" />
        <StatCard label="Ganancia Entradas" value={formatPrice(stats.gananciaEntradas)} icon="💵" color="#27ae60" />
        <StatCard label="Ganancia Merchandising" value={formatPrice(stats.gananciaMerchandising)} icon="📈" color="#e67e22" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>Distribución de Ingresos</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text-primary)' }}
                formatter={(val) => [formatPrice(val), '']}
              />
              <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>Resumen Financiero</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Total Entradas', value: stats.gananciaEntradas },
              { label: 'Total Merchandising', value: stats.gananciaMerchandising },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatPrice(row.value)}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px',
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              marginTop: 4,
            }}>
              <span style={{ fontWeight: 600 }}>Total General</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.05rem' }}>
                {formatPrice(stats.gananciaEntradas + stats.gananciaMerchandising)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Top 3 Películas</h3>
          {stats.topPeliculas.length === 0 ? (
            <p className="empty-state">No hay datos disponibles</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.topPeliculas.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid var(--border-color)',
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i === 0 ? 'var(--accent)' : 'var(--bg-input)',
                    color: i === 0 ? '#000' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                  }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{p.titulo}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{p.entradas} entradas</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Top 3 Productos</h3>
          {stats.topProductos.length === 0 ? (
            <p className="empty-state">No hay datos disponibles</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.topProductos.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid var(--border-color)',
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i === 0 ? 'var(--accent)' : 'var(--bg-input)',
                    color: i === 0 ? '#000' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                  }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{p.nombre}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Stock: {p.stock}</div>
                  </div>
                  <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>{formatPrice(p.precio)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
