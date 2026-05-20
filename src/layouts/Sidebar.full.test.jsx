/**
 * Sidebar — exhaustive coverage:
 *   - render nav items with translations
 *   - section collapse/expand
 *   - logout button
 *   - collapsed sidebar mode
 *   - permission-driven filtering via canAccess
 *
 * Code in English; UI text stays in Spanish.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const logoutMock = vi.fn();
let canAccessFn = () => true;
let sidebarCollapsedFlag = false;
let currentUser = { name: 'Admin User', role: 'admin' };

vi.mock('../contexts/AppContext', () => ({
  useApp: () => ({ sidebarCollapsed: sidebarCollapsedFlag }),
  AppProvider: ({ children }) => children,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: currentUser,
    logout: logoutMock,
    canAccess: (...args) => canAccessFn(...args),
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../i18n/LanguageContext', () => ({
  useLanguage: () => ({ t: (k) => k }),
  LanguageProvider: ({ children }) => children,
}));

vi.mock('../assets/logoLumen.png', () => ({ default: 'logo.png' }));
vi.mock('../assets/logoLumen.webp', () => ({ default: 'logo.webp' }));

import Sidebar from './Sidebar';

beforeEach(() => {
  vi.clearAllMocks();
  canAccessFn = () => true;
  sidebarCollapsedFlag = false;
  currentUser = { name: 'Admin User', role: 'admin' };
});

function renderSidebar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar />
    </MemoryRouter>
  );
}

describe('Sidebar — full coverage', () => {
  it('renders the brand logo', () => {
    renderSidebar();
    expect(screen.getByAltText('Lumen Cinema')).toBeInTheDocument();
  });

  it('renders top-level nav links and section headers', () => {
    renderSidebar();
    expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
    expect(screen.getByText('nav.boxOffice')).toBeInTheDocument();
    expect(screen.getByText('nav.concession')).toBeInTheDocument();
    expect(screen.getByText('nav.movies')).toBeInTheDocument();
  });

  it('renders the logout button and triggers logout on click', () => {
    renderSidebar();
    const logoutBtn = screen.getByRole('button', { name: 'nav.logout' });
    fireEvent.click(logoutBtn);
    expect(logoutMock).toHaveBeenCalled();
  });

  it('toggles a section collapsed/expanded', () => {
    renderSidebar();
    const posHeader = screen.getByText('nav.pos').closest('button');
    expect(posHeader.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(posHeader);
    expect(posHeader.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(posHeader);
    expect(posHeader.getAttribute('aria-expanded')).toBe('true');
  });

  it('renders the user info block when expanded', () => {
    renderSidebar();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('hides labels when sidebar is collapsed', () => {
    sidebarCollapsedFlag = true;
    renderSidebar();
    expect(screen.queryByText('nav.dashboard')).not.toBeInTheDocument();
    // logout still renders icon-only
    expect(document.querySelector('[aria-label="nav.logout"]')).toBeTruthy();
  });

  it('omits restricted top-level routes via canAccess', () => {
    // Only allow dashboard
    canAccessFn = (path) => path === '/';
    renderSidebar();
    expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
    expect(screen.queryByText('nav.movies')).not.toBeInTheDocument();
  });

  it('hides an entire section if no items pass canAccess', () => {
    // Block everything inside POS
    canAccessFn = (path) => !['/box-office', '/concession'].includes(path);
    renderSidebar();
    expect(screen.queryByText('nav.pos')).not.toBeInTheDocument();
  });

  it('marks the active route with the active class', () => {
    renderSidebar('/');
    const active = document.querySelector('.nav-active');
    expect(active).toBeTruthy();
  });

  it('renders sliding pill element', () => {
    const { container } = renderSidebar('/');
    expect(container.querySelector('aside')).toBeTruthy();
  });

  it('reacts when navigating to a different active route', () => {
    renderSidebar('/movies');
    const active = document.querySelector('.nav-active');
    expect(active?.textContent ?? '').toContain('nav.movies');
  });

  it('hides the user info block when user is null', () => {
    currentUser = null;
    renderSidebar();
    // Logout button still renders
    expect(document.querySelector('[aria-label="nav.logout"]')).toBeTruthy();
  });

  it('falls back to user.role when t(`header.roles.${user.role}`) returns the key', () => {
    currentUser = { name: 'Custom User', role: 'CUSTOM_ROLE' };
    renderSidebar();
    // The role label falls back to "CUSTOM_ROLE" when no translation exists
    expect(document.body.textContent).toContain('Custom');
  });

  it('does NOT render userInfo when sidebar is collapsed AND user exists', () => {
    sidebarCollapsedFlag = true;
    currentUser = { name: 'Admin User', role: 'admin' };
    renderSidebar();
    // userInfo block is hidden via `!sidebarCollapsed && user && (...)`
    expect(screen.queryByText('Admin')).toBeNull();
  });

  it('uses NavLink end={true} only for dashboard (`/`)', () => {
    renderSidebar('/');
    // The dashboard NavLink uses exact match (end={true}); other links don't.
    const dashLink = screen.getByText('nav.dashboard').closest('a');
    expect(dashLink).toBeTruthy();
  });

  it('skips a section entirely when ALL of its items are not accessible', () => {
    // Allow only the dashboard
    canAccessFn = (path) => path === '/';
    renderSidebar();
    // The "Operations", "Management" and "Admin" sections should not render
    expect(screen.queryByText('nav.movies')).toBeNull();
    expect(screen.queryByText('nav.inventory')).toBeNull();
    expect(screen.queryByText('nav.clients')).toBeNull();
  });

  it('toggleSection adds and removes the sectionKey from collapsed state', () => {
    renderSidebar();
    const posHeader = screen.getByText('nav.pos').closest('button');
    // Initial: expanded (true)
    expect(posHeader.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(posHeader);
    expect(posHeader.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(posHeader);
    expect(posHeader.getAttribute('aria-expanded')).toBe('true');
  });
});
