import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import styles from './Toasts.module.css';

const ICONS = { success: CheckCircle, warning: AlertTriangle, error: XCircle, info: Info };
const LABELS = { success: 'Éxito', warning: 'Aviso', error: 'Error', info: 'Información' };

export default function Toasts() {
  const { toasts, removeToast } = useApp();
  if (!toasts.length) return null;

  return (
    <div
      className={styles.container}
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions removals"
    >
      {toasts.map(t => {
        const Icon = ICONS[t.type] || Info;
        const isError = t.type === 'error';
        const duration = t.duration ?? 3500;
        return (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]}`}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
            aria-atomic="true"
          >
            <Icon size={14} className={styles.icon} aria-hidden="true" />
            <span className="sr-only">{LABELS[t.type] || 'Notificación'}: </span>
            <span className={styles.msg}>{t.message}</span>
            <button
              className={styles.close}
              onClick={() => removeToast(t.id)}
              aria-label={`Cerrar notificación: ${t.message}`}
            >
              <X size={12} aria-hidden="true" />
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
