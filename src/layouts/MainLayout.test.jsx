import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test', role: 'admin' }, logout: vi.fn(), can: () => true }),
}));

vi.mock('../contexts/AppContext', () => ({
  useApp: () => ({ sidebarCollapsed: false, toggleSidebar: vi.fn() }),
}));

describe('MainLayout', () => {
  it('mounts and reacts to keyboard shortcuts', async () => {
    Element.prototype.scrollIntoView = vi.fn();

    const { default: MainLayout } = await import('./MainLayout');

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>Página fake</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
    fireEvent.keyDown(document, { key: '1', altKey: true });
    fireEvent.keyDown(document, { key: '5', altKey: true });
    fireEvent.keyDown(document, { key: 'z' });
  });

  it('toggles sidebar with Ctrl+B', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const toggleSidebar = vi.fn();

    const { useApp: original } = vi.mocked(await import('../contexts/AppContext')).useApp || {};
    vi.mocked(await import('../contexts/AppContext')).useApp = () => ({
      sidebarCollapsed: false,
      toggleSidebar,
    });

    const { default: MainLayout } = await import('./MainLayout');

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>Página fake</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
    expect(toggleSidebar).toHaveBeenCalled();
  });
});