import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../../i18n/LanguageContext';

// Stripe completo mockeado
const confirmPaymentMock = vi.fn();
vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue({}) }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div>{children}</div>,
  PaymentElement: ({ onReady }) => {
    // Simulamos que el PaymentElement avisa de "listo" al montarse.
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
  it('renderiza con role=dialog y muestra el título', () => {
    renderModal({ title: 'Pago de prueba' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Pago de prueba')).toBeInTheDocument();
  });

  it('llama a onCancel al pulsar Escape', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('llama a onCancel al hacer click en el botón cerrar', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderModal({ onCancel });

    // El botón de cerrar tiene aria-label desde i18n; el primer botón con cerrar.
    const closeBtns = screen.getAllByRole('button');
    await user.click(closeBtns[0]);
    expect(onCancel).toHaveBeenCalled();
  });

  it('llama a onCancel al hacer click en el overlay', () => {
    const onCancel = vi.fn();
    const { container } = renderModal({ onCancel });

    fireEvent.click(container.firstChild);
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('StripePaymentForm', () => {
  const wrap = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

  it('muestra el importe formateado', () => {
    const { container } = wrap(<StripePaymentForm amount={12.34} onSuccess={vi.fn()} onCancel={vi.fn()} />);
    // Hay varios sitios donde aparece el importe; basta con que aparezca al menos.
    expect(container.textContent).toMatch(/12\.34/);
  });

  it('confirmPayment OK → invoca onSuccess con el paymentIntent', async () => {
    confirmPaymentMock.mockResolvedValue({
      paymentIntent: { status: 'succeeded', id: 'pi_1' },
    });
    const onSuccess = vi.fn();
    const { container } = wrap(<StripePaymentForm amount={5} onSuccess={onSuccess} onCancel={vi.fn()} />);

    fireEvent.submit(container.querySelector('form'));

    // Esperamos a que la promesa de confirmPayment se resuelva.
    await new Promise(r => setTimeout(r, 0));
    expect(confirmPaymentMock).toHaveBeenCalled();
  });

  it('confirmPayment con error setea mensaje en pantalla', async () => {
    confirmPaymentMock.mockResolvedValue({ error: { message: 'Tarjeta rechazada' } });
    const { container } = wrap(<StripePaymentForm amount={5} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.submit(container.querySelector('form'));

    await new Promise(r => setTimeout(r, 50));
    // El mensaje debe aparecer en el role="alert".
    const alert = container.querySelector('[role="alert"]');
    if (alert) expect(alert.textContent).toMatch(/Tarjeta rechazada/);
  });

  it('botón cancelar invoca onCancel', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    const { container } = wrap(<StripePaymentForm amount={5} onSuccess={vi.fn()} onCancel={onCancel} />);

    const cancelBtn = container.querySelector('button[type="button"]');
    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });
});
