import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import styles from './Toasts.module.css';

const ICONS = { success: CheckCircle, warning: AlertTriangle, error: XCircle, info: Info };

export default function Toasts() {
  const { toasts, removeToast } = useApp();
  if (!toasts.length) return null;
  return (
    <div className={styles.container}>
      {toasts.map(t => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            <Icon size={14} className={styles.icon} />
            <span className={styles.msg}>{t.message}</span>
            <button className={styles.close} onClick={() => removeToast(t.id)}><X size={12} /></button>
          </div>
        );
      })}
    </div>
  );
}
