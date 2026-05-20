import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const loginMock = vi.fn();
const setErrorMock = vi.fn();
const navigateMock = vi.fn();
let authError = '';

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  MemoryRouter: ({ children }) => children,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
    error: authError,
    setError: setErrorMock,
    logout: vi.fn(),
    user: null,
    hasRole: vi.fn(),
    canAccess: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({ t: (k) => k }),
  LanguageProvider: ({ children }) => children,
}));

vi.mock('lucide-react', () => {
  const MockIcon = () => null;
  return { Eye: MockIcon, EyeOff: MockIcon, ShieldCheck: MockIcon };
});

vi.mock('../../components/ui/Button', () => {
  const MockButton = ({ children, ...props }) => <button {...props}>{children}</button>;
  return { default: MockButton };
});

vi.mock('../../components/ui/LanguageSwitcher', () => {
  const MockLangSwitch = () => <div data-testid="lang-switcher" />;
  return { default: MockLangSwitch };
});

vi.mock('../../assets/logoLumen.png', () => ({ default: 'logo.png' }));
vi.mock('../../assets/logoLumen.webp', () => ({ default: 'logo.webp' }));

import Login from './Login';

beforeEach(() => {
  vi.clearAllMocks();
  loginMock.mockResolvedValue('/');
  authError = '';
});

describe('Login page', () => {
  it('renders email and password inputs', () => {
    render(<Login />);
    expect(document.getElementById('login-email')).toBeTruthy();
    expect(document.getElementById('login-password')).toBeTruthy();
  });

  it('password field exists', () => {
    render(<Login />);
    const pwInput = document.querySelector('input[type="password"]');
    expect(pwInput).toBeTruthy();
  });

  it('demo buttons exist', () => {
    render(<Login />);
    const demoButtons = document.querySelectorAll('button');
    expect(demoButtons.length).toBeGreaterThan(0);
  });

  it('submit button is rendered', () => {
    render(<Login />);
    const submitBtn = document.querySelector('button[type="submit"]');
    expect(submitBtn).toBeTruthy();
  });

  it('page renders without crashing', () => {
    render(<Login />);
    expect(document.body.textContent).toBeTruthy();
  });

  it('updates email and password on change', () => {
    render(<Login />);
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    fireEvent.change(email, { target: { value: 'a@b.com' } });
    fireEvent.change(password, { target: { value: 'secret' } });
    expect(email.value).toBe('a@b.com');
    expect(password.value).toBe('secret');
  });

  it('toggles password visibility', () => {
    render(<Login />);
    const pw = document.querySelector('input[type="password"]');
    expect(pw).toBeTruthy();
    const toggle = document.querySelector('button[aria-pressed]');
    fireEvent.click(toggle);
    const pwText = document.querySelector('#login-password');
    expect(pwText.type).toBe('text');
    fireEvent.click(toggle);
    expect(pwText.type).toBe('password');
  });

  it('switches between employee and admin mode', () => {
    render(<Login />);
    const tabs = document.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.click(tabs[0]);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('fills demo credentials on demo button click', () => {
    render(<Login />);
    const demoBtns = Array.from(document.querySelectorAll('button')).filter(b => /lumen\.es/.test(b.textContent ?? ''));
    expect(demoBtns.length).toBeGreaterThan(0);
    fireEvent.click(demoBtns[0]);
    const email = document.getElementById('login-email');
    expect(email.value).toContain('@lumen.es');
  });

  it('submits the form and calls login + navigate', async () => {
    render(<Login />);
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    fireEvent.change(email, { target: { value: 'a@b.com' } });
    fireEvent.change(password, { target: { value: 'secret' } });
    const form = document.querySelector('form');
    fireEvent.submit(form);
    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('a@b.com', 'secret', { employeeOnly: true }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/', { replace: true }));
  });

  it('does not navigate when login returns null', async () => {
    loginMock.mockResolvedValueOnce(null);
    render(<Login />);
    fireEvent.change(document.getElementById('login-email'), { target: { value: 'x@y.com' } });
    fireEvent.change(document.getElementById('login-password'), { target: { value: 'pw' } });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('renders admin demo buttons after switching to admin mode', () => {
    render(<Login />);
    const tabs = document.querySelectorAll('[role="tab"]');
    fireEvent.click(tabs[1]);
    const adminDemoBtns = Array.from(document.querySelectorAll('button')).filter(b => /gerencia|cajero/i.test(b.textContent ?? ''));
    expect(adminDemoBtns.length).toBeGreaterThan(0);
  });

  it('clears email and password when switching mode', () => {
    render(<Login />);
    fireEvent.change(document.getElementById('login-email'), { target: { value: 'a@b.com' } });
    const tabs = document.querySelectorAll('[role="tab"]');
    fireEvent.click(tabs[1]);
    expect(document.getElementById('login-email').value).toBe('');
  });
});

describe('Login page — error state', () => {
  it('renders error message and aria attributes when error is set', () => {
    authError = 'Credenciales incorrectas';
    render(<Login />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(document.getElementById('login-error')).toBeTruthy();
    authError = '';
  });
});
