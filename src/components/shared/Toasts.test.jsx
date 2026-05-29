import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AppProvider, useApp } from '../../contexts/AppContext';
import Toasts from './Toasts';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

// Helper component to fire a toast from inside the Provider.
function Trigger({ message, type = 'info' }) {
  const { toast } = useApp();
  return <button onClick={() => toast(message, type, 5000)}>Lanzar</button>;
}

const setup = (ui) => render(<AppProvider><Toasts />{ui}</AppProvider>);

describe('Toasts', () => {
  it('does NOT render anything when there are no toasts', () => {
    setup(null);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('renders a toast when one is fired', () => {
    // With fake timers we use fireEvent (sync) instead of userEvent (async).
    setup(<Trigger message="Guardado" type="success" />);

    fireEvent.click(screen.getByRole('button', { name: 'Lanzar' }));

    expect(screen.getByText('Guardado')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('a toast with type="error" uses role="alert" (more insistent)', () => {
    setup(<Trigger message="Falló" type="error" />);

    fireEvent.click(screen.getByRole('button', { name: 'Lanzar' }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('the close button removes the toast', () => {
    setup(<Trigger message="X" type="info" />);

    fireEvent.click(screen.getByRole('button', { name: 'Lanzar' }));
    expect(screen.getByText('X')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cerrar notificación/i }));

    expect(screen.queryByText('X')).toBeNull();
  });

  it('the toast auto-dismisses after the duration', () => {
    setup(<Trigger message="Adios" type="info" />);

    fireEvent.click(screen.getByRole('button', { name: 'Lanzar' }));
    expect(screen.getByText('Adios')).toBeInTheDocument();

    // Advance the 5-second timer.
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.queryByText('Adios')).toBeNull();
  });
});
