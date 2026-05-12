import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader, X, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import styles from './StripePaymentModal.module.css';

const STRIPE_APPEARANCE = {
  theme: 'night',
  variables: {
    colorPrimary:        '#C49A6C',
    colorBackground:     '#1a1612',
    colorText:           '#ede4d4',
    colorTextSecondary:  '#9a8e7a',
    colorDanger:         '#ef4444',
    fontFamily:          'system-ui, sans-serif',
    borderRadius:        '8px',
    focusBoxShadow:      '0 0 0 2px rgba(196,154,108,0.35)',
  },
  rules: {
    '.Input': {
      border:          '1px solid rgba(255,255,255,0.1)',
      backgroundColor: '#0e0c09',
      color:           '#ede4d4',
    },
    '.Input:focus': {
      border: '1px solid #C49A6C',
    },
    '.Label': {
      color:      '#9a8e7a',
      fontSize:   '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
    },
  },
};

/* ── Inner checkout form (needs Elements context) ─────── */
export function StripePaymentForm({ amount, onSuccess, onCancel }) {
  const stripe    = useStripe();
  const elements  = useElements();
  const [paying,  setPaying]  = useState(false);
  const [error,   setError]   = useState(null);
  const [ready,   setReady]   = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const { error: stripeErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (stripeErr) {
      setError(stripeErr.message ?? 'Error al procesar el pago.');
      setPaying(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent);
    } else {
      setError('Estado de pago inesperado. Inténtalo de nuevo.');
      setPaying(false);
    }
  }, [stripe, elements, onSuccess]);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.amountRow}>
        <span className={styles.amountLabel}>Total a pagar</span>
        <span className={styles.amountValue}>€{amount.toFixed(2)}</span>
      </div>

      <div className={styles.paymentElementWrap}>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: 'tabs' }}
        />
      </div>

      {!ready && (
        <div className={styles.loadingEl}>
          <Loader size={16} className={styles.spin} />
          <span>Cargando formulario de pago…</span>
        </div>
      )}

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={paying}
        >
          <X size={14} /> Cancelar
        </button>
        <button
          type="submit"
          className={styles.payBtn}
          disabled={!stripe || !elements || !ready || paying}
        >
          {paying
            ? <><Loader size={15} className={styles.spin} /> Procesando…</>
            : <><CreditCard size={15} /> Pagar €{amount.toFixed(2)}</>
          }
        </button>
      </div>

      <div className={styles.secure}>
        <ShieldCheck size={11} />
        <span>Pago seguro cifrado por Stripe · No almacenamos datos de tu tarjeta</span>
      </div>
    </form>
  );
}

/* ── Modal wrapper (loads Stripe + provides Elements) ─── */
export default function StripePaymentModal({
  clientSecret,
  publishableKey,
  amount,
  title = 'Pago online',
  onSuccess,
  onCancel,
}) {
  const [stripePromise] = useState(() => loadStripe(publishableKey));

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <CreditCard size={16} className={styles.headerIcon} />
            <span>{title}</span>
          </div>
          <button className={styles.closeBtn} onClick={onCancel}><X size={16} /></button>
        </div>

        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: STRIPE_APPEARANCE, locale: 'es' }}
        >
          <StripePaymentForm
            amount={amount}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      </div>
    </div>
  );
}
