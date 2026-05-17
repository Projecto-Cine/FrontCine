import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate (we cannot navigate for real inside a test).
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

// Mock AuthContext to drive the login / error behaviour.
const loginMock = vi.fn();
const setErrorMock = vi.fn();
let mockError = '';
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: loginMock, error: mockError, setError: setErrorMock }),
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
  mockError = '';
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

    // The button is the eye toggle (aria-pressed flips).
    const toggle = screen.getByRole('button', { name: /Mostrar|Show|Ocultar|Hide/i });
    await user.click(toggle);

    expect(pwInput).toHaveAttribute('type', 'text');
  });

  it('submitting the form calls login and navigates to "/" on success', async () => {
    loginMock.mockResolvedValue(true);
    const user = userEvent.setup();
    renderLogin();

    await user.type(document.getElementById('login-email'), 'admin@lumen.es');
    await user.type(document.getElementById('login-password'), 'lumen2026');
    await user.click(document.querySelector('button[type="submit"]'));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('admin@lumen.es', 'lumen2026');
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('if login returns false, does NOT navigate', async () => {
    loginMock.mockResolvedValue(false);
    const user = userEvent.setup();
    renderLogin();

    await user.type(document.getElementById('login-email'), 'x@y.com');
    await user.type(document.getElementById('login-password'), 'wrong');
    await user.click(document.querySelector('button[type="submit"]'));

    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('the demo-account buttons fill in the email', async () => {
    const user = userEvent.setup();
    renderLogin();

    // The demo button uses the email as its visible text.
    const demoBtn = screen.getByRole('button', { name: /admin@lumen.es/ });
    await user.click(demoBtn);

    expect(document.getElementById('login-email')).toHaveValue('admin@lumen.es');
  });

  it('when there is an error, renders the message with role=alert', () => {
    mockError = 'Credenciales inválidas';
    renderLogin();
    expect(screen.getByRole('alert')).toHaveTextContent(/Credenciales inválidas/);
  });
});
