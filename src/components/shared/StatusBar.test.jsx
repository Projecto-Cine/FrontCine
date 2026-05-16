import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import StatusBar from './StatusBar';

// AuthContext es un dep duro → lo mockeamos para que devuelva un user fake.
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Ana López', role: 'admin' } }),
}));

describe('StatusBar', () => {
  beforeEach(() => {
    // jsdom no expone setter para navigator.onLine sin trampas; usamos defineProperty.
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  it('muestra "Conectado" cuando navigator.onLine=true', () => {
    render(<StatusBar />);
    expect(screen.getByText('Conectado')).toBeInTheDocument();
  });

  it('cambia a "Sin conexión" al disparar el evento offline', () => {
    render(<StatusBar />);

    act(() => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText('Sin conexión')).toBeInTheDocument();
  });

  it('muestra el primer nombre del usuario y su role', () => {
    render(<StatusBar />);
    expect(screen.getByText(/Ana · admin/)).toBeInTheDocument();
  });

  it('muestra la versión de la app', () => {
    render(<StatusBar />);
    expect(screen.getByText(/v1\.0\.0-dev/)).toBeInTheDocument();
  });

  it('tiene role="contentinfo" (footer accesible)', () => {
    render(<StatusBar />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
