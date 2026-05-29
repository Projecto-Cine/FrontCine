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
  const [form, setForm]     = useState({ name: '', lastName: '', email: '', password: '', dateOfBirth: '' });

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
          <input className={styles.authInput} type="date" placeholder="Fecha de nacimiento"
            value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
          <button type="submit" className={styles.authSubmit} disabled={loading}>
            {loading ? <Loader size={14} className={styles.spin} aria-hidden="true" /> : <><Star size={14} aria-hidden="true" /> Crear cuenta de socio</>}
          </button>
        </form>
      )}
    </div>
  );
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
        const raw = await sessionsService.syncSeats(screeningId);
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

      let confirmed = null;
      if (purchase?.id) {
        try { confirmed = await shopApi.post(`/purchases/${purchase.id}/confirm`, {}); } catch { /* best-effort */ }
      }

      // Build ticket list for confirmation screen
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

      navigate('/shop/confirm', {
        state: {
          tickets: finalTickets,
          purchaseId: purchase?.id,
          email,
          discountApplied: confirmed?.discountApplied,
          discountAmount: confirmed?.discountAmount,
        },
      });
    } catch (err) {
      const rawBody   = err?.message ?? '';
      const rawLower  = rawBody.toLowerCase();
      const status    = err?.status ?? null;
      let msg;
      if (status === 400 && (rawLower.includes('ended') || rawLower.includes('finaliz'))) {
        msg = 'Esta sesión ya ha finalizado. Vuelve a la cartelera.';
      } else if (status === 409) {
        msg = 'Una de las butacas ya no está disponible. Vuelve al mapa y elige otras.';
      } else if (status === 422) {
        const jsonText = rawBody.replace(/^API \d+ [^:]+:\s*/, '').trim();
        let bMsg = '';
        try { bMsg = JSON.parse(jsonText)?.message ?? ''; } catch { bMsg = jsonText.slice(0, 120); }
        msg = bMsg || 'Compra rechazada por el servidor. Revisa el tipo de entrada.';
      } else if (!status) {
        msg = 'Sin conexión con el servidor. Comprueba tu red e inténtalo de nuevo.';
      } else {
        msg = `Error ${status}: no se pudo procesar la compra.`;
      }
      setPayError(msg);
    } finally {
      setPaying(false);
    }
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
    </div>
  );
}
