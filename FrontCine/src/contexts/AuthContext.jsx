import { createContext, useContext, useState, useCallback } from 'react';
import { USERS } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const login = useCallback((username, password) => {
    const found = USERS.find(u => u.username === username);
    if (!found || found.status === 'inactive') {
      setError('Credenciales inválidas o cuenta desactivada.');
      return false;
    }
    if (password !== 'lumen2024') {
      setError('Credenciales inválidas o cuenta desactivada.');
      return false;
    }
    setUser(found);
    setError('');
    return true;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const can = useCallback((action) => {
    if (!user) return false;
    const perms = { admin: true, supervisor: ['read','create','update','approve'], operator: ['read','create','update'], ticket: ['read','create_reservation'], maintenance: ['read','create_incident','update_incident'], readonly: ['read'] };
    const p = perms[user.role];
    return p === true || (Array.isArray(p) && (p.includes('*') || p.includes(action)));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, error, setError, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
