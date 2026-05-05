const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem('lumen_user');
    window.location.href = '/login';
    return;
  }

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message ?? `API ${res.status} ${path}`);
  }

  if (res.status === 204) return null;
  const json = await res.json();
  return ('success' in json) ? json.data : json;
}

async function uploadFile(path, file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: fd });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message ?? `API ${res.status} ${path}`);
  }
  const json = await res.json();
  return ('success' in json) ? json.data : json;
}

export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    (path, body)  => request(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch:  (path, body)  => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: 'DELETE' }),
  upload: (path, file)  => uploadFile(path, file),
};
