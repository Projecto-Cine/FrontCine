import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './api';

// Helper para fabricar una respuesta fake del navegador (fetch).
// Vitest no trae fetch real, así que lo "espiamos" entero con vi.spyOn.
function mockFetchResponse({ status = 200, body = {}, ok = true } = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

describe('api (capa de transporte HTTP)', () => {
  let fetchSpy;

  beforeEach(() => {
    // Cada test parte de un fetch limpio
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    // Y de un localStorage limpio (jsdom lo trae)
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET añade el prefijo /api por defecto', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({ body: { ok: true } }));

    await api.get('/movies');

    // El primer argumento del fetch debe contener la URL con el prefijo.
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/movies');
  });

  it('POST envía el body como JSON con header Content-Type', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({ body: { id: 1 } }));

    await api.post('/movies', { title: 'Dune' });

    const [, opts] = fetchSpy.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.body).toBe(JSON.stringify({ title: 'Dune' }));
    expect(opts.headers['Content-Type']).toBe('application/json');
  });

  it('añade Authorization si hay token en localStorage', async () => {
    localStorage.setItem('lumen_token', 'abc123');
    fetchSpy.mockResolvedValue(mockFetchResponse());

    await api.get('/movies');

    const [, opts] = fetchSpy.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer abc123');
  });

  it('PUT envía método PUT y body JSON', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse());
    await api.put('/movies/1', { title: 'X' });
    expect(fetchSpy.mock.calls[0][1].method).toBe('PUT');
  });

  it('PATCH envía método PATCH', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse());
    await api.patch('/movies/1', { title: 'X' });
    expect(fetchSpy.mock.calls[0][1].method).toBe('PATCH');
  });

  it('DELETE envía método DELETE', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse());
    await api.delete('/movies/1');
    expect(fetchSpy.mock.calls[0][1].method).toBe('DELETE');
  });

  it('postFormData NO añade Content-Type (lo pone el navegador con boundary)', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse());
    const fd = new FormData();
    fd.append('file', new Blob(['x']));

    await api.postFormData('/upload', fd);

    const [, opts] = fetchSpy.mock.calls[0];
    expect(opts.headers['Content-Type']).toBeUndefined();
    expect(opts.body).toBe(fd);
  });

  it('"desenvuelve" data.content si el backend lo devuelve paginado', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({
      body: { content: [{ id: 1 }, { id: 2 }] },
    }));

    const result = await api.get('/movies');
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('"desenvuelve" data.data', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({
      body: { data: [{ id: 1 }] },
    }));

    const result = await api.get('/movies');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('devuelve null cuando la respuesta es 204 No Content', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({ status: 204 }));
    const result = await api.delete('/movies/1');
    expect(result).toBeNull();
  });

  it('lanza un Error con .status si la respuesta no es ok', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({ status: 500, ok: false }));

    // Comprobamos que la promesa REchaza (.rejects) y que el error trae el status.
    await expect(api.get('/movies')).rejects.toMatchObject({ status: 500 });
  });

  it('en 401 limpia el localStorage y dispara el evento auth:expired', async () => {
    localStorage.setItem('lumen_token', 'abc');
    localStorage.setItem('lumen_user', '{}');
    fetchSpy.mockResolvedValue(mockFetchResponse({ status: 401, ok: false }));

    const listener = vi.fn();
    window.addEventListener('auth:expired', listener);

    await expect(api.get('/movies')).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem('lumen_token')).toBeNull();
    expect(listener).toHaveBeenCalled();

    window.removeEventListener('auth:expired', listener);
  });

  it('en 401 sobre /auth/login NO limpia ni dispara evento (es un login fallido)', async () => {
    localStorage.setItem('lumen_token', 'abc');
    fetchSpy.mockResolvedValue(mockFetchResponse({ status: 401, ok: false }));

    const listener = vi.fn();
    window.addEventListener('auth:expired', listener);

    // Login fallido: rechaza, pero NO debe limpiar localStorage ni emitir evento.
    await expect(api.post('/auth/login', {})).rejects.toBeTruthy();
    expect(localStorage.getItem('lumen_token')).toBe('abc');
    expect(listener).not.toHaveBeenCalled();

    window.removeEventListener('auth:expired', listener);
  });
});
