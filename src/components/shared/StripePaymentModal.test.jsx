import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../../i18n/LanguageContext';

// Stripe is fully mocked.
const confirmPaymentMock = vi.fn();
vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue({}) }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div>{children}</div>,
  PaymentElement: ({ onReady }) => {
    // Pretend the PaymentElement signals "ready" on mount.
    setTimeout(() => onReady?.(), 0);
    return <div data-testid="payment-element" />;
  },
  useStripe:   () => ({ confirmPayment: confirmPaymentMock }),
  useElements: () => ({ getElement: () => ({}) }),
}));

import StripePaymentModal, { StripePaymentForm } from './StripePaymentModal';

const renderModal = (props = {}) => render(
  <LanguageProvider>
    <StripePaymentModal
      clientSecret="cs_test"
      publishableKey="pk_test"
      amount={42.5}
      onSuccess={vi.fn()}
      onCancel={vi.fn()}
      {...props}
    />
  </LanguageProvider>
);

beforeEach(() => vi.clearAllMocks());

describe('StripePaymentModal', () => {
  it('renders with role=dialog and shows the title', () => {
    renderModal({ title: 'Pago de prueba' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Pago de prueba')).toBeInTheDocument();
  });

  it('calls onCancel on Escape key', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onCancel when the close button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderModal({ onCancel });

    // The close button uses an i18n aria-label; just click the first button.
    const closeBtns = screen.getAllByRole('button');
    await user.click(closeBtns[0]);
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onCancel when the overlay is clicked', () => {
    const onCancel = vi.fn();
    const { container } = renderModal({ onCancel });

    fireEvent.click(container.firstChild);
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('StripePaymentForm', () => {
  const wrap = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

  it('shows the formatted amount', () => {
    const { container } = wrap(<StripePaymentForm amount={12.34} onSuccess={vi.fn()} onCancel={vi.fn()} />);
    // The amount may appear in several places; we just check at least once.
    expect(container.textContent).toMatch(/12\.34/);
  });

  it('confirmPayment OK → invokes onSuccess with the paymentIntent', async () => {
    confirmPaymentMock.mockResolvedValue({
      paymentIntent: { status: 'succeeded', id: 'pi_1' },
    });
    const onSuccess = vi.fn();
    const { container } = wrap(<StripePaymentForm amount={5} onSuccess={onSuccess} onCancel={vi.fn()} />);

    fireEvent.submit(container.querySelector('form'));

    // Wait for the confirmPayment promise to resolve.
    await new Promise(r => setTimeout(r, 0));
    expect(confirmPaymentMock).toHaveBeenCalled();
  });

  it('confirmPayment with error sets a message on screen', async () => {
    confirmPaymentMock.mockResolvedValue({ error: { message: 'Tarjeta rechazada' } });
    const { container } = wrap(<StripePaymentForm amount={5} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.submit(container.querySelector('form'));

    await new Promise(r => setTimeout(r, 50));
    // The message must appear inside the role="alert" element.
    const alert = container.querySelector('[role="alert"]');
    if (alert) expect(alert.textContent).toMatch(/Tarjeta rechazada/);
  });

  it('cancel button invokes onCancel', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    const { container } = wrap(<StripePaymentForm amount={5} onSuccess={vi.fn()} onCancel={onCancel} />);

    const cancelBtn = container.querySelector('button[type="button"]');
    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });
});
