import { useLanguage } from '../../i18n/LanguageContext';
import { useCountUp } from '../../hooks/useCountUp';
import styles from './KPICard.module.css';

function AnimatedValue({ value }) {
  const numeric = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  const prefix  = isNaN(numeric) ? '' : String(value).match(/^[^0-9-]*/)?.[0] ?? '';
  const suffix  = isNaN(numeric) ? '' : String(value).match(/[^0-9.]+$/)?.[0] ?? '';
  const count   = useCountUp(isNaN(numeric) ? 0 : numeric);
  if (isNaN(numeric)) return <>{value}</>;
  const formatted = Number.isInteger(numeric) ? count.toFixed(0) : count.toFixed(1);
  return <>{prefix}{formatted}{suffix}</>;
}

export default function KPICard({ label, value, sub, icon: Icon, color = 'accent', trend, onClick }) {
  const { t } = useLanguage();
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
      <div className={styles.value}><AnimatedValue value={value} /></div>
      {(sub || trend !== undefined) && (
        <div className={styles.bottom}>
          {sub && <span className={styles.sub}>{sub}</span>}
          {trend !== undefined && (
            <span className={`${styles.trend} ${trend >= 0 ? styles.up : styles.down}`} aria-label={t('common.trend', { value: `${trend >= 0 ? '+' : ''}${trend}` })}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
