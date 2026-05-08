import { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import styles from './ShortcutsModal.module.css';

const SHORTCUTS = [
  { section: 'Navegación global' },
  { key: '?', desc: 'Mostrar este panel' },
  { key: 'Esc', desc: 'Cerrar modal / panel activo' },
  { section: 'Punto de venta' },
  { key: 'F2', desc: 'Buscar producto (Caja)' },
  { key: 'F4', desc: 'Cobrar / procesar pago (Caja)' },
  { key: 'Esc', desc: 'Cancelar venta en curso' },
  { section: 'Tablas y listas' },
  { key: '↑ / ↓', desc: 'Navegar filas con teclado' },
  { key: 'Enter / Space', desc: 'Abrir fila seleccionada' },
  { key: 'Ctrl + A', desc: 'Seleccionar todo (cuando aplica)' },
  { section: 'Sidebar' },
  { key: 'Clic en toggle', desc: 'Colapsar / expandir barra lateral' },
];

export default function ShortcutsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Atajos de teclado">
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <Keyboard size={14} aria-hidden="true" />
          <span className={styles.title}>Atajos de teclado</span>
          <button className={styles.close} onClick={onClose} aria-label="Cerrar panel de atajos"><X size={14} /></button>
        </div>
        <div className={styles.body}>
          {SHORTCUTS.map((item, i) =>
            item.section ? (
              <p key={i} className={styles.section}>{item.section}</p>
            ) : (
              <div key={i} className={styles.row}>
                <kbd className={styles.kbd}>{item.key}</kbd>
                <span className={styles.desc}>{item.desc}</span>
              </div>
            )
          )}
        </div>
        <div className={styles.footer}>
          Pulsa <kbd className={styles.kbd}>?</kbd> en cualquier momento para abrir este panel
        </div>
      </div>
    </div>
  );
}
