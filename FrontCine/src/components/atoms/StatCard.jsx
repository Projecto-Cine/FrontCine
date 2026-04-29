/**
 * StatCard atom
 */
export default function StatCard({ label, value, change, changeType = 'positive', icon }) {
  return (
    <div className="stat-card">
      {icon && <span style={{ fontSize: '1.5rem' }}>{icon}</span>}
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {change && (
        <p className={`stat-change ${changeType}`}>{change}</p>
      )}
    </div>
  )
}
