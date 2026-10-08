/**
 * Cliente HTTP de la tienda de clientes.
 *
 * Usa claves de sesion propias para que un empleado pueda tener abiertos a la
 * vez el panel y la tienda sin que una sesion desplace a la otra. El transporte
 * es el mismo que el del panel: ver httpClient.js.
 */
import { createHttpClient } from './httpClient';

export const SHOP_TOKEN_KEY = 'lumen_shop_token';
export const SHOP_USER_KEY = 'lumen_shop_user';

export const shopApi = createHttpClient({
  tokenKey: SHOP_TOKEN_KEY,
  userKey: SHOP_USER_KEY,
  expiredEvent: 'shop:auth:expired',
});
