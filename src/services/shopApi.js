import { BASE } from './api';

export const SHOP_TOKEN_KEY = 'lumen_shop_token';
export const SHOP_USER_KEY  = 'lumen_shop_user';

async function shopRequest(path, options = {}) {
  const token = localStorage.getItem(SHOP_TOKEN_KEY);
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err  = new Error(`API ${res.status} ${path}: ${text}`);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  const data = await res.json();
  if (data && typeof data === 'object') {
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.data))    return data.data;
    if ('data' in data)              return data.data;
    if ('payload' in data)           return data.payload;
  }
  return data;
}

export const shopApi = {
  get:    (path)       => shopRequest(path),
  post:   (path, body) => shopRequest(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    (path, body) => shopRequest(path, { method: 'PUT',   body: JSON.stringify(body) }),
  delete: (path)       => shopRequest(path, { method: 'DELETE' }),
};
