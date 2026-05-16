import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';

const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

beforeEach(() => {
  localStorage.clear();
  // setTimeout real es lento — usamos timers falsos para controlar el tiempo
  // del auto-dismiss de los toasts.
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AppContext', () => {
  it('sidebarCollapsed empieza en false por defecto', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.sidebarCollapsed).toBe(false);
  });

  it('toggleSidebar invierte el estado y lo persiste', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => result.current.toggleSidebar());
    expect(result.current.sidebarCollapsed).toBe(true);
    expect(localStorage.getItem('lumen_sidebar_collapsed')).toBe('true');

    act(() => result.current.toggleSidebar());
    expect(result.current.sidebarCollapsed).toBe(false);
  });

  it('lee el estado inicial desde localStorage', () => {
    localStorage.setItem('lumen_sidebar_collapsed', 'true');
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.sidebarCollapsed).toBe(true);
  });

  it('toast() añade un toast con id incremental', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => result.current.toast('Hola', 'success'));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Hola');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('el toast se elimina solo tras la duración indicada', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => result.current.toast('Bye', 'info', 1000));
    expect(result.current.toasts).toHaveLength(1);

    // Avanzamos el "reloj" 1 segundo → el setTimeout interno se dispara.
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.toasts).toHaveLength(0);
  });

  it('removeToast quita el toast por id', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => result.current.toast('A'));
    const id = result.current.toasts[0].id;
    act(() => result.current.removeToast(id));
    expect(result.current.toasts).toHaveLength(0);
  });
});
