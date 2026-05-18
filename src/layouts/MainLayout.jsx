import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Toasts from '../components/shared/Toasts';
import StatusBar from '../components/shared/StatusBar';
import CommandPalette from '../components/shared/CommandPalette';
import AccessibilityWidget from '../components/accessibility/AccessibilityWidget';
import { useApp } from '../contexts/AppContext';
import '../App.css';

const ALT_ROUTES = [
  '/',             // Alt+1 dashboard
  '/box-office',   // Alt+2 box office
  '/concession',   // Alt+3 concession
  '/movies',       // Alt+4 movies
  '/rooms',        // Alt+5 rooms
  '/schedules',    // Alt+6 schedules
  '/reservations', // Alt+7 reservations
  '/incidents',    // Alt+8 incidents
  '/inventory',    // Alt+9 inventory
];

export default function MainLayout() {
  const { sidebarCollapsed, toggleSidebar } = useApp();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(v => !v);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < ALT_ROUTES.length) {
          e.preventDefault();
          navigate(ALT_ROUTES[idx]);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate, toggleSidebar]);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <Sidebar />
      <div className={`main-area ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header onOpenPalette={() => setPaletteOpen(true)} />
        <main id="main-content" className="page-content" tabIndex={-1}>
          <Outlet />
        </main>
        <StatusBar />
      </div>
      <Toasts />
      <AccessibilityWidget />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
