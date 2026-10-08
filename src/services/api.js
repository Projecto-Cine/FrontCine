/**
 * Cliente HTTP del panel de empleados.
 *
 * La implementacion vive en httpClient.js, compartida con la tienda. Aqui solo
 * se fija a que sesion pertenece.
 */
import { createHttpClient, BASE } from './httpClient';

export { BASE };

export const STAFF_TOKEN_KEY = 'lumen_token';
export const STAFF_USER_KEY = 'lumen_user';

export const api = createHttpClient({
  tokenKey: STAFF_TOKEN_KEY,
  userKey: STAFF_USER_KEY,
  expiredEvent: 'auth:expired',
});
