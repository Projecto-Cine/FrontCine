/**
 * Smoke tests para los componentes de layout (Sidebar, Header).
 * MainLayout queda fuera porque es el que orquesta routing y necesita
 * un setup más pesado.
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
  it('Sidebar se monta', async () => {
    const { default: Sidebar } = await import('./Sidebar');
    render(wrap(<Sidebar />));
  });

  it('Header se monta (sin onOpenPalette)', async () => {
    const { default: Header } = await import('./Header');
    render(wrap(<Header />));
  });

  it('Header se monta con onOpenPalette', async () => {
    const { default: Header } = await import('./Header');
    render(wrap(<Header onOpenPalette={() => {}} />));
  });
});
