import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import StatusBar from './StatusBar';

// AuthContext is a hard dependency → mock it to return a fake user.
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Ana López', role: 'admin' } }),
}));

describe('StatusBar', () => {
  beforeEach(() => {
    // jsdom does not expose a setter for navigator.onLine without tricks; use defineProperty.
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  it('shows "Conectado" when navigator.onLine=true', () => {
    render(<StatusBar />);
    expect(screen.getByText('Conectado')).toBeInTheDocument();
  });

  it('switches to "Sin conexión" when the offline event fires', () => {
    render(<StatusBar />);

    act(() => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText('Sin conexión')).toBeInTheDocument();
  });

  it("shows the user's first name and role", () => {
    render(<StatusBar />);
    expect(screen.getByText(/Ana · admin/)).toBeInTheDocument();
  });

  it('shows the app version', () => {
    render(<StatusBar />);
    expect(screen.getByText(/v1\.0\.0-dev/)).toBeInTheDocument();
  });

  it('has role="contentinfo" (accessible footer)', () => {
    render(<StatusBar />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
