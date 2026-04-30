import styles from './Button.module.css';

export default function Button({
  children, variant = 'primary', size = 'md',
  icon: Icon, iconRight: IconRight,
  loading = false, disabled = false,
  onClick, type = 'button', title, className = ''
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${loading ? styles.loading : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
    >
      {loading ? <span className={styles.spinner} /> : Icon && <Icon size={14} />}
      {children && <span>{children}</span>}
      {IconRight && !loading && <IconRight size={14} />}
    </button>
  );
}
