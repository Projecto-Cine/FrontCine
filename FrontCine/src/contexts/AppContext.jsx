import { createContext, useContext, useState, useCallback, useRef } from 'react';

const AppContext = createContext(null);

const LS_SIDEBAR = 'lumen_sidebar_collapsed';

export function AppProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(LS_SIDEBAR) === 'true'; } catch { return false; }
  });
  const [toasts, setToasts] = useState([]);
  const toastCounter = useRef(0);

  const toggleSidebar = useCallback(() => setSidebarCollapsed(v => {
    const next = !v;
    try { localStorage.setItem(LS_SIDEBAR, String(next)); } catch {}
    return next;
  }), []);

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <AppContext.Provider value={{ sidebarCollapsed, toggleSidebar, toasts, toast, removeToast }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
