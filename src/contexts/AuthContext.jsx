import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const EMPLOYEE_ROLES = new Set(['GERENCIA', 'CAJERO', 'LIMPIEZA', 'MANTENIMIENTO']);
const ROLE_REDIRECT  = { CAJERO: '/box-office', LIMPIEZA: '/shifts', MANTENIMIENTO: '/shifts' };
const EMPLOYEE_PERMISSIONS = {
  GERENCIA:      '*',
  CAJERO:        ['/', '/box-office', '/concession', '/reservations', '/shifts'],
  LIMPIEZA:      ['/', '/shifts'],
  MANTENIMIENTO: ['/', '/shifts'],
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  // Restaurar sesión al recargar si hay token guardado.
  // En dev, si es un tab nuevo (sessionStorage vacío), limpia la sesión
  // para que npm run dev siempre arranque en login.
  useEffect(() => {
    if (import.meta.env.DEV && !sessionStorage.getItem('_auth_init')) {
      sessionStorage.setItem('_auth_init', '1');
      localStorage.removeItem('lumen_token');
      localStorage.removeItem('lumen_user');
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('lumen_token');
    if (!token) { setLoading(false); return; }

    const saved = localStorage.getItem('lumen_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {
        localStorage.removeItem('lumen_token');
        localStorage.removeItem('lumen_user');
      }
    } else {
      localStorage.removeItem('lumen_token');
    }
    setLoading(false);
  }, []);

  // Escuchar 401 globales desde api.js → limpiar sesión sin hard-redirect
  useEffect(() => {
    const handle = () => setUser(null);
    window.addEventListener('auth:expired', handle);
    return () => window.removeEventListener('auth:expired', handle);
  }, []);

  const login = useCallback(async (email, password, { employeeOnly = false } = {}) => {
    setError('');
    try {
      let res;
      if (employeeOnly) {
        res = await authService.employeeLogin(email, password);
      } else {
        // Try employee endpoint first; fall back to regular login on 401
        try {
          res = await authService.employeeLogin(email, password);
          if (!EMPLOYEE_ROLES.has(res?.user?.role)) throw Object.assign(new Error(), { status: 401 });
        } catch (e) {
          if (e?.status !== 401) throw e;
          res = await authService.login(email, password);
        }
      }
      if (!res?.token || !res?.user) { setError('Credenciales inválidas.'); return null; }
      localStorage.setItem('lumen_token', res.token);
      localStorage.setItem('lumen_user', JSON.stringify(res.user));
      setUser(res.user);
      return ROLE_REDIRECT[res.user.role] ?? '/';
    } catch (err) {
      if (err?.status === 401) {
        setError('Email o contraseña incorrectos.');
      } else if (err?.status === 500) {
        setError('Error en el servidor. Comprueba que el backend está activo.');
      } else {
        setError('No se puede conectar con el servidor. ¿Está Spring Boot arrancado?');
      }
      return null;
    }
  }, [setError, setUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('lumen_token');
    localStorage.removeItem('lumen_user');
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const canAccess = useCallback((path) => {
    if (!user) return false;
    const perms = EMPLOYEE_PERMISSIONS[user.role];
    if (!perms) return false;
    if (perms === '*') return true;
    return perms.includes(path);
  }, [user]);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, error, setError, hasRole, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
