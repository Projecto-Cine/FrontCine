import { PanelLeftClose, PanelLeft, Bell, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import styles from './Header.module.css';

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/taquilla': 'Taquilla — Venta de Entradas',
  '/caja': 'Caja — Concesión',
  '/peliculas': 'Películas',
  '/salas': 'Salas',
  '/horarios': 'Horarios',
  '/reservas': 'Reservas',
  '/incidencias': 'Incidencias',
  '/inventario': 'Inventario',
  '/cuadrante': 'Cuadrante de Turnos',
  '/informes': 'Informes',
  '/usuarios': 'Trabajadores',
  '/auditoria': 'Auditoría y Seguridad',
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

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.toggleBtn} onClick={toggleSidebar} title="Alternar barra lateral">
          {sidebarCollapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={15} />}
        </button>
        <div className={styles.pageDivider} />
        <h2 className={styles.pageTitle}>{ROUTE_LABELS[location.pathname] || 'Lumen'}</h2>
      </div>

      <div className={styles.right}>
        <div className={styles.clock}>
          <Clock size={11} />
          <span>{now}</span>
        </div>
        <button className={styles.iconBtn} title="Notificaciones">
          <Bell size={14} />
          <span className={styles.notifDot} />
        </button>
        {user && (
          <div className={styles.userChip}>
            <div className={styles.avatar}>{user.name.charAt(0)}</div>
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
