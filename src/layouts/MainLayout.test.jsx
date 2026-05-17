/**
 * Smoke test for MainLayout: mounts the full layout with a fake Outlet.
 * This covers the keyboard handlers (Ctrl+K, Ctrl+B, Alt+1..9).
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
  it('mounts and reacts to keyboard shortcuts', async () => {
    // Stub scrollIntoView because CommandPalette invokes it on open.
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

    // Fire shortcuts to exercise the global handler.
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
    fireEvent.keyDown(document, { key: '1', altKey: true });
    fireEvent.keyDown(document, { key: '5', altKey: true });
    // Irrelevant key: covers the "no-op" branch.
    fireEvent.keyDown(document, { key: 'z' });
  });
});
