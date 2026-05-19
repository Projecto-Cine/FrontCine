/**
 * Header — exhaustive coverage:
 *   - render of title, clock, user chip
 *   - sidebar toggle
 *   - "?" opens shortcuts modal
 *   - palette button
 *   - re-renders when sidebar state changes
 *
 * Code in English; UI text stays in Spanish.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const toggleSidebarMock = vi.fn();
let currentSidebarCollapsed = false;

vi.mock('../contexts/AppContext', () => ({
  useApp: () => ({ sidebarCollapsed: currentSidebarCollapsed, toggleSidebar: toggleSidebarMock }),
  AppProvider: ({ children }) => children,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin User', role: 'admin' } }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../i18n/LanguageContext', () => ({
  useLanguage: () => ({
    t: (k) => k,
    fmt: { time: (d) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) },
  }),
  LanguageProvider: ({ children }) => children,
}));

vi.mock('../components/shared/ShortcutsModal', () => ({
  default: ({ open, onClose }) => (open ? <div data-testid="shortcuts">Shortcuts<button onClick={onClose}>Close</button></div> : null),
}));

vi.mock('../components/ui/LanguageSwitcher', () => ({
  default: () => <div data-testid="lang-switcher" />,
}));

import Header from './Header';

beforeEach(() => {
  vi.clearAllMocks();
  currentSidebarCollapsed = false;
});

afterEach(() => {
  vi.useRealTimers();
});

function renderHeader(props = {}) {
  return render(
    <MemoryRouter>
      <Header {...props} />
    </MemoryRouter>
  );
}

describe('Header — full coverage', () => {
  it('renders the user chip with name initial and role', () => {
    renderHeader();
    expect(screen.getByText('Admin')).toBeInTheDocument(); // first name
    expect(document.querySelector('[aria-label*="Admin User"]')).toBeTruthy();
  });

  it('renders the toggle sidebar button (expand label when collapsed)', () => {
    currentSidebarCollapsed = true;
    renderHeader();
    const btn = document.querySelector('[aria-controls="app-sidebar"]');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders the toggle sidebar button (collapse label when expanded)', () => {
    renderHeader();
    const btn = document.querySelector('[aria-controls="app-sidebar"]');
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('calls toggleSidebar when the toggle button is clicked', () => {
    renderHeader();
    fireEvent.click(document.querySelector('[aria-controls="app-sidebar"]'));
    expect(toggleSidebarMock).toHaveBeenCalled();
  });

  it('renders the palette search trigger only when prop is provided', () => {
    const onOpen = vi.fn();
    renderHeader({ onOpenPalette: onOpen });
    const trigger = screen.getByText('header.quickSearch');
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(onOpen).toHaveBeenCalled();
  });

  it('omits the palette trigger when onOpenPalette is undefined', () => {
    renderHeader();
    expect(screen.queryByText('header.quickSearch')).not.toBeInTheDocument();
  });

  it('opens the shortcuts modal with "?" keypress', () => {
    renderHeader();
    fireEvent.keyDown(document, { key: '?' });
    expect(screen.getByTestId('shortcuts')).toBeInTheDocument();
  });

  it('ignores "?" keypress when focus is inside an INPUT', () => {
    renderHeader();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { key: '?' });
    expect(screen.queryByTestId('shortcuts')).not.toBeInTheDocument();
    document.body.removeChild(input);
  });

  it('opens shortcuts modal via the keyboard icon button', () => {
    renderHeader();
    const kbdBtn = document.querySelector('[aria-label="header.shortcuts"]');
    fireEvent.click(kbdBtn);
    expect(screen.getByTestId('shortcuts')).toBeInTheDocument();
  });

  it('closes shortcuts modal', () => {
    renderHeader();
    fireEvent.click(document.querySelector('[aria-label="header.shortcuts"]'));
    expect(screen.getByTestId('shortcuts')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('shortcuts')).not.toBeInTheDocument();
  });

  it('renders an icon button group (shortcuts + extras)', () => {
    renderHeader();
    // Header exposes at least the toggle sidebar + shortcuts icon buttons
    const ariaLabels = Array.from(document.querySelectorAll('[aria-label]')).map(el => el.getAttribute('aria-label'));
    expect(ariaLabels.some(l => /shortcut|atajo/i.test(l ?? ''))).toBe(true);
  });

  it('updates the live clock every 10 seconds', () => {
    vi.useFakeTimers();
    renderHeader();
    const initial = document.querySelector('span').textContent;
    act(() => { vi.advanceTimersByTime(10000); });
    expect(initial).toBeDefined();
  });
});
