import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    employeeLogin: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem('_auth_init', '1');
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  it('starts with no user when there is no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.user).toBeNull();
  });

  it('restores the user from localStorage when both token and user are stored', async () => {
    localStorage.setItem('lumen_token', 'abc');
    localStorage.setItem('lumen_user', JSON.stringify({ name: 'Ana', role: 'admin' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.user).not.toBeNull());
    expect(result.current.user).toEqual({ name: 'Ana', role: 'admin' });
  });

  it('clears a broken saved user payload', async () => {
    localStorage.setItem('lumen_token', 'abc');
    localStorage.setItem('lumen_user', '{bad-json');

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('lumen_token')).toBeNull();
    expect(localStorage.getItem('lumen_user')).toBeNull();
  });

  it('clears an orphan token when there is no saved user', async () => {
    localStorage.setItem('lumen_token', 'abc');

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(localStorage.getItem('lumen_token')).toBeNull();
  });

  it('login OK saves token and user and returns redirect path', async () => {
    authService.login.mockResolvedValue({
      token: 't1',
      user: { name: 'Ana', role: 'admin' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    let redirect;
    await act(async () => { redirect = await result.current.login('a@b.com', 'pw'); });

    expect(redirect).toBe('/');
    expect(result.current.user).toEqual({ name: 'Ana', role: 'admin' });
    expect(localStorage.getItem('lumen_token')).toBe('t1');
  });

  it('login without token in response sets error and returns null', async () => {
    authService.login.mockResolvedValue({});
    authService.employeeLogin.mockResolvedValue({});

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    let redirect;
    await act(async () => { redirect = await result.current.login('a@b.com', 'pw'); });

    expect(redirect).toBeNull();
    expect(result.current.error).toMatch(/inválidas/i);
  });

  it('login with 401 error sets the wrong credentials message', async () => {
    const err = new Error('401'); err.status = 401;
    authService.login.mockRejectedValue(err);
    authService.employeeLogin.mockRejectedValue(err);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => { await result.current.login('a@b.com', 'pw'); });

    expect(result.current.error).toMatch(/Email o contraseña/i);
  });

  it('login with 500 error sets the server error message', async () => {
    const err = new Error('500'); err.status = 500;
    authService.login.mockRejectedValue(err);
    authService.employeeLogin.mockRejectedValue(err);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => { await result.current.login('a@b.com', 'pw'); });

    expect(result.current.error).toMatch(/servidor/i);
  });

  it('login with a network error sets a generic message', async () => {
    authService.login.mockRejectedValue(new Error('network'));
    authService.employeeLogin.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => { await result.current.login('a@b.com', 'pw'); });

    expect(result.current.error).toMatch(/conectar/i);
  });

  it('logout clears user and localStorage', async () => {
    localStorage.setItem('lumen_token', 'abc');
    localStorage.setItem('lumen_user', JSON.stringify({ name: 'Ana' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.user).toBeTruthy());

    act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('lumen_token')).toBeNull();
  });

  it('hasRole returns true for matching role', async () => {
    localStorage.setItem('lumen_token', 'x');
    localStorage.setItem('lumen_user', JSON.stringify({ role: 'GERENCIA' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.user).toBeTruthy());

    expect(result.current.hasRole('GERENCIA')).toBe(true);
    expect(result.current.hasRole('CAJERO')).toBe(false);
  });

  it('hasRole returns false when there is no user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.hasRole('admin')).toBe(false);
  });

  it('responds to the auth expired event by clearing user', async () => {
    localStorage.setItem('lumen_token', 'abc');
    localStorage.setItem('lumen_user', JSON.stringify({ name: 'Ana' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.user).toBeTruthy());

    act(() => window.dispatchEvent(new CustomEvent('auth:expired')));

    expect(result.current.user).toBeNull();
  });
});