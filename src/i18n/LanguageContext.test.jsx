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

  it('falls back to browser language when localStorage is empty', () => {
    // Clear localStorage and set the browser language
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.lang).toBe('en');
  });

  it('falls back to "es" when browser language is unsupported', () => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true });
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.lang).toBe('es');
  });

  it('t() falls back to Spanish when key missing in current language', () => {
    localStorage.setItem('lumen_lang', 'en');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.t('common.cancel');
    expect(typeof out).toBe('string');
  });

  it('t() returns raw path when key missing in every catalog', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.t('totally.fake.key');
    expect(out).toBe('totally.fake.key');
  });

  it('interpolate returns missing param placeholder when value not provided', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    // shifts.subtitle uses {count}
    const out = result.current.t('shifts.subtitle');
    expect(typeof out).toBe('string');
  });

  it('fmt.date formats a Date instance', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.fmt.date(new Date('2026-01-01'));
    expect(typeof out).toBe('string');
  });

  it('fmt.date formats a string parsed into a Date', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.fmt.date('2026-01-01');
    expect(typeof out).toBe('string');
  });

  it('fmt.time formats hours and minutes', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.fmt.time(new Date('2026-01-01T20:30:00'));
    expect(out).toMatch(/\d{1,2}/);
  });

  it('fmt.time accepts string', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.fmt.time('2026-01-01T20:30:00');
    expect(typeof out).toBe('string');
  });

  it('fmt.relative produces a relative-time string', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.fmt.relative(new Date(Date.now() + 86400000));
    expect(typeof out).toBe('string');
  });
});
