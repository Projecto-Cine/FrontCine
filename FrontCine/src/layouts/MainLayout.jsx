import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Toasts from '../components/shared/Toasts';
import StatusBar from '../components/shared/StatusBar';
import CommandPalette from '../components/shared/CommandPalette';
import AccessibilityWidget from '../components/accessibility/AccessibilityWidget';
import { useApp } from '../contexts/AppContext';
import '../App.css';

export default function MainLayout() {
  const { sidebarCollapsed } = useApp();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

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
