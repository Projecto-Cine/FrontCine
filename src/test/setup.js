// Runs once before all tests.
// 1) Import jest-dom for matchers such as .toBeInTheDocument(), .toBeDisabled(), etc.
import '@testing-library/jest-dom';

// 2) Force Spanish as the default locale for every test. The app's
//    LanguageProvider falls back to navigator.language (which is en-* in
//    jsdom), so without this every UI string would render in English and
//    tests asserting against Spanish text would fail to find them.
//
//    Override navigator.language so the fallback path itself returns 'es'
//    — beforeEach hooks that clear localStorage still get the right value.
try {
  Object.defineProperty(window.navigator, 'language', { value: 'es-ES', configurable: true });
} catch { /* ignore */ }
try {
  localStorage.setItem('lumen_lang', 'es');
} catch { /* ignore */ }
