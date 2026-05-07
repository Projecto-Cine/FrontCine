import { mockRequest } from './mockStore.js';

export const BASE = import.meta.env.VITE_API_URL ?? '/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

function unwrap(data) {
  if (data && typeof data === 'object') {
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.data)) return data.data;
    if ('data' in data) return data.data;
    if ('payload' in data) return data.payload;
  }
  return data;
}

async function request(path, options = {}) {
  if (USE_MOCK) return mockRequest(path, options);

  const token = localStorage.getItem('lumen_token');
  const isFormData = options.body instanceof FormData;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });
  } catch (networkError) {
    const err = new Error('Sin conexión con el servidor. Comprueba tu red o que el backend esté activo.');
    err.status = 0;
    err.technical = networkError.message;
    throw err;
  }

  if (res.status === 401) {
    if (!path.includes('/auth/login')) {
      const storedToken = localStorage.getItem('lumen_token') ?? '';
      const isMock = storedToken.startsWith('mock-token-');
      // Solo forzar logout si es un endpoint de verificación de sesión (/auth/me, /auth/refresh)
      // Para endpoints de negocio (purchases, sales…) el componente maneja el error con fallback local
      const isSessionCheck = !isMock && (path.includes('/auth/me') || path.includes('/auth/refresh'));
      if (isSessionCheck) {
        localStorage.removeItem('lumen_token');
        window.dispatchEvent(new CustomEvent('lumen:auth-expired'));
      }
      const err = new Error('Sesión expirada. Vuelve a iniciar sesión.');
      err.status = 401;
      throw err;
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let serverMessage = '';
    try {
      const json = JSON.parse(text);
      serverMessage = json.message ?? json.error ?? json.detail ?? '';
    } catch { /* respuesta no es JSON */ }

    const friendlyMessages = {
      400: serverMessage || 'Los datos enviados no son válidos.',
      403: 'No tienes permiso para realizar esta acción.',
      404: 'El recurso solicitado no existe.',
      405: 'Operación no permitida.',
      409: serverMessage || 'Ya existe un registro con esos datos.',
      422: serverMessage || 'Los datos no pasaron la validación del servidor.',
      500: 'Error interno del servidor. Inténtalo de nuevo.',
      502: 'El servidor no está disponible (502). Comprueba que el backend esté arrancado.',
      503: 'Servicio temporalmente no disponible. Inténtalo más tarde.',
      504: 'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
    };

    const message = friendlyMessages[res.status] ?? `Error inesperado (${res.status}).`;
    const err = new Error(message);
    err.status = res.status;
    err.technical = `${res.status} ${path}: ${text}`;
    throw err;
  }

  if (res.status === 204) return null;
  return unwrap(await res.json());
}

export const api = {
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  postFormData: (path, formData) => request(path, { method: 'POST', body: formData }),
  put:    (path, body) => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: 'DELETE' }),
};
