import { Wifi, WifiOff, Circle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './StatusBar.module.css';

const APP_VERSION = '1.0.0-dev';

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

export default function StatusBar() {
  const { user } = useAuth();
  const online = useOnline();
  const [syncTime] = useState(() => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));

  return (
    <footer className={styles.bar} role="contentinfo" aria-label="Barra de estado">
      <div className={styles.left}>
        <span className={`${styles.conn} ${online ? styles.connOnline : styles.connOffline}`}>
          {online ? <Wifi size={10} aria-hidden="true" /> : <WifiOff size={10} aria-hidden="true" />}
          {online ? 'Conectado' : 'Sin conexión'}
        </span>
        <span className={styles.sep} aria-hidden="true">·</span>
        <span className={styles.item}>Sync {syncTime}</span>
      </div>
      <div className={styles.right}>
        {user && (
          <>
            <Circle size={6} className={styles.activeDot} aria-hidden="true" />
            <span className={styles.item}>{user.name?.split(' ')[0]} · {user.role}</span>
            <span className={styles.sep} aria-hidden="true">·</span>
          </>
        )}
        <span className={styles.item}>v{APP_VERSION}</span>
        <span className={styles.sep} aria-hidden="true">·</span>
        <span className={styles.item}>Lumen Cinema</span>
      </div>
    </footer>
  );
}
