import { PanelLeftClose, PanelLeft, Bell, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import styles from './Header.module.css';

const ROUTE_LABELS = {
  '/':           'Dashboard',
  '/taquilla':   'Taquilla — Venta de Entradas',
  '/caja':       'Caja — Concesión',
  '/peliculas':  'Películas',
  '/salas':      'Salas',
  '/horarios':   'Horarios',
  '/reservas':   'Reservas',
  '/incidencias':'Incidencias',
  '/inventario': 'Inventario',
  '/cuadrante':  'Cuadrante de Turnos',
  '/informes':   'Informes',
  '/usuarios':   'Trabajadores',
  '/auditoria':  'Auditoría y Seguridad',
};

const ROLE_LABELS = {
  admin: 'Administrador', supervisor: 'Supervisor', operator: 'Operador',
  ticket: 'Taquilla', maintenance: 'Mantenimiento', readonly: 'Consulta',
};

export default function Header() {
  const { sidebarCollapsed, toggleSidebar } = useApp();
  const { user } = useAuth();
  const location = useLocation();
  const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const pageLabel = ROUTE_LABELS[location.pathname] || 'Lumen';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          className={styles.toggleBtn}
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          aria-expanded={!sidebarCollapsed}
          aria-controls="app-sidebar"
        >
          {sidebarCollapsed
            ? <PanelLeft size={15} aria-hidden="true" />
            : <PanelLeftClose size={15} aria-hidden="true" />
          }
        </button>
        <div className={styles.pageDivider} aria-hidden="true" />
        {/* h1 visible — es el titular principal de la página actual */}
        <h1 className={styles.pageTitle}>{pageLabel}</h1>
      </div>

      <div className={styles.right}>
        <div className={styles.clock} aria-hidden="true">
          <Clock size={11} />
          <span>{now}</span>
        </div>
        <button className={styles.iconBtn} aria-label="Notificaciones" aria-haspopup="true">
          <Bell size={14} aria-hidden="true" />
          <span className={styles.notifDot} aria-hidden="true" />
        </button>
        {user && (
          <div className={styles.userChip} aria-label={`Usuario: ${user.name}, rol: ${ROLE_LABELS[user.role]}`}>
            <div className={styles.avatar} aria-hidden="true">{user.name.charAt(0)}</div>
            <div className={styles.meta}>
              <span className={styles.name}>{user.name.split(' ')[0]}</span>
              <span className={styles.role}>{ROLE_LABELS[user.role]}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
