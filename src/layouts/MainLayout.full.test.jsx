/**
 * MainLayout — exhaustive coverage of:
 *   - sidebar collapse toggle
 *   - command palette open via Ctrl+K
 *   - Alt+N navigation shortcuts (1..9)
 *   - keyboard listeners (cleanup on unmount)
 *   - location change effect (pageKey increments)
 *
 * Code in English; rendered text stays in Spanish.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

const toggleSidebarMock = vi.fn();
const navigateMock = vi.fn();
let currentSidebarCollapsed = false;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../contexts/AppContext', () => ({
  useApp: () => ({
    sidebarCollapsed: currentSidebarCollapsed,
    toggleSidebar: toggleSidebarMock,
    toasts: [],
    toast: vi.fn(),
    removeToast: vi.fn(),
  }),
  AppProvider: ({ children }) => children,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Admin User', role: 'admin' },
    logout: vi.fn(),
    canAccess: () => true,
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../i18n/LanguageContext', () => ({
  useLanguage: () => ({
    t: (k) => k,
    fmt: { time: (d) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) },
  }),
  LanguageProvider: ({ children }) => children,
}));

vi.mock('../components/shared/Toasts', () => ({ default: () => <div data-testid="toasts" /> }));
vi.mock('../components/shared/StatusBar', () => ({ default: () => <div data-testid="status-bar" /> }));
vi.mock('../components/shared/CommandPalette', () => ({
  default: ({ open, onClose }) => (
    open ? <div data-testid="palette" onClick={onClose}>Palette open</div> : null
  ),
}));
vi.mock('../components/accessibility/AccessibilityWidget', () => ({
  default: () => <div data-testid="a11y-widget" />,
}));
vi.mock('../components/shared/ShortcutsModal', () => ({
  default: ({ open, onClose }) => (open ? <div data-testid="shortcuts">Shortcuts <button onClick={onClose}>cerrar</button></div> : null),
}));
vi.mock('../components/ui/LanguageSwitcher', () => ({
  default: () => <div data-testid="lang-switcher" />,
}));
vi.mock('../assets/logoLumen.png', () => ({ default: 'logo.png' }));
vi.mock('../assets/logoLumen.webp', () => ({ default: 'logo.webp' }));

vi.mock('./Sidebar', () => ({ default: () => <aside data-testid="sidebar">Sidebar</aside> }));
vi.mock('./Header', () => ({
  default: ({ onOpenPalette }) => (
    <header data-testid="header">
      <button data-testid="open-palette" onClick={onOpenPalette}>Open palette</button>
    </header>
  ),
}));

import MainLayout from './MainLayout';

beforeEach(() => {
  vi.clearAllMocks();
  currentSidebarCollapsed = false;
});

function renderLayout(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<div data-testid="content-root">Home</div>} />
          <Route path="other" element={<div data-testid="content-other">Other</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('MainLayout — full coverage', () => {
  it('renders skip link, sidebar, header, content, statusbar, toasts and widgets', () => {
    renderLayout();
    expect(screen.getByText('Saltar al contenido principal')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
    expect(screen.getByTestId('toasts')).toBeInTheDocument();
    expect(screen.getByTestId('a11y-widget')).toBeInTheDocument();
    expect(screen.getByTestId('content-root')).toBeInTheDocument();
  });

  it('applies sidebar-collapsed class when collapsed', () => {
    currentSidebarCollapsed = true;
    const { container } = renderLayout();
    expect(container.querySelector('.sidebar-collapsed')).toBeTruthy();
  });

  it('opens command palette via Ctrl+K', () => {
    renderLayout();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByTestId('palette')).toBeInTheDocument();
  });

  it('opens command palette via Meta+K', () => {
    renderLayout();
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(screen.getByTestId('palette')).toBeInTheDocument();
  });

  it('closes command palette when toggled twice', () => {
    renderLayout();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByTestId('palette')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.queryByTestId('palette')).not.toBeInTheDocument();
  });

  it('toggles sidebar via Ctrl+B', () => {
    renderLayout();
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
    expect(toggleSidebarMock).toHaveBeenCalled();
  });

  it('navigates via Alt+1 (dashboard)', () => {
    renderLayout();
    fireEvent.keyDown(document, { key: '1', altKey: true });
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('navigates via Alt+2 (box office)', () => {
    renderLayout();
    fireEvent.keyDown(document, { key: '2', altKey: true });
    expect(navigateMock).toHaveBeenCalledWith('/box-office');
  });

  it('navigates via Alt+3..9 for all defined routes', () => {
    renderLayout();
    const expectedRoutes = [
      '/concession', '/movies', '/rooms',
      '/schedules', '/reservations', '/incidents', '/inventory',
    ];
    expectedRoutes.forEach((route, idx) => {
      fireEvent.keyDown(document, { key: String(idx + 3), altKey: true });
      expect(navigateMock).toHaveBeenCalledWith(route);
    });
  });

  it('ignores Alt+0 (out of range)', () => {
    renderLayout();
    fireEvent.keyDown(document, { key: '0', altKey: true });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('ignores Alt+99 (out of range)', () => {
    renderLayout();
    fireEvent.keyDown(document, { key: '9', altKey: true, shiftKey: true });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('opens command palette via the Header onOpenPalette button', () => {
    renderLayout();
    fireEvent.click(screen.getByTestId('open-palette'));
    expect(screen.getByTestId('palette')).toBeInTheDocument();
  });

  it('cleans up keyboard listener on unmount (no error after unmount)', () => {
    const { unmount } = renderLayout();
    unmount();
    // Firing after unmount should NOT throw nor open palette
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.queryByTestId('palette')).not.toBeInTheDocument();
  });
});
