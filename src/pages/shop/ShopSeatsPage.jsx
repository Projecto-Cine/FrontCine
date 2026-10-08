import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Film, ArrowLeft, ChevronRight, User, Mail, Lock,
  CreditCard, CheckCircle, Loader, UserPlus, Star, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { sessionsService } from '../../services/sessionsService';
import { shopApi }         from '../../services/shopApi';
import { useShopAuth }     from '../../contexts/ShopAuthContext';
import SeatMap             from '../../components/shared/SeatMap';
import StripePaymentModal  from '../../components/shared/StripePaymentModal';
import styles              from './ShopSeatsPage.module.css';

const TICKET_TYPES = [
  { id: 'adult',   label: 'Adulto',      price: 9.00,  backendType: 'ADULT'   },
  { id: 'student', label: 'Estudiante',   price: 6.00,  backendType: 'STUDENT' },
  { id: 'senior',  label: 'Senior',       price: 6.00,  backendType: 'SENIOR'  },
  { id: 'child',   label: 'Infantil',     price: 6.00,  backendType: 'CHILD'   },
];
const VIP_EXTRA = 1.00;

const FORMAT_COLOR = { IMAX: 'var(--purple)', '4DX': 'var(--red)', '3D': 'var(--cyan)' };

function generateTicketId() {
  return 'TK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();
}

// ── Auth panel ────────────────────────────────────────────────────────────
function AuthPanel({ onLogin, onRegister, error, loading }) {
  const [mode, setMode]     = useState('guest'); // guest | login | register
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [showPw, setShowPw] = useState(false);
  // birthDate, no dateOfBirth: es el nombre que espera el backend. Con el
  // anterior la fecha se perdia, y de ella depende el control de calificacion
  // por edad al comprar entradas.
  const [form, setForm]     = useState({ name: '', lastName: '', email: '', password: '', birthDate: '' });

  return (
    <div className={styles.authPanel}>
      <div className={styles.authTabs}>
        <button className={`${styles.authTab} ${mode === 'guest' ? styles.authTabActive : ''}`} onClick={() => setMode('guest')}>
          <Mail size={13} aria-hidden="true" /> Invitado
        </button>
        <button className={`${styles.authTab} ${mode === 'login' ? styles.authTabActive : ''}`} onClick={() => setMode('login')}>
          <User size={13} aria-hidden="true" /> Soy socio
        </button>
        <button className={`${styles.authTab} ${mode === 'register' ? styles.authTabActive : ''}`} onClick={() => setMode('register')}>
          <UserPlus size={13} aria-hidden="true" /> Registrarme
        </button>
      </div>

      {error && <div className={styles.authError}><AlertCircle size={13} aria-hidden="true" />{error}</div>}

      {mode === 'guest' && (
        <div className={styles.guestHint}>
          <Mail size={14} aria-hidden="true" />
          <p>Introduce tu email más abajo para recibir tu ticket por correo.</p>
        </div>
      )}

      {mode === 'login' && (
        <form className={styles.authForm} onSubmit={e => { e.preventDefault(); onLogin(email, pass); }}>
          <input
            className={styles.authInput}
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required autoComplete="email"
          />
          <div className={styles.passWrap}>
            <input
              className={styles.authInput}
              type={showPw ? 'text' : 'password'}
              placeholder="Contraseña" value={pass}
              onChange={e => setPass(e.target.value)} required autoComplete="current-password"
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Ocultar' : 'Mostrar'}>
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button type="submit" className={styles.authSubmit} disabled={loading}>
            {loading ? <Loader size={14} className={styles.spin} aria-hidden="true" /> : <><User size={14} aria-hidden="true" /> Iniciar sesión</>}
          </button>
        </form>
      )}

      {mode === 'register' && (
        <form className={styles.authForm} onSubmit={e => { e.preventDefault(); onRegister(form); }}>
          <div className={styles.formRow}>
            <input className={styles.authInput} type="text" placeholder="Nombre *" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input className={styles.authInput} type="text" placeholder="Apellidos *" value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
          </div>
          <input className={styles.authInput} type="email" placeholder="Email *" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoComplete="email" />
          <div className={styles.passWrap}>
            <input className={styles.authInput}
              type={showPw ? 'text' : 'password'}
              placeholder="Contraseña *" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required autoComplete="new-password" />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Ocultar' : 'Mostrar'}>
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <label className={styles.authLabel} htmlFor="shop-birthdate">Fecha de nacimiento *</label>
          <input className={styles.authInput} id="shop-birthdate" type="date" required
            max={new Date().toISOString().split('T')[0]}
            aria-describedby="shop-birthdate-hint"
            value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
          <span className={styles.authHint} id="shop-birthdate-hint">
            La pedimos para aplicar la calificación por edad de cada película.
          </span>
          <button type="submit" className={styles.authSubmit} disabled={loading}>
            {loading ? <Loader size={14} className={styles.spin} aria-hidden="true" /> : <><Star size={14} aria-hidden="true" /> Crear cuenta de socio</>}
          </button>
        </form>
      )}
    </div>
  );
}

/**
 * Traduce un fallo de la API a algo que el cliente pueda accionar. Estaba
 * incrustado en el catch de handlePay; al partir el flujo en dos fases se
 * extrae para que ambas lo compartan.
 */
function describePurchaseError(err) {
  const raw = err?.message ?? '';
  const lower = raw.toLowerCase();
  const status = err?.status ?? null;

  if (status === 400 && (lower.includes('ended') || lower.includes('finaliz'))) {
    return 'Esta sesión ya ha finalizado. Vuelve a la cartelera.';
  }
  if (status === 400) {
    return err?.body?.message ?? 'El servidor rechazó la compra. Revisa los datos.';
  }
  if (status === 409) {
    return 'Una de las butacas ya no está disponible. Vuelve al mapa y elige otras.';
  }
  if (status === 422) {
    const jsonText = raw.replace(/^API \d+ [^:]+:\s*/, '').trim();
    let message;
    try { message = JSON.parse(jsonText)?.message; } catch { message = jsonText.slice(0, 120); }
    return message || 'Compra rechazada por el servidor. Revisa el tipo de entrada.';
  }
  if (status === 429) {
    return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
  }
  if (!status) {
    return 'Sin conexión con el servidor. Comprueba tu red e inténtalo de nuevo.';
  }
  return `Error ${status}: no se pudo procesar la compra.`;
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function ShopSeatsPage() {
  const { screeningId } = useParams();
  const navigate        = useNavigate();
  const location        = useLocation();
  const { shopUser, login, register, error: authError, setError: setAuthError } = useShopAuth();

  const [screening, setScreening]     = useState(location.state?.screening ?? null);
  const [realSeats, setRealSeats]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatTypes, setSeatTypes]     = useState({});   // seatId → ticketType id
  const [globalType, setGlobalType]   = useState('adult');
  const [guestEmail, setGuestEmail]   = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  // Datos que devuelve el backend al abrir el pago. Mientras no sea null,
  // se muestra el modal de Stripe.
  const [paymentSession, setPaymentSession] = useState(null);
  const [paying, setPaying]           = useState(false);
  const [payError, setPayError]       = useState('');
  const [step, setStep]               = useState('seats'); // seats | checkout | done
  const [tickets, setTickets]         = useState([]);

  // Load screening details and seats
  useEffect(() => {
    setLoading(true);
    const loadAll = async () => {
      try {
        if (!screening) {
          const s = await sessionsService.getById(screeningId);
          setScreening(s);
        }
        // Antes se llamaba a syncSeats, que es una operacion de gestion:
        // un visitante provocaba una escritura pensada para el panel. El
        // endpoint publico materializa el mapa si aun no existe.
        const raw = await sessionsService.getSeats(screeningId);
        const arr = Array.isArray(raw) ? raw
          : Array.isArray(raw?.content) ? raw.content
          : Array.isArray(raw?.data)    ? raw.data
          : Array.isArray(raw?.seats)   ? raw.seats
          : [];
        const seen = new Set();
        const normalized = [];
        for (const ss of arr) {
          if (ss?.id == null) continue;
          const seatObj = ss.seat ?? ss;
          const row     = ss.row    ?? seatObj.row;
          const number  = ss.number ?? seatObj.number ?? seatObj.seatNumber ?? seatObj.col;
          if (!row || number == null) continue;
          const displayId = `${String(row).toUpperCase()}${String(number).padStart(2, '0')}`;
          if (seen.has(displayId)) continue;
          seen.add(displayId);
          normalized.push({
            id: displayId,
            row: String(row).toUpperCase(),
            number,
            status: (ss.status ?? '').toLowerCase() === 'available' ? 'available' : 'occupied',
            seatType: ss.seatType ?? seatObj.seatType ?? 'STANDARD',
            screeningSeatId: ss.id,
          });
        }
        setRealSeats(normalized);
      } catch {
        // fall back to location.state screening, no seat map
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [screeningId]);

  const handleSeatToggle = useCallback((newSeats) => {
    setSeatTypes(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(s => { if (!newSeats.includes(s)) delete next[s]; });
      newSeats.forEach(s => { if (!(s in next)) next[s] = globalType; });
      return next;
    });
    setSelectedSeats(newSeats);
  }, [globalType]);

  // Price calculation
  const total = useMemo(() => {
    return selectedSeats.reduce((sum, seatId) => {
      const typeId = seatTypes[seatId] || globalType;
      const type   = TICKET_TYPES.find(t => t.id === typeId) || TICKET_TYPES[0];
      const seat   = realSeats.find(s => s.id === seatId);
      const isVip  = (seat?.seatType ?? '').toUpperCase() === 'VIP';
      return sum + type.price + (isVip ? VIP_EXTRA : 0);
    }, 0);
  }, [selectedSeats, seatTypes, globalType, realSeats]);

  const movie   = screening?.movie ?? screening?.film ?? null;
  const theater = screening?.theater ?? screening?.room ?? null;
  const startTime = screening?.startTime ?? screening?.dateTime ?? null;
  const time    = startTime?.split('T')[1]?.substring(0, 5) ?? '--:--';
  const date    = startTime?.split('T')[0] ?? '';

  // Auth handlers
  const handleLogin = async (email, pass) => {
    setAuthLoading(true);
    setAuthError('');
    await login(email, pass);
    setAuthLoading(false);
  };

  const handleRegister = async (formData) => {
    setAuthLoading(true);
    setAuthError('');
    await register(formData);
    setAuthLoading(false);
  };

  // Pay
  const handlePay = async () => {
    setPayError('');
    if (!selectedSeats.length) { setPayError('Selecciona al menos una butaca.'); return; }

    // Validate email for guests
    const email = shopUser?.email || guestEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setPayError('Introduce un email válido para recibir tu ticket.');
      return;
    }

    // Guard: screening ended?
    if (startTime) {
      const durationMin = movie?.durationMin ?? null;
      const endTime = durationMin
        ? new Date(new Date(startTime).getTime() + durationMin * 60 * 1000)
        : null;
      if (endTime && Date.now() > endTime.getTime()) {
        setPayError('Esta sesión ya ha finalizado. Vuelve a la cartelera y elige otra sesión.');
        return;
      }
    }

    setPaying(true);
    try {
      const screeningSeatIds = selectedSeats
        .map(seatStr => realSeats.find(s => s.id === seatStr)?.screeningSeatId)
        .filter(Boolean);

      if (!screeningSeatIds.length) {
        setPayError('No se encontraron las butacas seleccionadas. Vuelve al mapa e inténtalo de nuevo.');
        setPaying(false);
        return;
      }

      const body = {
        screeningId: Number(screeningId),
        paymentMethod: 'CARD',
        tickets: screeningSeatIds.map(screeningSeatId => {
          const seat   = realSeats.find(s => s.screeningSeatId === screeningSeatId);
          const typeId = seat ? (seatTypes[seat.id] || globalType) : globalType;
          const type   = TICKET_TYPES.find(t => t.id === typeId) || TICKET_TYPES[0];
          return { screeningSeatId, ticketType: type.backendType };
        }),
      };

      if (shopUser?.id) {
        body.userId = shopUser.id;
      } else {
        body.guestEmail = email;
      }

      const purchase = await shopApi.post('/purchases', body);

      if (!purchase?.id) {
        setPayError('El servidor no devolvió la compra. Inténtalo de nuevo.');
        setPaying(false);
        return;
      }

      /*
       * Aquí se llamaba a /purchases/{id}/confirm, que marca la compra como
       * pagada sin cobrar nada: es la vía del mostrador, donde el cajero ya
       * tiene el dinero. Por internet hay que pasar por la pasarela.
       *
       * El importe no se envía: lo calcula el servidor a partir de la compra.
       */
      const intent = await shopApi.post('/payments/intent', {
        purchaseId: purchase.id,
        currency: 'EUR',
      });

      if (!intent?.clientSecret || !intent?.publishableKey) {
        setPayError('No se pudo iniciar el pago. Inténtalo de nuevo.');
        setPaying(false);
        return;
      }

      setPaymentSession({
        clientSecret: intent.clientSecret,
        publishableKey: intent.publishableKey,
        purchase,
        email,
      });
      setPaying(false);
      return;
    } catch (err) {
      setPayError(describePurchaseError(err));
      setPaying(false);
    }
  };

  /**
   * Stripe ya confirmó el cobro. La compra la completa el webhook en el
   * servidor — reserva de butacas, descuento de socio y correo — así que aquí
   * solo queda llevar al cliente a su confirmación.
   */
  const handlePaymentSuccess = () => {
    const session = paymentSession;
    setPaymentSession(null);
    if (!session) return;
    navigate('/shop/confirm', {
      state: {
        tickets: buildTickets(session.purchase, session.email),
        purchaseId: session.purchase.id,
        email: session.email,
      },
    });
  };

  /**
   * El cliente cerró el pago. La compra se queda pendiente: no se toca, porque
   * puede volver a intentarlo, y si el pago falla de verdad el webhook la
   * cancela.
   */
  const handlePaymentCancel = () => {
    setPaymentSession(null);
    setPayError('Pago cancelado. Tus butacas siguen seleccionadas si quieres volver a intentarlo.');
  };

  // Entradas que se muestran en la pantalla de confirmación.
  const buildTickets = (purchase, email) => {
      const generated = (purchase?.tickets?.length > 0 ? purchase.tickets : []).map(tk => {
        const seatStr = `${tk.row}${String(tk.number).padStart(2, '0')}`;
        const qrValue = `LUMEN:${purchase.id}-${tk.id}|${movie?.title}|${theater?.name}|${date}|${time}|${seatStr}|${tk.ticketType}`;
        return {
          id:        `${purchase.id}-${tk.id}`,
          purchaseId: purchase.id,
          movie:     movie?.title,
          room:      theater?.name,
          date, time, seat: seatStr,
          format:    movie?.format,
          language:  movie?.language,
          type:      tk.ticketType,
          email,
          qrValue,
        };
      });

      // Fallback if backend didn't return tickets
      const finalTickets = generated.length > 0 ? generated : selectedSeats.map(seat => {
        const localId = generateTicketId();
        const typeId  = seatTypes[seat] || globalType;
        const type    = TICKET_TYPES.find(t => t.id === typeId) || TICKET_TYPES[0];
        const qrValue = `LUMEN:${localId}|${movie?.title}|${theater?.name}|${date}|${time}|${seat}|${type.backendType}`;
        return { id: localId, purchaseId: purchase?.id, movie: movie?.title, room: theater?.name, date, time, seat, format: movie?.format, language: movie?.language, type: type.backendType, email, qrValue };
      });

      return finalTickets;
  };

  if (loading) {
    return (
      <div className={styles.centerLoader}>
        <Loader size={24} className={styles.spin} aria-hidden="true" />
        <span>Cargando sesión...</span>
      </div>
    );
  }

  // ── Step: seats ──────────────────────────────────────────────────────────
  if (step === 'seats') {
    return (
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => navigate('/shop')} aria-label="Volver">
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <div className={styles.topInfo}>
            <span className={styles.topMovie}>{movie?.title ?? 'Sesión'}</span>
            <span className={styles.topMeta}>{date} · {time} · {theater?.name?.split('—')[0].trim()}</span>
          </div>
          {movie?.format && (
            <span className={styles.fmtBadge} style={{ color: FORMAT_COLOR[movie.format] ?? 'var(--text-3)' }}>
              {movie.format}
            </span>
          )}
        </div>

        {/* Seat map */}
        <div className={styles.mapSection}>
          <div className={styles.mapHint}>Selecciona hasta 10 butacas</div>
          {realSeats.length > 0 ? (
            <SeatMap
              session={{ id: Number(screeningId), sold: 0 }}
              room={{ capacity: 100 }}
              seats={realSeats}
              selectedSeats={selectedSeats}
              onToggle={handleSeatToggle}
              maxSelect={10}
            />
          ) : (
            <div className={styles.noMap}>
              <Film size={32} aria-hidden="true" />
              <p>No se pudo cargar el mapa de butacas.</p>
            </div>
          )}
        </div>

        {/* Ticket type global selector */}
        {selectedSeats.length > 0 && (
          <div className={styles.typeSection}>
            <p className={styles.typeTitle}>Tipo de entrada</p>
            <div className={styles.typeRow}>
              {TICKET_TYPES.map(tt => (
                <button
                  key={tt.id}
                  className={`${styles.typeBtn} ${globalType === tt.id ? styles.typeBtnActive : ''}`}
                  onClick={() => {
                    setGlobalType(tt.id);
                    setSeatTypes(prev => {
                      const next = { ...prev };
                      selectedSeats.forEach(s => { next[s] = tt.id; });
                      return next;
                    });
                  }}
                >
                  <span className={styles.typeLabel}>{tt.label}</span>
                  <span className={styles.typePrice}>€{tt.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sticky footer with total + CTA */}
        {selectedSeats.length > 0 && (
          <div className={styles.stickyFooter}>
            <div className={styles.footerTotal}>
              <span className={styles.footerSeats}>{selectedSeats.length} entrada{selectedSeats.length !== 1 ? 's' : ''}</span>
              <span className={styles.footerPrice}>€{total.toFixed(2)}</span>
            </div>
            <button className={styles.ctaBtn} onClick={() => setStep('checkout')}>
              Continuar <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Step: checkout ───────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => setStep('seats')} aria-label="Volver">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <div className={styles.topInfo}>
          <span className={styles.topMovie}>Confirmar compra</span>
          <span className={styles.topMeta}>{movie?.title} · {time}</span>
        </div>
      </div>

      {/* Order summary */}
      <div className={styles.summaryCard}>
        <h3 className={styles.summaryTitle}>Resumen</h3>
        {selectedSeats.map(seatId => {
          const typeId = seatTypes[seatId] || globalType;
          const type   = TICKET_TYPES.find(t => t.id === typeId) || TICKET_TYPES[0];
          const seat   = realSeats.find(s => s.id === seatId);
          const isVip  = (seat?.seatType ?? '').toUpperCase() === 'VIP';
          return (
            <div key={seatId} className={styles.summaryRow}>
              <span className={styles.summaryLeft}>
                Butaca {seatId} {isVip && <span className={styles.vipTag}>VIP</span>}
                <span className={styles.summaryType}>{type.label}</span>
              </span>
              <span className={styles.summaryPrice}>€{(type.price + (isVip ? VIP_EXTRA : 0)).toFixed(2)}</span>
            </div>
          );
        })}
        <div className={styles.summaryDivider} />
        <div className={`${styles.summaryRow} ${styles.summaryTotalRow}`}>
          <span>Total</span>
          <span className={styles.totalAmount}>€{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Identity */}
      {shopUser ? (
        <div className={styles.identityCard}>
          <CheckCircle size={16} className={styles.identityIcon} aria-hidden="true" />
          <div>
            <p className={styles.identityName}>{shopUser.name} {shopUser.lastName ?? ''}</p>
            <p className={styles.identityEmail}>{shopUser.email}</p>
            {shopUser.isFidelityMember && <span className={styles.fidelityBadge}><Star size={11} aria-hidden="true" />Socio fidelidad</span>}
          </div>
        </div>
      ) : (
        <>
          <AuthPanel
            onLogin={handleLogin}
            onRegister={handleRegister}
            error={authError}
            loading={authLoading}
          />
          {/* Guest email field (always visible) */}
          <div className={styles.guestEmailSection}>
            <label className={styles.emailLabel} htmlFor="guest-email">
              <Mail size={13} aria-hidden="true" />
              Email para recibir el ticket
            </label>
            <input
              id="guest-email"
              className={styles.emailInput}
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={guestEmail}
              onChange={e => setGuestEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </>
      )}

      {/* Payment method info */}
      <div className={styles.payMethodCard}>
        <CreditCard size={16} className={styles.payIcon} aria-hidden="true" />
        <div>
          <p className={styles.payMethodTitle}>Pago con tarjeta</p>
          <p className={styles.payMethodSub}>Transacción segura procesada por el servidor</p>
        </div>
      </div>

      {payError && (
        <div className={styles.payError}>
          <AlertCircle size={14} aria-hidden="true" />
          {payError}
        </div>
      )}

      <button className={styles.payBtn} onClick={handlePay} disabled={paying} aria-busy={paying}>
        {paying
          ? <><Loader size={16} className={styles.spin} aria-hidden="true" /> Procesando...</>
          : <><CreditCard size={16} aria-hidden="true" /> Pagar €{total.toFixed(2)}</>
        }
      </button>

      {/*
        El componente existía pero ninguna página lo montaba: la pasarela
        estaba construida en el backend y nunca se invocaba desde la interfaz.
        El importe que se muestra es informativo; el que se cobra lo calcula el
        servidor a partir de la compra.
      */}
      {paymentSession && (
        <StripePaymentModal
          clientSecret={paymentSession.clientSecret}
          publishableKey={paymentSession.publishableKey}
          amount={total}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}
