/**
 * Smoke tests de componentes complejos que aún no tenían tests dedicados.
 */
import { describe, it, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

// AuthContext y servicios mockeados.
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'X', role: 'admin' }, logout: vi.fn() }),
}));
vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue({}) }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div>{children}</div>,
  CardElement: () => <div data-testid="card" />,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => ({ confirmCardPayment: vi.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }), confirmPayment: vi.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }) }),
  useElements: () => ({ getElement: () => ({}) }),
}));

// jsdom no implementa scrollIntoView; CommandPalette lo invoca al cambiar cursor.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const wrap = (ui) => (
  <MemoryRouter>
    <LanguageProvider><AppProvider>{ui}</AppProvider></LanguageProvider>
  </MemoryRouter>
);

describe('Smoke components', () => {
  it('CommandPalette open=false (no renderiza)', async () => {
    const { default: CommandPalette } = await import('./shared/CommandPalette');
    render(wrap(<CommandPalette open={false} onClose={() => {}} />));
  });

  it('CommandPalette open=true', async () => {
    const { default: CommandPalette } = await import('./shared/CommandPalette');
    render(wrap(<CommandPalette open onClose={() => {}} />));
  });

  it('AccessibilityWidget', async () => {
    const { default: Widget } = await import('./accessibility/AccessibilityWidget');
    render(wrap(<Widget />));
  });

  it('SeatMap con datos vacíos', async () => {
    const { default: SeatMap } = await import('./shared/SeatMap');
    // SeatMap puede tener varios modos; lo intentamos con varias prop combos.
    render(wrap(<SeatMap seats={[]} selectedSeats={[]} onToggle={() => {}} maxSelect={5} />));
  });

  it('SeatMap con asientos reales', async () => {
    const { default: SeatMap } = await import('./shared/SeatMap');
    render(wrap(<SeatMap
      seats={[
        { row: 'A', number: 1, status: 'available' },
        { row: 'A', number: 2, status: 'occupied' },
        { row: 'B', number: 1, status: 'unavailable' },
      ]}
      selectedSeats={[]}
      onToggle={() => {}}
      maxSelect={5}
    />));
  });

  it('StripePaymentModal closed', async () => {
    const { default: Modal } = await import('./shared/StripePaymentModal');
    render(wrap(<Modal open={false} onClose={() => {}} amount={10} purchaseId={1} onSuccess={() => {}} />));
  });

  it('StripePaymentModal open', async () => {
    const { default: Modal } = await import('./shared/StripePaymentModal');
    render(wrap(<Modal open onClose={() => {}} amount={10} purchaseId={1} onSuccess={() => {}} />));
  });
});
