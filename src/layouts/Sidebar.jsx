import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Film, Building2, CalendarDays, Ticket,
  AlertTriangle, Package, Users, UserSearch,
  ChevronDown, ChevronRight, LogOut, ShoppingCart, TicketCheck, ClipboardList
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import logoSrc from '../assets/logoLumen.png';
import styles from './Sidebar.module.css';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/', exact: true },
  {
    section: 'PUNTO DE VENTA',
    items: [
      { label: 'Taquilla', icon: TicketCheck, to: '/box-office', highlight: true },
      { label: 'Caja / Concesión', icon: ShoppingCart, to: '/concession', highlight: true },
    ],
  },
  {
    section: 'OPERACIONES',
    items: [
      { label: 'Películas', icon: Film, to: '/movies' },
      { label: 'Salas', icon: Building2, to: '/rooms' },
      { label: 'Horarios', icon: CalendarDays, to: '/schedules' },
      { label: 'Reservas', icon: Ticket, to: '/reservations' },
    ],
  },
  {
    section: 'GESTIÓN',
    items: [
      { label: 'Incidencias', icon: AlertTriangle, to: '/incidents' },
       { label: 'Inventario', icon: Package, to: '/inventory' },
       { label: 'Cuadrante', icon: ClipboardList, to: '/shifts' },
    ],
  },
  {
    section: 'ADMINISTRACIÓN',
    items: [
      { label: 'Trabajadores', icon: Users, to: '/employees' },
      { label: 'Clientes', icon: UserSearch, to: '/clients' },
    ],
  },
];

const ROLE_LABELS = {
  admin: 'Administrador', supervisor: 'Supervisor', operator: 'Operador',
  ticket: 'Taquilla', maintenance: 'Mantenimiento', readonly: 'Consulta',
};

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.exact}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.active : ''} ${item.highlight ? styles.highlight : ''}`
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={15} className={styles.navIcon} />
      {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed } = useApp();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (s) => setCollapsed(prev => ({ ...prev, [s]: !prev[s] }));

  return (
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      {/* Logo — solo imagen, protagonismo total */}
      <div className={styles.logo}>
        <img
          src={logoSrc}
          alt="Lumen Cinema"
          className={`${styles.logoImg} ${sidebarCollapsed ? styles.logoImgCollapsed : ''}`}
        />
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV.map((item, i) => {
          if (item.to) return <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} />;
          return (
            <div key={i} className={styles.section}>
              {!sidebarCollapsed && (
                <button className={styles.sectionHeader} onClick={() => toggleSection(item.section)}>
                  <span className={styles.sectionLabel}>{item.section}</span>
                  {collapsed[item.section] ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                </button>
              )}
              {!collapsed[item.section] && item.items.map(sub => (
                <NavItem key={sub.to} item={sub} collapsed={sidebarCollapsed} />
              ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom user + logout */}
      <div className={styles.bottom}>
        {!sidebarCollapsed && user && (
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{user.name.charAt(0)}</div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user.name.split(' ')[0]}</span>
              <span className={styles.userRole}>{ROLE_LABELS[user.role] || user.role}</span>
            </div>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={logout} title="Cerrar sesión">
          <LogOut size={14} />
          {!sidebarCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
