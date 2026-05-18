/**
 * AuthContext — exhaustive coverage:
 *   - login() success paths (employee, admin)
 *   - login() 401/500/network fallbacks
 *   - logout() clears storage
 *   - hasRole / canAccess permissions
 *   - session restore from localStorage on mount
 *   - auth:expired event clears the user
 *
 * Code in English; UI text stays in Spanish.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';

const employeeLoginMock = vi.fn();
const loginApiMock      = vi.fn();

vi.mock('../services/authService', () => ({
  authService: {
    employeeLogin: (...a) => employeeLoginMock(...a),
    login:         (...a) => loginApiMock(...a),
  },
}));

import { AuthProvider, useAuth } from './AuthContext';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

function TestConsumer({ onReady }) {
  const auth = useAuth();
  React.useEffect(() => { onReady?.(auth); }, [auth, onReady]);
  return (
    <div>
      <span data-testid="user-name">{auth.user?.name ?? 'no-user'}</span>
      <span data-testid="error">{auth.error}</span>
      <button data-testid="logout" onClick={auth.logout}>Logout</button>
    </div>
  );
}

function renderProvider(onReady) {
  return render(
    <AuthProvider>
      <TestConsumer onReady={onReady} />
    </AuthProvider>
  );
}

describe('AuthContext — full coverage', () => {
  it('starts with no user when storage is empty', async () => {
    // Simulate non-DEV path or already-initialised flag
    sessionStorage.setItem('_auth_init', '1');
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(auth).toBeTruthy());
    expect(screen.getByTestId('user-name').textContent).toBe('no-user');
  });

  it('restores a saved user from localStorage', async () => {
    sessionStorage.setItem('_auth_init', '1');
    localStorage.setItem('lumen_token', 't-1');
    localStorage.setItem('lumen_user', JSON.stringify({ id: 1, name: 'Ana', role: 'GERENCIA' }));
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('Ana'));
    expect(auth.canAccess('/anything')).toBe(true); // GERENCIA = *
  });

  it('clears storage when saved user JSON is corrupt', async () => {
    sessionStorage.setItem('_auth_init', '1');
    localStorage.setItem('lumen_token', 't-1');
    localStorage.setItem('lumen_user', '{not-json');
    renderProvider();
    await waitFor(() => expect(localStorage.getItem('lumen_token')).toBeNull());
  });

  it('clears token if it exists without a saved user', async () => {
    sessionStorage.setItem('_auth_init', '1');
    localStorage.setItem('lumen_token', 't-1');
    renderProvider();
    await waitFor(() => expect(localStorage.getItem('lumen_token')).toBeNull());
  });

  it('login() success via employee endpoint sets user and returns redirect', async () => {
    sessionStorage.setItem('_auth_init', '1');
    employeeLoginMock.mockResolvedValueOnce({ token: 'tok', user: { id: 1, name: 'Cajero', role: 'CAJERO' } });
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(auth).toBeTruthy());

    let redirect;
    await act(async () => {
      redirect = await auth.login('a@b.com', 'pw', { employeeOnly: true });
    });
    expect(redirect).toBe('/box-office');
    expect(localStorage.getItem('lumen_token')).toBe('tok');
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('Cajero'));
  });

  it('login() falls back to /auth/login when employee endpoint returns non-employee role', async () => {
    sessionStorage.setItem('_auth_init', '1');
    employeeLoginMock.mockResolvedValueOnce({ token: 'tok', user: { id: 2, name: 'Client', role: 'CLIENTE' } });
    loginApiMock.mockResolvedValueOnce({ token: 'tok2', user: { id: 2, name: 'Client', role: 'CLIENTE' } });
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(auth).toBeTruthy());

    let redirect;
    await act(async () => { redirect = await auth.login('a@b.com', 'pw'); });
    expect(redirect).toBe('/');
    expect(loginApiMock).toHaveBeenCalled();
  });

  it('login() falls back to /auth/login when employee endpoint throws 401', async () => {
    sessionStorage.setItem('_auth_init', '1');
    employeeLoginMock.mockRejectedValueOnce({ status: 401 });
    loginApiMock.mockResolvedValueOnce({ token: 'tok2', user: { id: 3, name: 'Admin', role: 'admin' } });
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(auth).toBeTruthy());

    let redirect;
    await act(async () => { redirect = await auth.login('a@b.com', 'pw'); });
    expect(redirect).toBe('/');
  });

  it('login() rethrows non-401 errors from the employee endpoint', async () => {
    sessionStorage.setItem('_auth_init', '1');
    employeeLoginMock.mockRejectedValueOnce({ status: 500 });
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(auth).toBeTruthy());

    let result;
    await act(async () => { result = await auth.login('a@b.com', 'pw'); });
    expect(result).toBeNull();
    await waitFor(() => expect(screen.getByTestId('error').textContent).toContain('servidor'));
  });

  it('login() sets "credenciales inválidas" when API returns empty payload', async () => {
    sessionStorage.setItem('_auth_init', '1');
    employeeLoginMock.mockResolvedValueOnce({});
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(auth).toBeTruthy());

    let result;
    await act(async () => { result = await auth.login('a@b.com', 'pw', { employeeOnly: true }); });
    expect(result).toBeNull();
    await waitFor(() => expect(screen.getByTestId('error').textContent).toContain('inválidas'));
  });

  it('login() sets 401 error message', async () => {
    sessionStorage.setItem('_auth_init', '1');
    employeeLoginMock.mockRejectedValueOnce({ status: 401 });
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(auth).toBeTruthy());

    await act(async () => { await auth.login('a@b.com', 'pw', { employeeOnly: true }); });
    await waitFor(() => expect(screen.getByTestId('error').textContent).toContain('Email'));
  });

  it('login() sets network error message when no status', async () => {
    sessionStorage.setItem('_auth_init', '1');
    employeeLoginMock.mockRejectedValueOnce(new Error('Failed to fetch'));
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(auth).toBeTruthy());

    await act(async () => { await auth.login('a@b.com', 'pw', { employeeOnly: true }); });
    await waitFor(() => expect(screen.getByTestId('error').textContent).toContain('conectar'));
  });

  it('logout() clears the user and storage', async () => {
    sessionStorage.setItem('_auth_init', '1');
    localStorage.setItem('lumen_token', 't-1');
    localStorage.setItem('lumen_user', JSON.stringify({ id: 1, name: 'Ana', role: 'GERENCIA' }));
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('Ana'));

    act(() => auth.logout());
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('no-user'));
    expect(localStorage.getItem('lumen_token')).toBeNull();
  });

  it('auth:expired event resets the user', async () => {
    sessionStorage.setItem('_auth_init', '1');
    localStorage.setItem('lumen_token', 't-1');
    localStorage.setItem('lumen_user', JSON.stringify({ id: 1, name: 'Ana', role: 'GERENCIA' }));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('Ana'));

    act(() => { window.dispatchEvent(new Event('auth:expired')); });
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('no-user'));
  });

  it('hasRole returns false when no user', async () => {
    sessionStorage.setItem('_auth_init', '1');
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(auth).toBeTruthy());
    expect(auth.hasRole('admin')).toBe(false);
  });

  it('hasRole returns true for matching roles', async () => {
    sessionStorage.setItem('_auth_init', '1');
    localStorage.setItem('lumen_token', 't-1');
    localStorage.setItem('lumen_user', JSON.stringify({ id: 1, name: 'A', role: 'GERENCIA' }));
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('A'));
    expect(auth.hasRole('GERENCIA', 'CAJERO')).toBe(true);
    expect(auth.hasRole('LIMPIEZA')).toBe(false);
  });

  it('canAccess restricts CAJERO routes', async () => {
    sessionStorage.setItem('_auth_init', '1');
    localStorage.setItem('lumen_token', 't-1');
    localStorage.setItem('lumen_user', JSON.stringify({ id: 1, name: 'C', role: 'CAJERO' }));
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('C'));
    expect(auth.canAccess('/box-office')).toBe(true);
    expect(auth.canAccess('/movies')).toBe(false);
  });

  it('canAccess returns false when no user', async () => {
    sessionStorage.setItem('_auth_init', '1');
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(auth).toBeTruthy());
    expect(auth.canAccess('/')).toBe(false);
  });

  it('canAccess returns true for non-employee roles', async () => {
    sessionStorage.setItem('_auth_init', '1');
    localStorage.setItem('lumen_token', 't-1');
    localStorage.setItem('lumen_user', JSON.stringify({ id: 1, name: 'X', role: 'admin' }));
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('X'));
    expect(auth.canAccess('/anywhere')).toBe(true);
  });

  it('canAccess returns true for LIMPIEZA on /shifts', async () => {
    sessionStorage.setItem('_auth_init', '1');
    localStorage.setItem('lumen_token', 't-1');
    localStorage.setItem('lumen_user', JSON.stringify({ id: 1, name: 'L', role: 'LIMPIEZA' }));
    let auth;
    renderProvider((a) => { auth = a; });
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('L'));
    expect(auth.canAccess('/shifts')).toBe(true);
    expect(auth.canAccess('/inventory')).toBe(false);
  });

  it('cleans storage on first dev-mode mount (no _auth_init flag)', async () => {
    // import.meta.env.DEV is true in vitest by default → the dev-clean branch runs
    sessionStorage.removeItem('_auth_init');
    localStorage.setItem('lumen_token', 'stale-token');
    localStorage.setItem('lumen_user', JSON.stringify({ id: 99, name: 'Stale', role: 'admin' }));

    renderProvider();
    await waitFor(() => expect(sessionStorage.getItem('_auth_init')).toBe('1'));
    expect(localStorage.getItem('lumen_token')).toBeNull();
    expect(localStorage.getItem('lumen_user')).toBeNull();
  });
});
