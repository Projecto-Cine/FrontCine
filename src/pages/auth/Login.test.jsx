import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mockeamos useNavigate (no podemos navegar de verdad en un test).
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

// Mockeamos AuthContext para controlar el comportamiento de login/error.
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
  it('renderiza inputs de email y contraseña', () => {
    renderLogin();
    expect(document.getElementById('login-email')).toBeInTheDocument();
    expect(document.getElementById('login-password')).toBeInTheDocument();
  });

  it('toggle "mostrar contraseña" cambia el tipo del input', async () => {
    const user = userEvent.setup();
    renderLogin();

    const pwInput = document.getElementById('login-password');
    expect(pwInput).toHaveAttribute('type', 'password');

    // El botón es el toggle del ojo (aria-pressed alterna).
    const toggle = screen.getByRole('button', { name: /Mostrar|Show|Ocultar|Hide/i });
    await user.click(toggle);

    expect(pwInput).toHaveAttribute('type', 'text');
  });

  it('al enviar el formulario llama a login y, si OK, navega a "/"', async () => {
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

  it('si login devuelve false, NO navega', async () => {
    loginMock.mockResolvedValue(false);
    const user = userEvent.setup();
    renderLogin();

    await user.type(document.getElementById('login-email'), 'x@y.com');
    await user.type(document.getElementById('login-password'), 'wrong');
    await user.click(document.querySelector('button[type="submit"]'));

    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('los botones de cuentas demo rellenan el email', async () => {
    const user = userEvent.setup();
    renderLogin();

    // El botón demo contiene el email como texto.
    const demoBtn = screen.getByRole('button', { name: /admin@lumen.es/ });
    await user.click(demoBtn);

    expect(document.getElementById('login-email')).toHaveValue('admin@lumen.es');
  });

  it('cuando hay error muestra el mensaje con role=alert', () => {
    mockError = 'Credenciales inválidas';
    renderLogin();
    expect(screen.getByRole('alert')).toHaveTextContent(/Credenciales inválidas/);
  });
});
