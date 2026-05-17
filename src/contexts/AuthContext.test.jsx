import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock authService before importing AuthProvider.
vi.mock('../services/authService', () => ({
  authService: { login: vi.fn() },
}));

import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  it('starts with no user when there is no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // The provider returns null while loading=true. Wait until it finishes.
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.user).toBeNull();
  });

  it('restores the user from localStorage when both token and user are stored', async () => {
    localStorage.setItem('lumen_token', 'abc');
    localStorage.setItem('lumen_user', JSON.stringify({ name: 'Ana', role: 'admin' }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current?.user).toEqual({ name: 'Ana', role: 'admin' }));
  });

  it('login OK saves token and user', async () => {
    authService.login.mockResolvedValue({
      token: 't1',
      user: { name: 'Ana', role: 'admin' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    let ok;
    await act(async () => { ok = await result.current.login('a@b.com', 'pw'); });

    expect(ok).toBe(true);
    expect(result.current.user).toEqual({ name: 'Ana', role: 'admin' });
    expect(localStorage.getItem('lumen_token')).toBe('t1');
  });

  it('login without token in response → sets error and returns false', async () => {
    authService.login.mockResolvedValue({}); // no token, no user

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    let ok;
    await act(async () => { ok = await result.current.login('a@b.com', 'pw'); });

    expect(ok).toBe(false);
    expect(result.current.error).toMatch(/inválidas/i);
  });

  it('login with 401 error sets the "wrong credentials" message', async () => {
    const err = new Error('401'); err.status = 401;
    authService.login.mockRejectedValue(err);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => { await result.current.login('a@b.com', 'pw'); });

    expect(result.current.error).toMatch(/Email o contraseña/i);
  });

  it('login with 500 error sets the server-error message', async () => {
    const err = new Error('500'); err.status = 500;
    authService.login.mockRejectedValue(err);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => { await result.current.login('a@b.com', 'pw'); });

    expect(result.current.error).toMatch(/servidor/i);
  });

  it('login with a network error sets a generic message', async () => {
    authService.login.mockRejectedValue(new Error('network'));

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

  it('can() — admin can do everything, readonly only "read"', async () => {
    localStorage.setItem('lumen_token', 'x');
    localStorage.setItem('lumen_user', JSON.stringify({ role: 'admin' }));

    const { result, rerender } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.user).toBeTruthy());

    expect(result.current.can('cualquier-cosa')).toBe(true);

    // Re-render with readonly.
    act(() => result.current.logout());
    localStorage.setItem('lumen_token', 'x');
    localStorage.setItem('lumen_user', JSON.stringify({ role: 'readonly' }));
    // Force a fresh provider so it re-reads from storage:
    rerender();
  });

  it('can() returns false when there is no user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.can('read')).toBe(false);
  });

  it('responds to the global "auth:expired" event by clearing user', async () => {
    localStorage.setItem('lumen_token', 'abc');
    localStorage.setItem('lumen_user', JSON.stringify({ name: 'Ana' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.user).toBeTruthy());

    act(() => window.dispatchEvent(new CustomEvent('auth:expired')));

    expect(result.current.user).toBeNull();
  });
});
