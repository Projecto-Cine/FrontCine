import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Film, Building2, CalendarDays, Ticket,
  AlertTriangle, Package, Users, UserSearch,
  ChevronDown, ChevronRight, LogOut, ShoppingCart, TicketCheck, ClipboardList
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import logoSrc from '../assets/logoLumen.png';
import logoWebp from '../assets/logoLumen.webp';
import styles from './Sidebar.module.css';

const NAV = [
  { labelKey: 'nav.dashboard', icon: LayoutDashboard, to: '/', exact: true },
  {
    sectionKey: 'nav.pos',
    items: [
      { labelKey: 'nav.boxOffice',   icon: TicketCheck,  to: '/box-office', highlight: true },
      { labelKey: 'nav.concession',  icon: ShoppingCart, to: '/concession', highlight: true },
    ],
  },
  {
    sectionKey: 'nav.operations',
    items: [
      { labelKey: 'nav.movies',        icon: Film,         to: '/movies' },
      { labelKey: 'nav.rooms',         icon: Building2,    to: '/rooms' },
      { labelKey: 'nav.schedules',     icon: CalendarDays, to: '/schedules' },
      { labelKey: 'nav.reservations',  icon: Ticket,       to: '/reservations' },
    ],
  },
  {
    sectionKey: 'nav.management',
    items: [
      { labelKey: 'nav.incidents', icon: AlertTriangle, to: '/incidents' },
      { labelKey: 'nav.inventory', icon: Package,       to: '/inventory' },
      { labelKey: 'nav.shifts',    icon: ClipboardList, to: '/shifts' },
    ],
  },
  {
    sectionKey: 'nav.admin',
    items: [
      { labelKey: 'nav.employees', icon: Users,      to: '/employees' },
      { labelKey: 'nav.clients',   icon: UserSearch, to: '/clients' },
    ],
  },
];

function NavItem({ item, collapsed, t }) {
  const label = t(item.labelKey);
  return (
    <NavLink
      to={item.to}
      end={item.exact}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.active + ' nav-active' : ''} ${item.highlight ? styles.highlight : ''}`
      }
      aria-label={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          <item.icon size={15} className={styles.navIcon} aria-hidden="true" />
          {!collapsed && <span className={styles.navLabel}>{label}</span>}
          {isActive && <span className="sr-only">({t('common.currentPage')})</span>}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed } = useApp();
  const { user, logout, canAccess } = useAuth();
  const { t }                = useLanguage();
  const location             = useLocation();
  const [collapsed, setCollapsed] = useState({});
  const navRef  = useRef(null);
  const pillRef = useRef(null);

  useEffect(() => {
    const active = navRef.current?.querySelector('.nav-active');
    if (!active || !pillRef.current) { if (pillRef.current) pillRef.current.style.opacity = '0'; return; }
    pillRef.current.style.transform = `translateY(${active.offsetTop}px)`;
    pillRef.current.style.height    = `${active.offsetHeight}px`;
    pillRef.current.style.opacity   = '1';
  }, [location.pathname, sidebarCollapsed]);

  const toggleSection = (s) => setCollapsed(prev => ({ ...prev, [s]: !prev[s] }));

  return (
    <aside
      id="app-sidebar"
      className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}
      aria-label="Navegación principal"
    >
      <div className={styles.logo}>
        <picture>
          <source srcSet={logoWebp} type="image/webp" />
          <img
            src={logoSrc}
            alt="Lumen Cinema"
            className={`${styles.logoImg} ${sidebarCollapsed ? styles.logoImgCollapsed : ''}`}
            width={sidebarCollapsed ? 32 : 120}
            height={32}
          />
        </picture>
      </div>

      <nav ref={navRef} className={styles.nav} aria-label="Menú principal">
        <div ref={pillRef} className={styles.slidingPill} aria-hidden="true" />
        {NAV.map((item, i) => {
          if (item.to) {
            if (!canAccess(item.to === '/' ? '/' : item.to)) return null;
            return <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} t={t} />;
          }

          const visibleItems = item.items.filter(sub => canAccess(sub.to));
          if (visibleItems.length === 0) return null;

          const isCollapsedSection = !!collapsed[item.sectionKey];
          const sectionId = `nav-section-${i}`;
          const sectionLabel = t(item.sectionKey);

          return (
            <div key={i} className={styles.section}>
              {!sidebarCollapsed && (
                <button
                  id={sectionId}
                  className={styles.sectionHeader}
                  onClick={() => toggleSection(item.sectionKey)}
                  aria-expanded={!isCollapsedSection}
                  aria-controls={`${sectionId}-items`}
                >
                  <span className={styles.sectionLabel}>{sectionLabel}</span>
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
                {!isCollapsedSection && visibleItems.map(sub => (
                  <NavItem key={sub.to} item={sub} collapsed={sidebarCollapsed} t={t} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        {!sidebarCollapsed && user && (
          <div className={styles.userInfo} aria-label={`${user.name}, ${t(`header.roles.${user.role}`) || user.role}`}>
            <div className={styles.avatar} aria-hidden="true">{user.name.charAt(0)}</div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user.name.split(' ')[0]}</span>
              <span className={styles.userRole}>{t(`header.roles.${user.role}`) || user.role}</span>
            </div>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={logout} aria-label={t('nav.logout')}>
          <LogOut size={14} aria-hidden="true" />
          {!sidebarCollapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
