import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';
import { USERS } from '../data/mockData';

const AuthContext = createContext(null);

// Fallback mock: activo cuando el backend no tiene /auth/login implementado
function mockLogin(username, password) {
  const found = USERS.find(u => u.username === username);
  if (!found || found.status === 'inactive') return null;
  if (password !== 'lumen2026') return null;
  return { user: found, token: 'mock-token-' + found.id };
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  // Restaurar sesión al recargar si hay token guardado
  useEffect(() => {
    const token = localStorage.getItem('lumen_token');
    if (!token) { setLoading(false); return; }

    // Token de mock → restaurar directamente desde localStorage
    if (token.startsWith('mock-token-')) {
      const saved = localStorage.getItem('lumen_user');
      if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
      setLoading(false);
      return;
    }

    // Token real → verificar con el backend
    authService.me()
      .then(res => setUser(res?.user ?? null))
      .catch(() => localStorage.removeItem('lumen_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    setError('');
    try {
      // Intentar login real con el backend
      const res = await authService.login(username, password);
      if (res?.token) localStorage.setItem('lumen_token', res.token);
      if (res?.user) localStorage.setItem('lumen_user', JSON.stringify(res.user));
      if (res?.user?.status === 'inactive') {
        setError('Cuenta desactivada. Contacta con el administrador.');
        return false;
      }
      setUser(res?.user ?? null);
      return true;
    } catch {
      // Backend no disponible o endpoint no implementado → usar mock
      const mock = mockLogin(username, password);
      if (!mock) {
        setError('Credenciales inválidas o cuenta desactivada.');
        return false;
      }
      localStorage.setItem('lumen_token', mock.token);
      localStorage.setItem('lumen_user', JSON.stringify(mock.user));
      setUser(mock.user);
      return true;
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('lumen_token');
    if (token && !token.startsWith('mock-token-')) {
      try { await authService.logout(); } catch {}
    }
    localStorage.removeItem('lumen_token');
    localStorage.removeItem('lumen_user');
    setUser(null);
  }, []);

  const can = useCallback((action) => {
    if (!user) return false;
    const role = (user.role ?? '').toLowerCase();
    const perms = {
      admin:       true,
      supervisor:  ['read', 'create', 'update', 'approve'],
      operator:    ['read', 'create', 'update'],
      ticket:      ['read', 'create_reservation'],
      maintenance: ['read', 'create_incident', 'update_incident'],
      readonly:    ['read'],
    };
    const p = perms[role];
    return p === true || (Array.isArray(p) && (p.includes('*') || p.includes(action)));
  }, [user]);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, error, setError, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
