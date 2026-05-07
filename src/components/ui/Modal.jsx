import { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import Button from './Button';

export default function Modal({ open, onClose, title, children, footer, size = 'md', danger = false }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles[size]} ${danger ? styles.danger : ''}`} role="dialog" aria-modal>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.close} onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" danger={danger}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </div>
      }
    >
      <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
