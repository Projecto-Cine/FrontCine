import styles from './KPICard.module.css';

export default function KPICard({ label, value, sub, icon: Icon, color = 'accent', trend, onClick }) {
  const interactive = Boolean(onClick);

  const handleKeyDown = interactive
    ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }
    : undefined;

  return (
    <div
      className={`${styles.card} ${interactive ? styles.clickable : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? label : undefined}
    >
      <div className={styles.top}>
        <span className={styles.label} aria-hidden={interactive ? 'true' : undefined}>{label}</span>
        {Icon && <span className={`${styles.icon} ${styles[color]}`} aria-hidden="true"><Icon size={15} /></span>}
      </div>
      <div className={styles.value}>{value}</div>
      {(sub || trend !== undefined) && (
        <div className={styles.bottom}>
          {sub && <span className={styles.sub}>{sub}</span>}
          {trend !== undefined && (
            <span className={`${styles.trend} ${trend >= 0 ? styles.up : styles.down}`} aria-label={`Tendencia: ${trend >= 0 ? '+' : ''}${trend}%`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
