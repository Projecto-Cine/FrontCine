import { createContext, useContext, useState, useCallback } from 'react';
import { shopApi, SHOP_TOKEN_KEY, SHOP_USER_KEY } from '../services/shopApi';

const ShopAuthContext = createContext(null);

/**
 * Sesión de cliente de la tienda.
 *
 * El registro llamaba a `/users/quick-register`, que exigía token (de modo que
 * un visitante nuevo recibía 401) y devolvía un DTO sin token (de modo que, aun
 * pasando, la comprobación de `res.token` fallaba siempre). Además enviaba
 * `dateOfBirth` cuando el backend esperaba `birthDate`, así que la fecha se
 * perdía — y de ella depende el control de calificación por edad al comprar.
 *
 * Ahora usa `/auth/register`, que es público y responde `{ token, user }`.
 */
export function ShopAuthProvider({ children }) {
  const [shopUser, setShopUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SHOP_USER_KEY) ?? 'null'); } catch { return null; }
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const _persist = (token, user) => {
    localStorage.setItem(SHOP_TOKEN_KEY, token);
    localStorage.setItem(SHOP_USER_KEY, JSON.stringify(user));
    setShopUser(user);
    window.dispatchEvent(new CustomEvent('shop:auth'));
  };

  const _clearErrors = () => {
    setError('');
    setFieldErrors({});
  };

  const login = useCallback(async (email, password) => {
    _clearErrors();
    try {
      const res = await shopApi.post('/auth/login', { email, password });
      if (!res?.token || !res?.user) { setError('Credenciales incorrectas.'); return false; }
      _persist(res.token, res.user);
      return true;
    } catch (err) {
      if (err?.status === 401) { setError('Email o contraseña incorrectos.'); return false; }
      if (err?.status === 429) {
        setError('Demasiados intentos. Espera unos minutos y vuelve a probar.');
        return false;
      }
      setError('No se pudo conectar con el servidor.');
      return false;
    }
  }, []);

  const register = useCallback(async ({ name, lastName, email, password, birthDate }) => {
    _clearErrors();
    try {
      // El rol, el tipo de usuario y los descuentos los decide el servidor:
      // enviarlos desde aquí sería elegir el propio precio.
      const res = await shopApi.post('/auth/register', {
        name, lastName, email, password, birthDate,
      });
      if (!res?.token || !res?.user) { setError('No se pudo crear la cuenta.'); return false; }
      _persist(res.token, res.user);
      return true;
    } catch (err) {
      if (err?.status === 409) {
        setFieldErrors({ email: 'Ya existe una cuenta con este email.' });
        return false;
      }
      if (err?.status === 400) {
        // Ante un error de validación el backend responde directamente el mapa
        // campo -> mensaje, sin envolverlo, así que el cuerpo ya es lo que hay
        // que pintar junto a cada campo.
        const details = err?.body;
        const isFieldMap = details && typeof details === 'object' && !Array.isArray(details)
          && Object.values(details).every((v) => typeof v === 'string');
        if (isFieldMap) {
          setFieldErrors(details);
        } else {
          setError(details?.message ?? 'Revisa los datos del formulario.');
        }
        return false;
      }
      if (err?.status === 429) {
        setError('Demasiados intentos. Espera unos minutos y vuelve a probar.');
        return false;
      }
      setError('No se pudo conectar con el servidor. Inténtalo de nuevo.');
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
    <ShopAuthContext.Provider
      value={{ shopUser, login, logout, register, error, setError, fieldErrors, setFieldErrors }}>
      {children}
    </ShopAuthContext.Provider>
  );
}

export const useShopAuth = () => useContext(ShopAuthContext);
