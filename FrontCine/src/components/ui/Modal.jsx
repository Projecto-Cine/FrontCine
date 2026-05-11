import { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import Button from './Button';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Modal({ open, onClose, title, children, footer, size = 'md', danger = false }) {
  const titleId      = useId();
  const overlayRef   = useRef(null);
  const previousFocus = useRef(null);
  const onCloseRef   = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Foco inicial — solo cuando el modal abre, nunca en re-renders por form changes
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement;
    const modal = overlayRef.current?.querySelector('[role="dialog"]');
    if (modal) {
      const focusables = Array.from(modal.querySelectorAll(FOCUSABLE));
      // Saltar el botón X (close) y enfocar el primer campo de formulario
      const target = focusables.find(el => el.tagName !== 'BUTTON') ?? focusables[0] ?? modal;
      target.focus();
    }
    return () => previousFocus.current?.focus();
  }, [open]);

  // Trap de teclado — usa ref para onClose y no re-registra en cada render
  useEffect(() => {
    if (!open) return;
    const modal = overlayRef.current?.querySelector('[role="dialog"]');
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(modal?.querySelectorAll(FOCUSABLE) ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-hidden="false"
    >
      <div
        className={`${styles.modal} ${styles[size]} ${danger ? styles.danger : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Cerrar diálogo">
            <X size={16} aria-hidden="true" />
          </button>
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
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
