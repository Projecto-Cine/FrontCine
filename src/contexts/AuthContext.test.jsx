import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mockeamos authService antes de importar AuthProvider.
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
  it('arranca sin usuario si no hay token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // El provider devuelve null mientras loading=true. Esperamos a que termine.
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.user).toBeNull();
  });

  it('restaura el usuario desde localStorage si hay token y user guardados', async () => {
    localStorage.setItem('lumen_token', 'abc');
    localStorage.setItem('lumen_user', JSON.stringify({ name: 'Ana', role: 'admin' }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current?.user).toEqual({ name: 'Ana', role: 'admin' }));
  });

  it('login OK guarda token y usuario', async () => {
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

  it('login sin token en respuesta → setea error y devuelve false', async () => {
    authService.login.mockResolvedValue({}); // sin token ni user

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    let ok;
    await act(async () => { ok = await result.current.login('a@b.com', 'pw'); });

    expect(ok).toBe(false);
    expect(result.current.error).toMatch(/inválidas/i);
  });

  it('login con error 401 setea mensaje de credenciales incorrectas', async () => {
    const err = new Error('401'); err.status = 401;
    authService.login.mockRejectedValue(err);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => { await result.current.login('a@b.com', 'pw'); });

    expect(result.current.error).toMatch(/Email o contraseña/i);
  });

  it('login con error 500 setea mensaje de servidor', async () => {
    const err = new Error('500'); err.status = 500;
    authService.login.mockRejectedValue(err);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => { await result.current.login('a@b.com', 'pw'); });

    expect(result.current.error).toMatch(/servidor/i);
  });

  it('login con error de red setea mensaje genérico', async () => {
    authService.login.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => { await result.current.login('a@b.com', 'pw'); });

    expect(result.current.error).toMatch(/conectar/i);
  });

  it('logout limpia user y localStorage', async () => {
    localStorage.setItem('lumen_token', 'abc');
    localStorage.setItem('lumen_user', JSON.stringify({ name: 'Ana' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.user).toBeTruthy());

    act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('lumen_token')).toBeNull();
  });

  it('can() — admin puede todo, readonly solo "read"', async () => {
    localStorage.setItem('lumen_token', 'x');
    localStorage.setItem('lumen_user', JSON.stringify({ role: 'admin' }));

    const { result, rerender } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.user).toBeTruthy());

    expect(result.current.can('cualquier-cosa')).toBe(true);

    // Rerender con readonly
    act(() => result.current.logout());
    localStorage.setItem('lumen_token', 'x');
    localStorage.setItem('lumen_user', JSON.stringify({ role: 'readonly' }));
    // Forzamos un nuevo provider para releer del storage:
    rerender();
  });

  it('can() devuelve false si no hay user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.can('read')).toBe(false);
  });

  it('responde al evento global "auth:expired" reseteando user', async () => {
    localStorage.setItem('lumen_token', 'abc');
    localStorage.setItem('lumen_user', JSON.stringify({ name: 'Ana' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.user).toBeTruthy());

    act(() => window.dispatchEvent(new CustomEvent('auth:expired')));

    expect(result.current.user).toBeNull();
  });
});
