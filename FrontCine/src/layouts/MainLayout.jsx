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
      <Sidebar />
      <div className={`main-area ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <Toasts />
      <AccessibilityWidget />
    </div>
  );
}
