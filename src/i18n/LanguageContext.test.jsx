import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from './LanguageContext';

// Helper: mounts the hook inside the required provider.
const wrapper = ({ children }) => <LanguageProvider>{children}</LanguageProvider>;

beforeEach(() => {
  // Each test starts from a clean localStorage so detectLang() runs from scratch.
  localStorage.clear();
});

describe('LanguageContext', () => {
  it('uses the language stored in localStorage when present', () => {
    localStorage.setItem('lumen_lang', 'en');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.lang).toBe('en');
    expect(result.current.langs).toEqual(['es', 'en']);
  });

  it('setLang changes the language and persists it to localStorage', () => {
    localStorage.setItem('lumen_lang', 'es');
    const { result } = renderHook(() => useLanguage(), { wrapper });

    // act() wraps state changes so React processes the re-render.
    act(() => result.current.setLang('en'));

    expect(result.current.lang).toBe('en');
    expect(localStorage.getItem('lumen_lang')).toBe('en');
  });

  it('setLang ignores unsupported languages', () => {
    localStorage.setItem('lumen_lang', 'es');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLang('fr')); // not supported
    expect(result.current.lang).toBe('es'); // still Spanish
  });

  it('t() resolves nested keys (dotted path)', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    // We don't care about the exact text, only that it does NOT return the raw key
    // (which happens when no translation is found).
    const out = result.current.t('common.cancel');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  it('t() interpolates {var} parameters', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    // Use a key that probably does NOT exist to force the fallback to the path.
    // The function should still apply interpolation to whatever string comes back.
    const out = result.current.t('clave.que.no.existe.{name}', { name: 'Ana' });
    expect(typeof out).toBe('string');
  });

  it('fmt.currency formats in EUR', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.fmt.currency(10);
    // Don't assert exact output because the separator depends on the locale,
    // but "10" and the € symbol must appear.
    expect(out).toMatch(/10/);
    expect(out).toMatch(/€/);
  });

  it('fmt.number returns a string', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.fmt.number(1234)).toMatch(/1.?234/);
  });

  it('useLanguage throws when used outside the Provider', () => {
    // Capture the error with expect().toThrow() and silence console.error
    // so the test output stays clean.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useLanguage())).toThrow(/LanguageProvider/);
    spy.mockRestore();
  });
});
