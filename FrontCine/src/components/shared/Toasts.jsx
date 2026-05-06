import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import styles from './Toasts.module.css';

const ICONS = { success: CheckCircle, warning: AlertTriangle, error: XCircle, info: Info };

export default function Toasts() {
  const { toasts, removeToast } = useApp();
  if (!toasts.length) return null;
  return (
    <div className={styles.container} role="region" aria-live="polite" aria-label="Notificaciones">
      {toasts.map(t => {
        const Icon = ICONS[t.type] || Info;
        const duration = t.duration ?? 3500;
        return (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]}`}
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            <Icon size={14} className={styles.icon} aria-hidden="true" />
            <span className={styles.msg}>{t.message}</span>
            <button
              className={styles.close}
              onClick={() => removeToast(t.id)}
              aria-label={`Cerrar: ${t.message}`}
            >
              <X size={12} />
            </button>
            <span
              className={styles.progress}
              style={{ animationDuration: `${duration}ms` }}
              aria-hidden="true"
            />
          </div>
        );
      })}
    </div>
  );
}
