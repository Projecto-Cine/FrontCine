import styles from './PageHeader.module.css';

export default function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        {breadcrumb && <div className={styles.breadcrumb}>{breadcrumb}</div>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
