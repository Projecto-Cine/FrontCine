import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Film, Mail, Star, Home, Ticket } from 'lucide-react';
import styles from './ShopConfirmPage.module.css';

export default function ShopConfirmPage() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const tickets    = state?.tickets ?? [];
  const email      = state?.email ?? '';
  const discountApplied = state?.discountApplied;
  const discountAmount  = state?.discountAmount;

  if (!tickets.length) {
    return (
      <div className={styles.errorState}>
        <Film size={40} className={styles.errorIcon} />
        <p>No se encontraron tickets. Vuelve a la cartelera.</p>
        <button className={styles.homeBtn} onClick={() => navigate('/shop')}>
          <Home size={15} aria-hidden="true" /> Volver a la cartelera
        </button>
      </div>
    );
  }

  const first = tickets[0];

  return (
    <div className={styles.page}>
      {/* Success banner */}
      <div className={styles.successBanner}>
        <CheckCircle size={36} className={styles.successIcon} aria-hidden="true" />
        <h1 className={styles.successTitle}>¡Compra confirmada!</h1>
        {email && (
          <div className={styles.emailSent}>
            <Mail size={14} aria-hidden="true" />
            <span>Ticket enviado a <strong>{email}</strong></span>
          </div>
        )}
        {discountApplied && discountAmount && (
          <div className={styles.discountBadge}>
            <Star size={13} aria-hidden="true" />
            Descuento de fidelidad aplicado: −€{Number(discountAmount).toFixed(2)}
          </div>
        )}
      </div>

      {/* Tickets */}
      <div className={styles.ticketList}>
        {tickets.map((tk, i) => (
          <div key={tk.id ?? i} className={styles.ticketCard}>
            <div className={styles.ticketHeader}>
              <Ticket size={16} aria-hidden="true" />
              <span className={styles.ticketNum}>Entrada {i + 1} de {tickets.length}</span>
            </div>

            <div className={styles.ticketBody}>
              <div className={styles.ticketInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Película</span>
                  <span className={styles.infoVal}>{tk.movie ?? '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Sala</span>
                  <span className={styles.infoVal}>{tk.room ?? '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Fecha</span>
                  <span className={styles.infoVal}>{tk.date ?? '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Hora</span>
                  <span className={styles.infoVal}>{tk.time ?? '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Butaca</span>
                  <span className={`${styles.infoVal} ${styles.seatBadge}`}>{tk.seat ?? '—'}</span>
                </div>
                {tk.type && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Tipo</span>
                    <span className={styles.infoVal}>{tk.type}</span>
                  </div>
                )}
                {tk.format && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Formato</span>
                    <span className={styles.infoVal}>{tk.format}{tk.language ? ` · ${tk.language}` : ''}</span>
                  </div>
                )}
              </div>

              {/* QR */}
              <div className={styles.qrWrap}>
                <div className={styles.qrBox}>
                  <QRCodeSVG
                    value={tk.qrValue}
                    size={130}
                    bgColor="transparent"
                    fgColor="var(--text-1)"
                    level="M"
                  />
                </div>
                <p className={styles.qrHint}>Muestra este código en la entrada del cine</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.moreBtn} onClick={() => navigate('/shop')}>
          <Film size={15} aria-hidden="true" /> Ver más películas
        </button>
      </div>
    </div>
  );
}
