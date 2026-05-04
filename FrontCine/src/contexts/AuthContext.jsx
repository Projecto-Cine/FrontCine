import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

// Fallback para desarrollo mientras el backend no esté disponible
const DEV_USERS = [
  { id: 1,  username: 'admin1',       name: 'Ana Admin',     role: 'admin',       status: 'active' },
  { id: 2,  username: 'supervisor1',  name: 'Sara Supervisora', role: 'supervisor', status: 'active' },
  { id: 3,  username: 'operador1',    name: 'Omar Operador', role: 'operator',    status: 'active' },
  { id: 4,  username: 'taquilla1',    name: 'Tania Taquilla', role: 'ticket',     status: 'active' },
  { id: 5,  username: 'mantenim1',    name: 'Miguel Mantenimiento', role: 'maintenance', status: 'active' },
  { id: 6,  username: 'consulta1',    name: 'Carmen Consulta', role: 'readonly',  status: 'active' },
];
const DEV_PASSWORD = 'lumen2024';

function devLogin(username, password) {
  const found = DEV_USERS.find(u => u.username === username && u.status === 'active');
  if (!found || password !== DEV_PASSWORD) return null;
  return found;
}

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
    } catch {
      // Backend no disponible — usar credenciales de desarrollo
      const devUser = devLogin(username, password);
      if (devUser) {
        setUser(devUser);
        return true;
      }
      setError('Credenciales inválidas o cuenta desactivada.');
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
