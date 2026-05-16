// Helpers reutilizables para los smoke tests de páginas.
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

/**
 * Renderiza una página dentro de los providers que necesita.
 * No incluimos AuthProvider para evitar bucles con localStorage —
 * los tests que necesiten useAuth lo mockean directamente.
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
