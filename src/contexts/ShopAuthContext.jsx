import { createContext, useContext, useState, useCallback } from 'react';
import { shopApi, SHOP_TOKEN_KEY, SHOP_USER_KEY } from '../services/shopApi';

const ShopAuthContext = createContext(null);

export function ShopAuthProvider({ children }) {
  const [shopUser, setShopUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SHOP_USER_KEY) ?? 'null'); } catch { return null; }
  });
  const [error, setError] = useState('');

  const _persist = (token, user) => {
    localStorage.setItem(SHOP_TOKEN_KEY, token);
    localStorage.setItem(SHOP_USER_KEY, JSON.stringify(user));
    setShopUser(user);
    window.dispatchEvent(new CustomEvent('shop:auth'));
  };

  const login = useCallback(async (email, password) => {
    setError('');
    try {
      const res = await shopApi.post('/auth/login', { email, password });
      if (!res?.token || !res?.user) { setError('Credenciales incorrectas.'); return false; }
      _persist(res.token, res.user);
      return true;
    } catch (err) {
      setError(err?.status === 401 ? 'Email o contraseña incorrectos.' : 'No se pudo conectar con el servidor.');
      return false;
    }
  }, []);

  const register = useCallback(async ({ name, lastName, email, password, dateOfBirth }) => {
    setError('');
    try {
      const res = await shopApi.post('/users/quick-register', {
        name, lastName, email, password,
        dateOfBirth: dateOfBirth || null,
        role: 'CLIENTE',
        isFidelityMember: false,
      });
      if (!res?.token || !res?.user) { setError('No se pudo crear la cuenta.'); return false; }
      _persist(res.token, res.user);
      return true;
    } catch (err) {
      if (err?.status === 409) { setError('Ya existe una cuenta con ese email.'); return false; }
      setError('Error al crear la cuenta. Inténtalo de nuevo.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SHOP_TOKEN_KEY);
    localStorage.removeItem(SHOP_USER_KEY);
    setShopUser(null);
    window.dispatchEvent(new CustomEvent('shop:auth'));
  }, []);

  return (
    <ShopAuthContext.Provider value={{ shopUser, login, logout, register, error, setError }}>
      {children}
    </ShopAuthContext.Provider>
  );
}

export const useShopAuth = () => useContext(ShopAuthContext);
