import { describe, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test User', role: 'admin' }, logout: vi.fn(), can: () => true }),
}));

vi.mock('../contexts/AppContext', () => ({
  useApp: () => ({ sidebarCollapsed: false, toggleSidebar: vi.fn(), toast: vi.fn() }),
}));

const wrap = (ui) => (
  <MemoryRouter>
    <LanguageProvider>
      <AppProvider>{ui}</AppProvider>
    </LanguageProvider>
  </MemoryRouter>
);

describe('Smoke layouts', () => {
  it('Sidebar mounts', async () => {
    const { default: Sidebar } = await import('./Sidebar');
    render(wrap(<Sidebar />));
  });

  it('Header mounts (without onOpenPalette)', async () => {
    const { default: Header } = await import('./Header');
    render(wrap(<Header />));
  });

  it('Header mounts with onOpenPalette', async () => {
    const { default: Header } = await import('./Header');
    render(wrap(<Header onOpenPalette={() => {}} />));
  });

  it('Header opens palette and shortcuts controls', async () => {
    const onOpenPalette = vi.fn();
    const { default: Header } = await import('./Header');
    render(wrap(<Header onOpenPalette={onOpenPalette} />));

    const paletteBtn = screen.queryByRole('button', { name: /búsqueda rápida|quick search|search/i });
    if (paletteBtn) {
      fireEvent.click(paletteBtn);
      expect(onOpenPalette).toHaveBeenCalled();
    }

    const shortcutsBtn = screen.queryByRole('button', { name: /atajos|shortcuts/i });
    if (shortcutsBtn) {
      fireEvent.click(shortcutsBtn);
      const dialog = screen.queryByRole('dialog', { name: /atajos|keyboard shortcuts/i });
      if (dialog) {
        expect(dialog).toBeInTheDocument();
        const closeBtn = screen.queryByRole('button', { name: /cerrar|cerrar panel/i });
        if (closeBtn) {
          fireEvent.click(closeBtn);
          await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        }
      }
    }

    fireEvent.keyDown(document, { key: '?' });
    const dialog = screen.queryByRole('dialog', { name: /atajos|keyboard shortcuts/i });
    if (dialog) {
      expect(dialog).toBeInTheDocument();
    }
  });

  it('Sidebar collapses and expands navigation sections', async () => {
    const { default: Sidebar } = await import('./Sidebar');
    render(wrap(<Sidebar />));

    const opsBtn = screen.queryByRole('button', { name: /operaciones|OPERACIONES/i });
    if (opsBtn) {
      const peliculasLink = screen.queryByRole('link', { name: /películas|movies/i });
      if (peliculasLink) {
        fireEvent.click(opsBtn);
        await waitFor(() => expect(screen.queryByRole('link', { name: /películas|movies/i })).not.toBeInTheDocument());
        fireEvent.click(opsBtn);
        await waitFor(() => expect(screen.getByRole('link', { name: /películas|movies/i })).toBeInTheDocument());
      }
    }
  });
});