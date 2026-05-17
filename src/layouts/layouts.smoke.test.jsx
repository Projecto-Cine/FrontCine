/**
 * Smoke tests for the layout components (Sidebar, Header).
 * MainLayout is excluded because it orchestrates routing and needs
 * a heavier setup.
 */
import { describe, it, vi } from 'vitest';
import { render } from '@testing-library/react';
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
});
