import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lumen_token');
    if (!token) { setLoading(false); return; }
    authService.me()
      .then(res => setUser(res?.user ?? null))
      .catch(() => localStorage.removeItem('lumen_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const res = await authService.login(username, password);
      if (res?.token) localStorage.setItem('lumen_token', res.token);
      if (res?.user?.status === 'inactive') {
        setError('Cuenta desactivada. Contacta con el administrador.');
        return false;
      }
      setUser(res?.user ?? null);
      setError('');
      return true;
    } catch {
      setError('Credenciales inválidas o cuenta desactivada.');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    localStorage.removeItem('lumen_token');
    setUser(null);
  }, []);

  const can = useCallback((action) => {
    if (!user) return false;
    const role = (user.role ?? '').toLowerCase();
    const perms = {
      admin: true,
      supervisor: ['read', 'create', 'update', 'approve'],
      operator:   ['read', 'create', 'update'],
      ticket:     ['read', 'create_reservation'],
      maintenance:['read', 'create_incident', 'update_incident'],
      readonly:   ['read'],
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
