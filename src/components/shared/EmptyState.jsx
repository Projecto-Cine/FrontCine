import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

export default function EmptyState({ icon: Icon = Inbox, title, subtitle }) {
  return (
    <div className={styles.wrap}>
      <Icon size={40} className={styles.icon} aria-hidden="true" />
      {title    && <p className={styles.title}>{title}</p>}
      {subtitle && <p className={styles.sub}>{subtitle}</p>}
    </div>
  );
}
