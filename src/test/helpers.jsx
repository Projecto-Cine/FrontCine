// Reusable helpers for the page smoke tests.
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

/**
 * Renders a page inside the providers it needs.
 * AuthProvider is intentionally not included to avoid loops with
 * localStorage — tests that need useAuth mock it directly.
 */
export function renderPage(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageProvider>
        <AppProvider>
          {ui}
        </AppProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}
