import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './api';

// Helper to fabricate a fake browser fetch response.
// Vitest does not ship a real fetch, so we spy on it via vi.spyOn.
function mockFetchResponse({ status = 200, body = {}, ok = true } = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

describe('api (HTTP transport layer)', () => {
  let fetchSpy;

  beforeEach(() => {
    // Each test starts with a clean fetch.
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    // And clean localStorage (jsdom provides it).
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET adds the /api prefix by default', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({ body: { ok: true } }));

    await api.get('/movies');

    // The first argument of fetch must include the URL with the prefix.
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/movies');
  });

  it('POST sends the body as JSON with a Content-Type header', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({ body: { id: 1 } }));

    await api.post('/movies', { title: 'Dune' });

    const [, opts] = fetchSpy.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.body).toBe(JSON.stringify({ title: 'Dune' }));
    expect(opts.headers['Content-Type']).toBe('application/json');
  });

  it('adds Authorization when a token is in localStorage', async () => {
    localStorage.setItem('lumen_token', 'abc123');
    fetchSpy.mockResolvedValue(mockFetchResponse());

    await api.get('/movies');

    const [, opts] = fetchSpy.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer abc123');
  });

  it('PUT uses the PUT method and JSON body', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse());
    await api.put('/movies/1', { title: 'X' });
    expect(fetchSpy.mock.calls[0][1].method).toBe('PUT');
  });

  it('PATCH uses the PATCH method', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse());
    await api.patch('/movies/1', { title: 'X' });
    expect(fetchSpy.mock.calls[0][1].method).toBe('PATCH');
  });

  it('DELETE uses the DELETE method', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse());
    await api.delete('/movies/1');
    expect(fetchSpy.mock.calls[0][1].method).toBe('DELETE');
  });

  it('postFormData does NOT add Content-Type (the browser sets it with the boundary)', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse());
    const fd = new FormData();
    fd.append('file', new Blob(['x']));

    await api.postFormData('/upload', fd);

    const [, opts] = fetchSpy.mock.calls[0];
    expect(opts.headers['Content-Type']).toBeUndefined();
    expect(opts.body).toBe(fd);
  });

  it('"unwraps" data.content when the backend returns a paginated payload', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({
      body: { content: [{ id: 1 }, { id: 2 }] },
    }));

    const result = await api.get('/movies');
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('"unwraps" data.data', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({
      body: { data: [{ id: 1 }] },
    }));

    const result = await api.get('/movies');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('returns null when the response is 204 No Content', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({ status: 204 }));
    const result = await api.delete('/movies/1');
    expect(result).toBeNull();
  });

  it('throws an Error with .status when the response is not ok', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({ status: 500, ok: false }));

    // Verify the promise REJECTS (.rejects) and the error carries the status.
    await expect(api.get('/movies')).rejects.toMatchObject({ status: 500 });
  });

  it('on 401 clears localStorage and dispatches the auth:expired event', async () => {
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

  it('on 401 against /auth/login it does NOT clear or emit the event (it is a failed login)', async () => {
    localStorage.setItem('lumen_token', 'abc');
    fetchSpy.mockResolvedValue(mockFetchResponse({ status: 401, ok: false }));

    const listener = vi.fn();
    window.addEventListener('auth:expired', listener);

    // Failed login: it rejects, but must NOT clear localStorage or emit the event.
    await expect(api.post('/auth/login', {})).rejects.toBeTruthy();
    expect(localStorage.getItem('lumen_token')).toBe('abc');
    expect(listener).not.toHaveBeenCalled();

    window.removeEventListener('auth:expired', listener);
  });
});
