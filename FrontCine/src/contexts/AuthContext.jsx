import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

// Normaliza la respuesta del backend al formato interno del frontend
function normalizeUser(apiUser) {
  return {
    ...apiUser,
    name: apiUser.nombre,
    role: apiUser.rol === 'ADMIN' ? 'admin' : 'cliente',
  };
}

// Fallback para desarrollo cuando el backend no está disponible
const DEV_USERS = [
  { id: 1, nombre: 'Ana Admin',      email: 'admin@lumen.com',    rol: 'ADMIN'   },
  { id: 2, nombre: 'Carlos Cliente', email: 'cliente@lumen.com',  rol: 'CLIENTE' },
];
const DEV_PASSWORD = 'lumen2024';

function devLogin(email, password) {
  const found = DEV_USERS.find(u => u.email === email);
  if (!found || password !== DEV_PASSWORD) return null;
  return normalizeUser(found);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('lumen_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('lumen_user'); }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    setError('');
    try {
      const apiUser = await authService.login({ email, password });
      const normalized = normalizeUser(apiUser);
      localStorage.setItem('lumen_user', JSON.stringify(normalized));
      setUser(normalized);
      return true;
    } catch {
      const devUser = devLogin(email, password);
      if (devUser) {
        localStorage.setItem('lumen_user', JSON.stringify(devUser));
        setUser(devUser);
        return true;
      }
      setError('Credenciales inválidas o cuenta desactivada.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lumen_user');
    setUser(null);
  }, []);

  const can = useCallback((action) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return ['read', 'create_reservation'].includes(action);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, error, setError, can, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
