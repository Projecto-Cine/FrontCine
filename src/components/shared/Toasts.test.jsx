import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AppProvider, useApp } from '../../contexts/AppContext';
import Toasts from './Toasts';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

// Componente de ayuda para disparar un toast desde dentro del Provider.
function Trigger({ message, type = 'info' }) {
  const { toast } = useApp();
  return <button onClick={() => toast(message, type, 5000)}>Lanzar</button>;
}

const setup = (ui) => render(<AppProvider><Toasts />{ui}</AppProvider>);

describe('Toasts', () => {
  it('NO renderiza nada cuando no hay toasts', () => {
    setup(null);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('renderiza un toast cuando se dispara', () => {
    // Con fake timers usamos fireEvent (síncrono) en lugar de userEvent (async).
    setup(<Trigger message="Guardado" type="success" />);

    fireEvent.click(screen.getByRole('button', { name: 'Lanzar' }));

    expect(screen.getByText('Guardado')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('un toast type="error" usa role="alert" (más insistente)', () => {
    setup(<Trigger message="Falló" type="error" />);

    fireEvent.click(screen.getByRole('button', { name: 'Lanzar' }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('el botón cerrar elimina el toast', () => {
    setup(<Trigger message="X" type="info" />);

    fireEvent.click(screen.getByRole('button', { name: 'Lanzar' }));
    expect(screen.getByText('X')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cerrar notificación/i }));

    expect(screen.queryByText('X')).toBeNull();
  });

  it('el toast se elimina solo tras la duración', () => {
    setup(<Trigger message="Adios" type="info" />);

    fireEvent.click(screen.getByRole('button', { name: 'Lanzar' }));
    expect(screen.getByText('Adios')).toBeInTheDocument();

    // Avanzamos los 5 segundos del setTimeout.
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.queryByText('Adios')).toBeNull();
  });
});
