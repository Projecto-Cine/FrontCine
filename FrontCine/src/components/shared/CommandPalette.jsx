import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Film, Building2, CalendarDays, Ticket,
  AlertTriangle, Package, Users, ShieldCheck, UserSearch,
  TicketCheck, ShoppingCart, ClipboardList, Search, ArrowRight,
} from 'lucide-react';
import styles from './CommandPalette.module.css';

const COMMANDS = [
  { label: 'Dashboard',              icon: LayoutDashboard, to: '/',             section: 'Navegación' },
  { label: 'Taquilla',               icon: TicketCheck,     to: '/box-office',   section: 'Punto de venta' },
  { label: 'Caja / Concesión',       icon: ShoppingCart,    to: '/concession',   section: 'Punto de venta' },
  { label: 'Películas',              icon: Film,            to: '/movies',       section: 'Operaciones' },
  { label: 'Salas',                  icon: Building2,       to: '/rooms',        section: 'Operaciones' },
  { label: 'Horarios',               icon: CalendarDays,    to: '/schedules',    section: 'Operaciones' },
  { label: 'Reservas',               icon: Ticket,          to: '/reservations', section: 'Operaciones' },
  { label: 'Incidencias',            icon: AlertTriangle,   to: '/incidents',    section: 'Gestión' },
  { label: 'Inventario',             icon: Package,         to: '/inventory',    section: 'Gestión' },
  { label: 'Cuadrante de Turnos',    icon: ClipboardList,   to: '/shifts',       section: 'Gestión' },
  { label: 'Trabajadores',           icon: Users,           to: '/employees',    section: 'Administración' },
  { label: 'Clientes',               icon: UserSearch,      to: '/clients',      section: 'Administración' },
  { label: 'Auditoría y Seguridad',  icon: ShieldCheck,     to: '/audit',        section: 'Administración' },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return COMMANDS;
    return COMMANDS.filter(c =>
      c.label.toLowerCase().includes(q) || c.section.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => { setCursor(0); }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(v => Math.min(v + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(v => Math.max(v - 1, 0)); }
      if (e.key === 'Enter' && results[cursor]) { navigate(results[cursor].to); onClose(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, cursor, results, navigate, onClose]);

  useEffect(() => {
    const el = listRef.current?.children[cursor];
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  const go = (to) => { navigate(to); onClose(); };

  let lastSection = null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Paleta de comandos">
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.inputWrap}>
          <Search size={15} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Ir a... (escribe el nombre de la sección)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Buscar sección"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className={styles.esc}>Esc</kbd>
        </div>

        <div className={styles.list} ref={listRef} role="listbox">
          {results.length === 0 && (
            <p className={styles.noResult}>Sin resultados para "{query}"</p>
          )}
          {results.map((cmd, i) => {
            const showSection = cmd.section !== lastSection;
            lastSection = cmd.section;
            const Icon = cmd.icon;
            return (
              <div key={cmd.to}>
                {showSection && <p className={styles.section}>{cmd.section}</p>}
                <button
                  role="option"
                  aria-selected={i === cursor}
                  className={`${styles.item} ${i === cursor ? styles.active : ''}`}
                  onClick={() => go(cmd.to)}
                  onMouseEnter={() => setCursor(i)}
                >
                  <Icon size={14} className={styles.itemIcon} aria-hidden="true" />
                  <span className={styles.itemLabel}>{cmd.label}</span>
                  <ArrowRight size={12} className={styles.itemArrow} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <span><kbd className={styles.kbd}>↑↓</kbd> navegar</span>
          <span><kbd className={styles.kbd}>Enter</kbd> abrir</span>
          <span><kbd className={styles.kbd}>Esc</kbd> cerrar</span>
          <span className={styles.tip}><kbd className={styles.kbd}>Ctrl K</kbd> abrir en cualquier momento</span>
        </div>
      </div>
    </div>
  );
}
