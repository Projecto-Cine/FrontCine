import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  // Restaurar sesión al recargar si hay token guardado
  useEffect(() => {
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

  const login = useCallback(async (email, password) => {
    setError('');
    try {
      const res = await authService.login(email, password);
      if (!res?.token || !res?.user) {
        setError('Credenciales inválidas.');
        return false;
      }
      localStorage.setItem('lumen_token', res.token);
      localStorage.setItem('lumen_user', JSON.stringify(res.user));
      setUser(res.user);
      return true;
    } catch (err) {
      if (err?.status === 401) {
        setError('Email o contraseña incorrectos.');
      } else if (err?.status === 500) {
        setError('Error en el servidor. Comprueba que el backend está activo.');
      } else {
        setError('No se puede conectar con el servidor. ¿Está Spring Boot arrancado?');
      }
      return false;
    }
  }, []);

  const logout = useCallback(() => {
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
