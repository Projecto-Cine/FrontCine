import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Toasts from '../components/shared/Toasts';
import AccessibilityWidget from '../components/accessibility/AccessibilityWidget';
import { useApp } from '../contexts/AppContext';
import '../App.css';

export default function MainLayout() {
  const { sidebarCollapsed } = useApp();
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <Sidebar />
      <div className={`main-area ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />
        <main id="main-content" className="page-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <Toasts />
      <AccessibilityWidget />
    </div>
  );
}
