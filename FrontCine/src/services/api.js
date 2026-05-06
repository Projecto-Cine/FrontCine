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
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem('lumen_token');
    window.location.href = '/login';
    return;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${path}: ${text}`);
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
