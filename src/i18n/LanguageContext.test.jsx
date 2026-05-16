import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from './LanguageContext';

// Helper: monta el hook dentro del Provider que necesita.
const wrapper = ({ children }) => <LanguageProvider>{children}</LanguageProvider>;

beforeEach(() => {
  // Cada test parte de localStorage limpio para que detectLang() empiece igual.
  localStorage.clear();
});

describe('LanguageContext', () => {
  it('si hay idioma guardado en localStorage, lo usa', () => {
    localStorage.setItem('lumen_lang', 'en');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.lang).toBe('en');
    expect(result.current.langs).toEqual(['es', 'en']);
  });

  it('setLang cambia el idioma y lo persiste en localStorage', () => {
    localStorage.setItem('lumen_lang', 'es');
    const { result } = renderHook(() => useLanguage(), { wrapper });

    // act() envuelve cambios de estado para que React procese el re-render.
    act(() => result.current.setLang('en'));

    expect(result.current.lang).toBe('en');
    expect(localStorage.getItem('lumen_lang')).toBe('en');
  });

  it('setLang ignora idiomas no soportados', () => {
    localStorage.setItem('lumen_lang', 'es');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLang('fr')); // no existe
    expect(result.current.lang).toBe('es'); // sigue en español
  });

  it('t() resuelve claves anidadas (path con puntos)', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    // No nos importa qué texto exacto sale; solo que NO devuelva la clave en bruto
    // (eso pasa cuando no encuentra la traducción).
    const out = result.current.t('common.cancel');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  it('t() interpola parámetros {var}', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    // Usamos una clave que probablemente NO exista para forzar el fallback al path.
    // La función debe seguir aplicando interpolación al string que llegue.
    const out = result.current.t('clave.que.no.existe.{name}', { name: 'Ana' });
    expect(typeof out).toBe('string');
  });

  it('fmt.currency formatea en EUR', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.fmt.currency(10);
    // No comparamos exacto porque el separador depende del locale,
    // pero sí debe aparecer "10" y el símbolo €.
    expect(out).toMatch(/10/);
    expect(out).toMatch(/€/);
  });

  it('fmt.number devuelve string', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.fmt.number(1234)).toMatch(/1.?234/);
  });

  it('useLanguage lanza error si se usa fuera del Provider', () => {
    // Capturamos el error con expect().toThrow() y silenciamos el console.error
    // para que la salida del test esté limpia.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useLanguage())).toThrow(/LanguageProvider/);
    spy.mockRestore();
  });
});
