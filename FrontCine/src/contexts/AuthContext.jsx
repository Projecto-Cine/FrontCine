import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lumen_token');
    if (token) {
      authService.me()
        .then(({ user }) => setUser(user))
        .catch(() => localStorage.removeItem('lumen_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    setError('');
    try {
      const { user, token } = await authService.login({ username, password });
      localStorage.setItem('lumen_token', token);
      setUser(user);
      return true;
    } catch (e) {
      setError(e.message || 'Credenciales inválidas o cuenta desactivada.');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    authService.logout().catch(() => {});
    localStorage.removeItem('lumen_token');
    setUser(null);
  }, []);

  const can = useCallback((action) => {
    if (!user) return false;
    const perms = {
      admin: true,
      supervisor: ['read', 'create', 'update', 'approve'],
      operator: ['read', 'create', 'update'],
      ticket: ['read', 'create_reservation'],
      maintenance: ['read', 'create_incident', 'update_incident'],
      readonly: ['read'],
    };
    const p = perms[user.role];
    return p === true || (Array.isArray(p) && (p.includes('*') || p.includes(action)));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, error, setError, can, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
