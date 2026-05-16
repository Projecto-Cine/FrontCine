import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('renderiza el texto que recibe como children', () => {
    render(<Button>Guardar</Button>);

    // getByRole('button', { name: '...' }) es la forma RECOMENDADA:
    // valida accesibilidad (que sea un botón con nombre accesible)
    // y a la vez encuentra el elemento.
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('llama a onClick cuando el usuario hace click', async () => {
    // vi.fn() crea un "espía": una función falsa que recuerda cómo la llamaron.
    const onClick = vi.fn();
    // userEvent simula interacciones reales del usuario (mejor que fireEvent).
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole('button', { name: 'Click me' }));

    // Comprobamos que el callback se llamó exactamente una vez.
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('NO llama a onClick si está disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button disabled onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole('button', { name: 'Click me' }));

    // Un botón deshabilitado no debe disparar eventos.
    expect(onClick).not.toHaveBeenCalled();
  });

  it('queda deshabilitado cuando loading={true}', () => {
    // Esto evita el típico bug de doble submit en formularios.
    render(<Button loading>Enviando…</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
