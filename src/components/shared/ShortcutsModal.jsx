import { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import styles from './ShortcutsModal.module.css';

const GROUPS = [
  {
    section: 'Navegación rápida',
    type: 'grid',
    items: [
      { key: 'Alt+1', desc: 'Dashboard'   },
      { key: 'Alt+2', desc: 'Taquilla'    },
      { key: 'Alt+3', desc: 'Concesión'   },
      { key: 'Alt+4', desc: 'Películas'   },
      { key: 'Alt+5', desc: 'Salas'       },
      { key: 'Alt+6', desc: 'Horarios'    },
      { key: 'Alt+7', desc: 'Reservas'    },
      { key: 'Alt+8', desc: 'Incidencias' },
      { key: 'Alt+9', desc: 'Inventario'  },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { key: 'Ctrl+K', desc: 'Abrir paleta de comandos'      },
      { key: 'Ctrl+B', desc: 'Colapsar / expandir sidebar'   },
      { key: '?',      desc: 'Mostrar este panel de atajos'  },
      { key: 'Esc',    desc: 'Cerrar modal o panel activo'   },
    ],
  },
  {
    section: 'Taquilla · POS',
    items: [
      { key: 'F2',  desc: 'Buscar sesión / película'   },
      { key: 'F4',  desc: 'Procesar cobro'              },
      { key: 'F5',  desc: 'Nueva venta'                 },
      { key: 'Esc', desc: 'Volver al paso anterior'     },
    ],
  },
  {
    section: 'Concesión · Caja',
    items: [
      { key: 'F2',  desc: 'Buscar producto'                   },
      { key: 'F4',  desc: 'Cobrar / abrir pago'               },
      { key: 'F5',  desc: 'Nueva venta / limpiar carrito'     },
      { key: 'Esc', desc: 'Cancelar venta (sin modal abierto)' },
    ],
  },
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
          <button className={styles.close} onClick={onClose} aria-label="Cerrar panel de atajos">
            <X size={14} />
          </button>
        </div>

        <div className={styles.body}>
          {GROUPS.map((group, gi) => (
            <div key={gi} className={styles.group}>
              <p className={styles.section}>{group.section}</p>

              {group.type === 'grid' ? (
                <div className={styles.navGrid}>
                  {group.items.map((item, i) => (
                    <div key={i} className={styles.navRow}>
                      <kbd className={styles.kbd}>{item.key}</kbd>
                      <span className={styles.desc}>{item.desc}</span>
                    </div>
                  ))}
                </div>
              ) : (
                group.items.map((item, i) => (
                  <div key={i} className={styles.row}>
                    <kbd className={styles.kbd}>{item.key}</kbd>
                    <span className={styles.desc}>{item.desc}</span>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          Pulsa <kbd className={styles.kbd}>?</kbd> en cualquier momento para abrir este panel
        </div>

      </div>
    </div>
  );
}
