import styles from './KPICard.module.css';

export default function KPICard({ label, value, sub, icon: Icon, color = 'accent', trend, onClick }) {
  return (
    <div className={`${styles.card} ${onClick ? styles.clickable : ''}`} onClick={onClick}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {Icon && <span className={`${styles.icon} ${styles[color]}`}><Icon size={15} /></span>}
      </div>
      <div className={styles.value}>{value}</div>
      {(sub || trend !== undefined) && (
        <div className={styles.bottom}>
          {sub && <span className={styles.sub}>{sub}</span>}
          {trend !== undefined && (
            <span className={`${styles.trend} ${trend >= 0 ? styles.up : styles.down}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
