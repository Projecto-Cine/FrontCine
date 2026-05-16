/**
 * Smoke test de MainLayout: monta el layout completo con un Outlet fake.
 * Esto cubre los handlers de teclado (Ctrl+K, Ctrl+B, Alt+1..9).
 */
import { describe, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test', role: 'admin' }, logout: vi.fn() }),
}));

describe('MainLayout', () => {
  it('se monta y reacciona a atajos de teclado', async () => {
    // Necesitamos mockear scrollIntoView porque CommandPalette lo invoca al abrir.
    Element.prototype.scrollIntoView = vi.fn();

    const { default: MainLayout } = await import('./MainLayout');

    render(
      <MemoryRouter initialEntries={['/']}>
        <LanguageProvider>
          <AppProvider>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<div>Página fake</div>} />
              </Route>
            </Routes>
          </AppProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    // Disparamos atajos para ejercitar el handler global.
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
    fireEvent.keyDown(document, { key: '1', altKey: true });
    fireEvent.keyDown(document, { key: '5', altKey: true });
    // Tecla irrelevante: cubre la rama "no hace nada".
    fireEvent.keyDown(document, { key: 'z' });
  });
});
