import { useState, useCallback, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader, X, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
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
  const { t }     = useLanguage();
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
      setError(stripeErr.message ?? t('stripe.errorGeneric'));
      setPaying(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent);
    } else {
      setError(t('stripe.errorUnexpected'));
      setPaying(false);
    }
  }, [stripe, elements, onSuccess, t]);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.amountRow}>
        <span className={styles.amountLabel}>{t('stripe.totalLabel')}</span>
        <span className={styles.amountValue}>€{amount.toFixed(2)}</span>
      </div>

      <div className={styles.paymentElementWrap}>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: 'tabs' }}
        />
      </div>

      {!ready && (
        <div className={styles.loadingEl} role="status" aria-live="polite">
          <Loader size={16} className={styles.spin} aria-hidden="true" />
          <span>{t('stripe.loadingForm')}</span>
        </div>
      )}

      {error && (
        <div className={styles.errorBox} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
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
          <X size={14} aria-hidden="true" /> {t('stripe.cancel')}
        </button>
        <button
          type="submit"
          className={styles.payBtn}
          disabled={!stripe || !elements || !ready || paying}
          aria-busy={paying}
        >
          {paying
            ? <><Loader size={15} className={styles.spin} aria-hidden="true" /> {t('stripe.processing')}</>
            : <><CreditCard size={15} aria-hidden="true" /> {t('stripe.pay', { amount: amount.toFixed(2) })}</>
          }
        </button>
      </div>

      <div className={styles.secure}>
        <ShieldCheck size={11} aria-hidden="true" />
        <span>{t('stripe.secureNote')}</span>
      </div>
    </form>
  );
}

/* ── Modal wrapper (loads Stripe + provides Elements) ─── */
export default function StripePaymentModal({
  clientSecret,
  publishableKey,
  amount,
  title,
  onSuccess,
  onCancel,
}) {
  const { t } = useLanguage();
  const [stripePromise] = useState(() => loadStripe(publishableKey));
  const modalRef = useRef(null);

  const modalTitle = title ?? t('stripe.modalTitle');

  useEffect(() => {
    const previousFocus = document.activeElement;
    modalRef.current?.focus();
    return () => { previousFocus?.focus(); };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stripe-modal-title"
        ref={modalRef}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <CreditCard size={16} className={styles.headerIcon} aria-hidden="true" />
            <span id="stripe-modal-title">{modalTitle}</span>
          </div>
          <button className={styles.closeBtn} aria-label={t('stripe.close')} onClick={onCancel}>
            <X size={16} aria-hidden="true" />
          </button>
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
