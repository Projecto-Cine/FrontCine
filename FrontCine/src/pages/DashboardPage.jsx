import StatCard from '../components/atoms/StatCard'

const STATS = [
  { label: 'Películas proyectadas', value: '127', change: '+12%', changeType: 'positive', icon: '🎬' },
  { label: 'Sesiones proyectadas', value: '4051', change: '+8%', changeType: 'positive', icon: '🎟️' },
  { label: 'Ingresos entradas', value: '762.000€', change: '+15%', changeType: 'positive', icon: '💳' },
  { label: 'Ingresos merchandising', value: '241.500€', change: '-3%', changeType: 'negative', icon: '🛍️' },
]

const MONTHLY_INCOME = [
  { month: 'Ene', value: 45000 },
  { month: 'Feb', value: 52000 },
  { month: 'Mar', value: 48000 },
  { month: 'Abr', value: 61000 },
  { month: 'May', value: 55000 },
  { month: 'Jun', value: 71000 },
  { month: 'Jul', value: 68000 },
  { month: 'Ago', value: 59000 },
]

export default function DashboardPage() {
  return (
    <div className="page-wrapper">
      <div className="main-content">
        {/* Header */}
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src="/logo.png"
              alt="Foco Cines"
              style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '12px' }}
            />
            <div>
              <h1 className="section-title">Dashboard de Dirección</h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                Métricas y análisis del multicine
              </p>
            </div>
          </div>
          <select className="input" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            <option>Año 2026</option>
            <option>Año 2025</option>
          </select>
        </div>

        {/* Stats Grid */}
        <div className="grid-stats" style={{ marginBottom: '3rem' }}>
          {STATS.map((stat, i) => (
            <StatCard
              key={i}
              label={stat.label}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
              icon={stat.icon}
            />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid-2">
          {/* Ingresos Mensuales */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '700', marginBottom: '1.5rem' }}>Ingresos Mensuales</h3>
            <svg viewBox="0 0 400 250" style={{ width: '100%', height: '250px' }}>
              {/* Simple area chart */}
              <defs>
                <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={`grid-${i}`} x1="40" y1={50 + i * 50} x2="380" y2={50 + i * 50} stroke="#2A2A42" strokeDasharray="3" />
              ))}
              {/* Y axis */}
              <text x="20" y="55" fontSize="12" fill="#9CA3AF">75k</text>
              <text x="20" y="105" fontSize="12" fill="#9CA3AF">50k</text>
              <text x="20" y="155" fontSize="12" fill="#9CA3AF">25k</text>
              {/* Data points and line */}
              {MONTHLY_INCOME.map((data, i) => {
                const x = 50 + (i * 40)
                const y = 200 - (data.value / 75000) * 150
                return (
                  <g key={`month-${i}`}>
                    <circle cx={x} cy={y} r="4" fill="#8B5CF6" />
                    <text x={x} y="225" fontSize="11" fill="#9CA3AF" textAnchor="middle">{data.month}</text>
                  </g>
                )
              })}
              {/* Area */}
              <polygon
                points={`40,200 ${MONTHLY_INCOME.map((d, i) => `${50 + i * 40},${200 - (d.value / 75000) * 150}`).join(' ')} 380,200`}
                fill="url(#areaGrad)"
              />
            </svg>
          </div>

          {/* Sesiones por Mes */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '700', marginBottom: '1.5rem' }}>Sesiones por Mes</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '200px' }}>
              {[
                { month: 'Ene', value: 240 },
                { month: 'Feb', value: 280 },
                { month: 'Mar', value: 260 },
                { month: 'Abr', value: 380 },
                { month: 'May', value: 420 },
                { month: 'Jun', value: 450 },
                { month: 'Jul', value: 520 },
                { month: 'Ago', value: 380 },
                { month: 'Sep', value: 420 },
                { month: 'Oct', value: 480 },
                { month: 'Nov', value: 380 },
                { month: 'Dic', value: 420 },
              ].map((data, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${(data.value / 520) * 200}px`,
                      background: 'linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
