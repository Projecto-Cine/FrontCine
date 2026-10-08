/**
 * Cliente HTTP compartido.
 *
 * Antes habia dos: api.js para el panel y shopApi.js para la tienda, con la
 * misma funcion unwrap copiada y el mismo armado de cabeceras. Ya habian
 * empezado a divergir — api.js manejaba el 401 y shopApi.js no, asi que a un
 * cliente con la sesion caducada le fallaban las llamadas sin que nada la
 * limpiara ni le avisara.
 *
 * La razon de que existan dos sesiones sigue siendo valida: el panel y la
 * tienda conviven en la misma aplicacion y un empleado puede tener abiertas las
 * dos a la vez, de modo que cada una guarda su token bajo su propia clave. Lo
 * que no tiene sentido es duplicar el transporte, asi que aqui hay una sola
 * implementacion parametrizada por esa clave.
 */

export const BASE = import.meta.env.VITE_API_URL ?? '/api';

/**
 * Desenvuelve la respuesta del backend.
 *
 * La API responde con varias formas segun el endpoint: unas veces el recurso
 * directamente, otras envuelto en ApiResponse ({ data }), y las listas
 * paginadas en { content }. Esto las normaliza para que las paginas reciban
 * siempre el dato y no tengan que saber cual les toca.
 */
export function unwrap(data) {
  if (data && typeof data === 'object') {
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.data)) return data.data;
    if ('data' in data) {
      const inner = data.data;
      if (Array.isArray(inner?.content)) return inner.content;
      if (Array.isArray(inner)) return inner;
      return inner;
    }
    if ('payload' in data) return data.payload;
  }
  return data;
}

export function createHttpClient({ tokenKey, userKey, expiredEvent }) {
  async function request(path, options = {}) {
    const token = localStorage.getItem(tokenKey);
    const isFormData = options.body instanceof FormData;

    const res = await fetch(`${BASE}${path}`, {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });

    // El backend distingue 401 de 403: 401 es "no se sabe quien eres", es decir
    // sesion ausente o caducada. Un 401 en el propio login no es eso, es que
    // las credenciales no valen, asi que no se toca la sesion.
    if (res.status === 401 && !path.startsWith('/auth/')) {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      window.dispatchEvent(new CustomEvent(expiredEvent));
      const err = new Error('Sesión expirada. Vuelve a iniciar sesión.');
      err.status = 401;
      throw err;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`API ${res.status} ${path}: ${text}`);
      err.status = res.status;
      // El mensaje del backend sirve para pintar el error en pantalla.
      try {
        err.body = JSON.parse(text);
      } catch {
        err.body = null;
      }
      throw err;
    }

    if (res.status === 204) return null;
    return unwrap(await res.json());
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    postFormData: (path, formData) => request(path, { method: 'POST', body: formData }),
    put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: 'DELETE' }),
  };
}
