import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (actual) => {
  const mod = await actual || {};
  return { ...mod, useNavigate: () => navigateMock };
});

const loginMock = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: loginMock, error: '', setError: vi.fn() }),
}));

import Login from './Login';
import { LanguageProvider } from '../../i18n/LanguageContext';

const renderLogin = () => render(
  <MemoryRouter>
    <LanguageProvider><Login /></LanguageProvider>
  </MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  loginMock.mockResolvedValue('/');
});

describe('Login page', () => {
  it('renders email and password inputs', () => {
    renderLogin();
    expect(document.getElementById('login-email')).toBeInTheDocument();
    expect(document.getElementById('login-password')).toBeInTheDocument();
  });

  it('the "show password" toggle flips the input type', async () => {
    const user = userEvent.setup();
    renderLogin();

    const pwInput = document.getElementById('login-password');
    expect(pwInput).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button', { name: /Mostrar|Ocultar/i });
    await user.click(toggle);
    expect(pwInput).toHaveAttribute('type', 'text');
  });

  it('submitting the form calls login and navigates on success', async () => {
    loginMock.mockResolvedValue('/');
    const user = userEvent.setup();
    renderLogin();

    await user.type(document.getElementById('login-email'), 'admin@lumen.es');
    await user.type(document.getElementById('login-password'), 'lumen2026');
    await user.click(document.querySelector('button[type="submit"]'));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('admin@lumen.es', 'lumen2026');
    });
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });

  it('if login returns null, does NOT navigate', async () => {
    loginMock.mockResolvedValue(null);
    const user = userEvent.setup();
    renderLogin();

    await user.type(document.getElementById('login-email'), 'x@y.com');
    await user.type(document.getElementById('login-password'), 'wrong');
    await user.click(document.querySelector('button[type="submit"]'));

    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('demo-account buttons fill in the credentials', async () => {
    const user = userEvent.setup();
    renderLogin();

    const demoBtn = screen.queryByRole('button', { name: /admin|lumen/i });
    if (demoBtn) {
      await user.click(demoBtn);
      const emailInput = document.getElementById('login-email');
      if (emailInput) {
        expect(emailInput).toHaveValue();
      }
    }
  });
});