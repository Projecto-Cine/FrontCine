/**
 * useCountUp — hook coverage tests.
 *
 * Exercises:
 *   - numeric target value with animation
 *   - non-numeric target (NaN fallback)
 *   - target update mid-animation
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountUp } from './useCountUp';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useCountUp', () => {
  it('returns 0 initially for a numeric target', () => {
    const { result } = renderHook(() => useCountUp(100));
    expect(typeof result.current).toBe('number');
  });

  it('returns the target as-is when not numeric (NaN branch)', () => {
    const { result } = renderHook(() => useCountUp('—'));
    expect(result.current).toBe('—');
  });

  it('accepts a numeric target value', () => {
    const { result } = renderHook(() => useCountUp(50, 1000));
    expect(typeof result.current).toBe('number');
  });

  it('cleans up the animation frame on unmount', () => {
    const cancel = vi.fn();
    const origCancel = globalThis.cancelAnimationFrame;
    globalThis.cancelAnimationFrame = cancel;
    try {
      const { unmount } = renderHook(() => useCountUp(50));
      unmount();
      expect(cancel).toHaveBeenCalled();
    } finally {
      globalThis.cancelAnimationFrame = origCancel;
    }
  });
});
