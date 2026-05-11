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
      { label: 'Taquilla',         icon: TicketCheck,   to: '/box-office',  highlight: true },
      { label: 'Caja / Concesión', icon: ShoppingCart,  to: '/concession',  highlight: true },
    ],
  },
  {
    section: 'OPERACIONES',
    items: [
      { label: 'Películas', icon: Film,          to: '/movies' },
      { label: 'Salas',     icon: Building2,     to: '/rooms' },
      { label: 'Horarios',  icon: CalendarDays,  to: '/schedules' },
      { label: 'Reservas',  icon: Ticket,        to: '/reservations' },
    ],
  },
  {
    section: 'GESTIÓN',
    items: [
      { label: 'Incidencias', icon: AlertTriangle, to: '/incidents' },
      { label: 'Inventario',  icon: Package,       to: '/inventory' },
      { label: 'Cuadrante',   icon: ClipboardList, to: '/shifts' },
    ],
  },
  {
    section: 'ADMINISTRACIÓN',
    items: [
      { label: 'Trabajadores', icon: Users,      to: '/employees' },
      { label: 'Clientes',     icon: UserSearch, to: '/clients' },
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
      aria-label={collapsed ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          <item.icon size={15} className={styles.navIcon} aria-hidden="true" />
          {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
          {isActive && <span className="sr-only">(página actual)</span>}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed } = useApp();
  const { user, logout }     = useAuth();
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (s) => setCollapsed(prev => ({ ...prev, [s]: !prev[s] }));

  return (
    <aside
      id="app-sidebar"
      className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}
      aria-label="Navegación principal"
    >
      <div className={styles.logo}>
        <img
          src={logoSrc}
          alt="Lumen Cinema"
          className={`${styles.logoImg} ${sidebarCollapsed ? styles.logoImgCollapsed : ''}`}
          width={sidebarCollapsed ? 32 : 120}
          height={32}
        />
      </div>

      <nav aria-label="Menú principal">
        {NAV.map((item, i) => {
          if (item.to) return <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} />;

          const isCollapsedSection = !!collapsed[item.section];
          const sectionId = `nav-section-${i}`;

          return (
            <div key={i} className={styles.section}>
              {!sidebarCollapsed && (
                <button
                  id={sectionId}
                  className={styles.sectionHeader}
                  onClick={() => toggleSection(item.section)}
                  aria-expanded={!isCollapsedSection}
                  aria-controls={`${sectionId}-items`}
                >
                  <span className={styles.sectionLabel}>{item.section}</span>
                  {isCollapsedSection
                    ? <ChevronRight size={10} aria-hidden="true" />
                    : <ChevronDown size={10} aria-hidden="true" />
                  }
                </button>
              )}
              <div
                id={`${sectionId}-items`}
                role="group"
                aria-labelledby={!sidebarCollapsed ? sectionId : undefined}
              >
                {!isCollapsedSection && item.items.map(sub => (
                  <NavItem key={sub.to} item={sub} collapsed={sidebarCollapsed} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        {!sidebarCollapsed && user && (
          <div className={styles.userInfo} aria-label={`${user.name}, ${ROLE_LABELS[user.role] || user.role}`}>
            <div className={styles.avatar} aria-hidden="true">{user.name.charAt(0)}</div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user.name.split(' ')[0]}</span>
              <span className={styles.userRole}>{ROLE_LABELS[user.role] || user.role}</span>
            </div>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={logout} aria-label="Cerrar sesión">
          <LogOut size={14} aria-hidden="true" />
          {!sidebarCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
