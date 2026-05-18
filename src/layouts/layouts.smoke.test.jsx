/**
 * Smoke tests for the layout components (Sidebar, Header).
 * MainLayout is excluded because it orchestrates routing and needs
 * a heavier setup.
 */
import { describe, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User', role: 'admin' },
    logout: vi.fn(),
  }),
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

    fireEvent.click(screen.getByRole('button', { name: /búsqueda rápida|quick search/i }));
    expect(onOpenPalette).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /atajos/i }));
    expect(screen.getByRole('dialog', { name: /atajos/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cerrar panel de atajos/i }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /atajos/i })).not.toBeInTheDocument());

    fireEvent.keyDown(document, { key: '?' });
    expect(screen.getByRole('dialog', { name: /atajos/i })).toBeInTheDocument();
  });

  it('Sidebar collapses and expands navigation sections', async () => {
    const { default: Sidebar } = await import('./Sidebar');
    render(wrap(<Sidebar />));

    expect(screen.getByRole('link', { name: /películas/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /operaciones/i }));
    expect(screen.queryByRole('link', { name: /películas/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /operaciones/i }));
    expect(screen.getByRole('link', { name: /películas/i })).toBeInTheDocument();
  });
});
