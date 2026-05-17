import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';

const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

beforeEach(() => {
  localStorage.clear();
  // Real setTimeout is slow — use fake timers to control the toast
  // auto-dismiss timing.
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AppContext', () => {
  it('sidebarCollapsed defaults to false', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.sidebarCollapsed).toBe(false);
  });

  it('toggleSidebar flips the state and persists it', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => result.current.toggleSidebar());
    expect(result.current.sidebarCollapsed).toBe(true);
    expect(localStorage.getItem('lumen_sidebar_collapsed')).toBe('true');

    act(() => result.current.toggleSidebar());
    expect(result.current.sidebarCollapsed).toBe(false);
  });

  it('reads the initial state from localStorage', () => {
    localStorage.setItem('lumen_sidebar_collapsed', 'true');
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.sidebarCollapsed).toBe(true);
  });

  it('toast() adds a toast with an incremental id', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => result.current.toast('Hola', 'success'));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Hola');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('the toast auto-dismisses after the given duration', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => result.current.toast('Bye', 'info', 1000));
    expect(result.current.toasts).toHaveLength(1);

    // Fast-forward the clock by 1 second → the internal setTimeout fires.
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.toasts).toHaveLength(0);
  });

  it('removeToast removes the toast by id', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => result.current.toast('A'));
    const id = result.current.toasts[0].id;
    act(() => result.current.removeToast(id));
    expect(result.current.toasts).toHaveLength(0);
  });
});
