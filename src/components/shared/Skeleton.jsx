import styles from './Skeleton.module.css';

export function SkeletonLine({ width = '100%', height = 14 }) {
  return <span className={styles.line} style={{ width, height }} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.cardTop}>
        <SkeletonLine width="55%" height={12} />
        <span className={styles.iconPh} />
      </div>
      <SkeletonLine width="40%" height={28} />
      <SkeletonLine width="65%" height={10} />
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className={styles.tableWrap} aria-hidden="true" aria-label="Cargando datos">
      <div className={styles.tableHeader}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width={i === 0 ? '30%' : '15%'} height={11} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.tableRow}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={c === 0 ? '45%' : '20%'} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 200 }) {
  return <div className={styles.chartWrap} style={{ height }} aria-hidden="true" />;
}

export function SkeletonKpiGrid({ count = 4 }) {
  return (
    <div className={styles.kpiGrid} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export default function SkeletonPage() {
  return (
    <div className={styles.page} role="status" aria-label="Cargando...">
      <div className={styles.pageHeader}>
        <div>
          <SkeletonLine width={160} height={20} />
          <SkeletonLine width={220} height={12} />
        </div>
      </div>
      <SkeletonKpiGrid count={4} />
      <SkeletonTable />
    </div>
  );
}
