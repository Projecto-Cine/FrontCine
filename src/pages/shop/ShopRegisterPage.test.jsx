import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ShopRegisterPage from './ShopRegisterPage';

/**
 * Alta de cliente desde la tienda.
 *
 * Las páginas de `shop/` no tenían ningún test, siendo el código que da de alta
 * a los clientes. Y la pantalla de registro no existía: lo único parecido era
 * el alta de mostrador dentro de la página de taquilla, para uso del personal.
 */

const mockRegister = vi.fn();
const mockNavigate = vi.fn();
let authState = { error: '', fieldErrors: {} };

vi.mock('../../contexts/ShopAuthContext', () => ({
  useShopAuth: () => ({ register: mockRegister, ...authState }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/shop/register']}>
      <ShopRegisterPage />
    </MemoryRouter>,
  );
}

async function fillValidForm(user) {
  await user.type(screen.getByLabelText('Nombre'), 'Ana');
  await user.type(screen.getByLabelText('Apellidos'), 'Garcia');
  await user.type(screen.getByLabelText('Email'), 'ana@test.com');
  await user.type(screen.getByLabelText('Contraseña'), 'secreto123');
  await user.type(screen.getByLabelText('Fecha de nacimiento'), '1995-05-10');
}

describe('ShopRegisterPage', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
    authState = { error: '', fieldErrors: {} };
  });

  it('muestra todos los campos que el backend exige', () => {
    renderPage();

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Apellidos')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de nacimiento')).toBeInTheDocument();
  });

  it('envía birthDate y no dateOfBirth, que era el nombre que se perdía', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(true);
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledOnce());
    const payload = mockRegister.mock.calls[0][0];
    expect(payload).toHaveProperty('birthDate', '1995-05-10');
    expect(payload).not.toHaveProperty('dateOfBirth');
  });

  it('no envía role ni ningún indicador de descuento', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(true);
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledOnce());
    const payload = mockRegister.mock.calls[0][0];
    // Determinan el nivel de acceso y el precio: los decide el servidor.
    expect(payload).not.toHaveProperty('role');
    expect(payload).not.toHaveProperty('isFidelityMember');
    expect(payload).not.toHaveProperty('isStudent');
    expect(payload).not.toHaveProperty('userType');
  });

  it('no llama al backend si el formulario está incompleto', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('marca los requisitos de contraseña a medida que se cumplen', async () => {
    const user = userEvent.setup();
    renderPage();

    const password = screen.getByLabelText('Contraseña');
    await user.type(password, 'corta');
    expect(screen.getByText('Al menos 8 caracteres').closest('li')).toBeInTheDocument();

    await user.clear(password);
    await user.type(password, 'secreto123');

    // Los tres requisitos quedan cumplidos y el envío pasa a estar permitido.
    await fillValidForm(user);
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeEnabled();
  });

  it('rechaza una contraseña sin número', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Apellidos'), 'Garcia');
    await user.type(screen.getByLabelText('Email'), 'ana@test.com');
    await user.type(screen.getByLabelText('Contraseña'), 'solotextoaqui');
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '1995-05-10');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('rechaza una fecha de nacimiento futura', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Apellidos'), 'Garcia');
    await user.type(screen.getByLabelText('Email'), 'ana@test.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123');
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '2099-01-01');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('pinta el error por campo que devuelve el backend', () => {
    authState = { error: '', fieldErrors: { email: 'Ya existe una cuenta con este email.' } };
    renderPage();

    expect(screen.getByText('Ya existe una cuenta con este email.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('pinta el error general del contexto', () => {
    authState = { error: 'Demasiados intentos. Espera unos minutos y vuelve a probar.', fieldErrors: {} };
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Demasiados intentos');
  });

  it('navega a la tienda cuando el alta funciona', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(true);
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/shop', { replace: true }));
  });

  it('se queda en la página cuando el alta falla', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(false);
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('explica por qué se pide la fecha de nacimiento', () => {
    renderPage();

    expect(screen.getByLabelText('Fecha de nacimiento'))
      .toHaveAccessibleDescription(/calificación por edad/i);
  });

  it('permite revelar la contraseña', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');
  });
});
