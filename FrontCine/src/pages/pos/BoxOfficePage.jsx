import { useState, useCallback, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Film, ChevronRight, Minus, Plus,
  CreditCard, Banknote, Smartphone, Printer,
  CheckCircle, X, Ticket, ArrowLeft, Search,
  LayoutGrid, List, Loader, Star, UserX
} from 'lucide-react';
import { sessionsService } from '../../services/sessionsService';
import { seatsService }    from '../../services/seatsService';
import { salesService }    from '../../services/salesService';
import { clientsService }  from '../../services/clientsService';
import { useApp }  from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
<<<<<<< HEAD
import Badge                from '../../components/ui/Badge';
import SeatMap              from '../../components/shared/SeatMap';
import StripePaymentModal   from '../../components/shared/StripePaymentModal';
import styles               from './BoxOfficePage.module.css';
=======
import { useLanguage } from '../../i18n/LanguageContext';
import Badge    from '../../components/ui/Badge';
import SeatMap  from '../../components/shared/SeatMap';
import styles   from './BoxOfficePage.module.css';
>>>>>>> b80d8bd (feat(i18n): traducción completa de todas las páginas y componentes)

const TICKET_TYPES = [
  { id: 'adult',    price: 13.50, backendType: 'ADULT'   },
  { id: 'senior',   price: 9.00,  backendType: 'SENIOR'  },
  { id: 'student',  price: 6.00,  backendType: 'STUDENT' },
  { id: 'child',    price: 6.00,  backendType: 'CHILD'   },
  { id: 'imax',     price: 5.00,  extra: true },
  { id: '4dx',      price: 6.50,  extra: true },
  { id: 'vip',      price: 8.00,  extra: true },
];

const PAY_METHOD_MAP = { card: 'CARD', cash: 'CASH', online: 'QR' };

const FORMAT_BADGE = { IMAX: 'purple', '4DX': 'red', '3D': 'cyan', '2D': 'default', VIP: 'yellow', 'IMAX 3D': 'purple', '2D/3D': 'cyan' };

const MOV_IMG_KEY = 'lumen_movie_posters';
const getStoredPosters = () => { try { return JSON.parse(localStorage.getItem(MOV_IMG_KEY) ?? '{}'); } catch { return {}; } };
const mergeSessionPosters = (sessions) => {
  const s = getStoredPosters();
  return sessions.map(sess => {
    if (!sess.movie) return sess;
    const imgUrl = s[String(sess.movie.id)] || sess.movie.imageUrl || sess.movie.poster || '';
    return imgUrl ? { ...sess, movie: { ...sess.movie, imageUrl: imgUrl } } : sess;
  });
};
const OCC_COLOR = (pct) => pct >= 95 ? 'var(--red)' : pct >= 80 ? 'var(--yellow)' : 'var(--green)';

const GENRE_GRADIENT = {
  'Ciencia ficción': 'linear-gradient(145deg, #071828 0%, #0e3252 100%)',
  'Drama':           'linear-gradient(145deg, #150d22 0%, #321860 100%)',
  'Animación':       'linear-gradient(145deg, #0a1e0c 0%, #173d1a 100%)',
  'Terror':          'linear-gradient(145deg, #1a0606 0%, #3d0d0d 100%)',
  'Acción':          'linear-gradient(145deg, #180c04 0%, #3d1a06 100%)',
  'Fantasía':        'linear-gradient(145deg, #0a0818 0%, #1e1440 100%)',
};
const DEFAULT_GRADIENT = 'linear-gradient(145deg, #161008 0%, #2a1e10 100%)';

function getInitials(title = '') {
  const words = title.split(' ').filter(w => w.length > 2);
  return (words.slice(0, 2).map(w => w[0]).join('') || title.slice(0, 2)).toUpperCase();
}

function generateTicketId() {
  return 'TKT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

export default function TaquillaPage() {
  const { toast } = useApp();
  const { user }  = useAuth();
  const { t } = useLanguage();

  const [step, setStep]                   = useState('sessions');
  const [sessions, setSessions]           = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [realSeats, setRealSeats]         = useState(null);
  const [loadingSeats, setLoadingSeats]   = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [ticketType, setTicketType]       = useState('adult');
  const [payMethod, setPayMethod]         = useState('card');
  const [cashGiven, setCashGiven]         = useState('');
  const [tickets, setTickets]             = useState([]);
  const [paying, setPaying]               = useState(false);
  const [stripeData, setStripeData]       = useState(null); // { clientSecret, publishableKey, purchaseId }
  const pendingTickets                    = useRef(null);   // tickets generados antes del pago online
  const [searchQuery, setSearchQuery]     = useState('');
  const [viewMode, setViewMode]           = useState('grid');
  const [clientQuery, setClientQuery]     = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [clientSearching, setClientSearching] = useState(false);
  const [selectedClient, setSelectedClient]   = useState(null);
  const clientDebounce = useRef(null);

  // Translated ticket types (computed in render so they react to language changes)
  const ticketTypes = TICKET_TYPES.map(tt => ({ ...tt, label: t(`box_office.type.${tt.id}`) }));

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    sessionsService.getAll({ date: today })
      .then(data => setSessions(mergeSessionPosters(Array.isArray(data) ? data.filter(s => s.status !== 'CANCELLED') : [])))
      .catch(() => toast('Error al cargar sesiones.', 'error'))
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => {
    clearTimeout(clientDebounce.current);
    if (!clientQuery.trim()) { setClientResults([]); return; }
    clientDebounce.current = setTimeout(async () => {
      setClientSearching(true);
      try {
        const data = await clientsService.search(clientQuery);
        setClientResults(Array.isArray(data) ? data : (data?.content ?? []));
      } catch { setClientResults([]); }
      setClientSearching(false);
    }, 350);
    return () => clearTimeout(clientDebounce.current);
  }, [clientQuery]);

  const filteredSessions = sessions.filter(s => {
    if (!searchQuery) return true;
    return s.movie?.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectSession = async (session) => {
    setSelectedSession(session);
    setSelectedSeats([]);
    setRealSeats(null);
    setStep('seats');
    setLoadingSeats(true);
    try {
      const seats = await seatsService.getByScreening(session.id);
      setRealSeats(Array.isArray(seats) ? seats : null);
    } catch {
      setRealSeats(null);
    } finally {
      setLoadingSeats(false);
    }
  };

  const movie   = selectedSession?.movie ?? null;
  const theater = selectedSession?.theater ?? null;

  const seatMapSession = selectedSession ? {
    id:   selectedSession.id,
    sold: realSeats
      ? realSeats.filter(s => s.status === 'occupied' || s.status === 'reserved').length
      : 0,
  } : null;
  const seatMapRoom = theater ? {
    capacity: theater.capacity ?? 100,
    format:   movie?.format ?? '',
    name:     theater.name ?? '',
  } : null;

  const baseType       = ticketTypes.find(t => t.id === ticketType) || ticketTypes[0];
  const basePrice      = baseType.price;
  const extra          = ticketTypes.filter(t => t.extra).find(t => {
    if (!theater) return false;
    const fmt = (movie?.format ?? theater?.name ?? '').toUpperCase();
    if (t.id === 'imax') return fmt.includes('IMAX');
    if (t.id === '4dx')  return fmt.includes('4DX');
    if (t.id === 'vip')  return (theater?.name ?? '').toLowerCase().includes('vip');
    return false;
  });
  const fidelityEligible = !!(selectedClient?.fidelityDiscountEligible && ticketType === 'adult');
  const discountedBase   = fidelityEligible ? +(basePrice * 0.9).toFixed(2) : basePrice;
  const totalPerTicket   = discountedBase + (extra?.price ?? 0);
  const total            = totalPerTicket * selectedSeats.length;
  const change           = cashGiven && payMethod === 'cash' ? (parseFloat(cashGiven) - total).toFixed(2) : null;

  const buildTickets = useCallback((res, seats) => {
    const time = selectedSession.dateTime?.split('T')[1]?.substring(0, 5) ?? '';
    const date = selectedSession.dateTime?.split('T')[0] ?? '';
    return seats.map((seat, i) => {
      const qrValue = res?.qrCodes?.[i]
        ?? `LUMEN:${generateTicketId()}|${movie?.title}|${theater?.name}|${date}|${time}|${seat}|${baseType.backendType ?? 'ADULT'}`;
      const parts = qrValue.replace('LUMEN:', '').split('|');
      return {
        id:       parts[0] ?? generateTicketId(),
        movie:    parts[1] ?? movie?.title,
        room:     parts[2] ?? theater?.name,
        date:     parts[3] ?? date,
        time:     parts[4] ?? time,
        seat:     parts[5] ?? seat,
        format:   movie?.format,
        language: movie?.language,
        qrValue,
      };
    });
  }, [selectedSession, movie, theater, baseType]);

  const handlePay = useCallback(async () => {
    if (!selectedSeats.length) { toast('Selecciona al menos una butaca.', 'error'); return; }
    setPaying(true);

    const labelOf = (s) => `${s.row}${String(s.number).padStart(2, '0')}`;
    const resolvedSeatIds = realSeats
      ? selectedSeats.map(label => realSeats.find(s => labelOf(s) === label)?.id ?? label)
      : selectedSeats;

    try {
      const res = await salesService.createTicketSale({
        screeningId:   selectedSession.id,
        seats:         resolvedSeatIds,
        ticketType:    baseType.backendType ?? 'ADULT',
        unitPrice:     discountedBase,
        surcharge:     extra?.price ?? 0,
        total,
        paymentMethod: PAY_METHOD_MAP[payMethod] ?? 'CARD',
        cashierId:     user?.id ?? null,
        userId:        selectedClient?.id ?? null,
      });

      // Pago online → abrir modal de Stripe
      if (payMethod === 'online') {
        const intent = await salesService.createPaymentIntent(res.id, total);
        pendingTickets.current = { res, seats: selectedSeats };
        setStripeData({
          clientSecret:   intent.clientSecret,
          publishableKey: intent.publishableKey,
          purchaseId:     res.id,
        });
        return; // esperar confirmación Stripe — no avanzar todavía
      }

<<<<<<< HEAD
      setTickets(buildTickets(res, selectedSeats));
=======
      const generated = selectedSeats.map((seat, i) => {
        const qrValue = res?.qrCodes?.[i]
          ?? `LUMEN:${generateTicketId()}|${movie?.title}|${theater?.name}|${date}|${time}|${seat}|${baseType.backendType ?? 'ADULT'}`;
        const parts = qrValue.replace('LUMEN:', '').split('|');
        return {
          id:       parts[0] ?? generateTicketId(),
          movie:    parts[1] ?? movie?.title,
          room:     parts[2] ?? theater?.name,
          date:     parts[3] ?? date,
          time:     parts[4] ?? time,
          seat:     parts[5] ?? seat,
          format:   movie?.format,
          language: movie?.language,
          qrValue,
        };
      });
      setTickets(generated);
>>>>>>> b80d8bd (feat(i18n): traducción completa de todas las páginas y componentes)
      setStep('done');
    } catch {
      toast('Error al procesar el cobro. Inténtalo de nuevo.', 'error');
    } finally {
      setPaying(false);
    }
  }, [selectedSeats, realSeats, selectedSession, baseType, extra, discountedBase, total, payMethod, user, selectedClient, toast, buildTickets]);

  const handleStripeSuccess = useCallback(async () => {
    try {
      await salesService.confirmPurchaseAfterStripe(stripeData.purchaseId);
    } catch { /* webhook ya lo confirma en el backend */ }
    const { res, seats } = pendingTickets.current;
    setTickets(buildTickets(res, seats));
    setStripeData(null);
    pendingTickets.current = null;
    setStep('done');
  }, [stripeData, buildTickets]);

  const handleStripeCancel = useCallback(async () => {
    try {
      await salesService.cancelPurchase(stripeData.purchaseId);
    } catch { /* ignorar si falla la cancelación */ }
    setStripeData(null);
    pendingTickets.current = null;
    setPaying(false);
  }, [stripeData]);

  const reset = () => {
    setStep('sessions');
    setSelectedSession(null);
    setRealSeats(null);
    setSelectedSeats([]);
    setPayMethod('card');
    setCashGiven('');
    setTickets([]);
    setSearchQuery('');
    setClientQuery('');
    setClientResults([]);
    setSelectedClient(null);
  };

  if (step === 'done') {
    return <TicketSuccess tickets={tickets} total={total} payMethod={payMethod} onReset={reset} t={t} />;
  }

  return (
    <div className={styles.shell}>
      {/* ── LEFT ─────────────────────────────────── */}
      <div className={styles.left}>

        {/* STEP: sessions */}
        {step === 'sessions' && (
          <>
            <div className={styles.leftHeader}>
              <h2 className={styles.leftTitle}>{t('box_office.title')}</h2>
              <div className={styles.headerRight}>
                <div className={styles.searchBox}>
                  <Search size={12} className={styles.searchIcon} />
                  <input className={styles.searchInput} placeholder={t('box_office.search')}
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className={styles.viewToggle}>
                  <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={13} /></button>
                  <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`} onClick={() => setViewMode('list')}><List size={13} /></button>
                </div>
              </div>
            </div>

            {loadingSessions ? (
              <div className={styles.emptyMsg}><Loader size={16} /> {t('box_office.loading')}</div>
            ) : (
              <div className={`${styles.sessionGrid} ${viewMode === 'list' ? styles.sessionList : ''}`}>
                {filteredSessions.map(s => {
                  const mv      = s.movie   ?? {};
                  const rm      = s.theater ?? {};
                  const isFull  = s.status === 'FULL';
                  const soldCnt = s.soldCount ?? s.sold ?? 0;
                  const cap     = rm.capacity ?? 1;
                  const occPct  = Math.round((soldCnt / cap) * 100);
                  const avail   = cap - soldCnt;
                  const time    = s.dateTime?.split('T')[1]?.substring(0, 5) ?? '';

                  return (
                    <button
                      key={s.id}
                      className={`${styles.sessionCard} ${isFull ? styles.sessionFull : ''} ${viewMode === 'list' ? styles.sessionCardList : ''}`}
                      onClick={() => !isFull && selectSession(s)}
                      disabled={isFull}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <div className={styles.sessionPoster} style={mv.imageUrl ? {} : { background: GENRE_GRADIENT[mv.genre] || DEFAULT_GRADIENT }}>
                            {mv.imageUrl
                              ? <img src={mv.imageUrl} alt={mv.title} className={styles.sessionPosterImg} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.style.background = GENRE_GRADIENT[mv.genre] || DEFAULT_GRADIENT; }} />
                              : <span className={styles.sessionPosterInitials}>{getInitials(mv.title)}</span>
                            }
                            <div className={styles.sessionPosterBadges}>
                              <Badge variant={FORMAT_BADGE[mv.format] || 'default'}>{mv.format}</Badge>
                              <Badge variant="default">{mv.language}</Badge>
                            </div>
                            {isFull && <div className={styles.posterFullOverlay}>{t('box_office.full')}</div>}
                          </div>
                          <div className={styles.sessionCardBody}>
                            <div className={styles.sessionTime}>{time}</div>
                            <div className={styles.sessionMovie}>{mv.title}</div>
                            <div className={styles.sessionRoom}>{rm.name?.split('—')[0]?.trim()}</div>
                            {soldCnt > 0 && (
                              <div className={styles.sessionOcc}>
                                <div className={styles.occBar}>
                                  <div className={styles.occFill} style={{ width: `${occPct}%`, background: OCC_COLOR(occPct) }} />
                                </div>
                                <span className={styles.occText} style={{ color: OCC_COLOR(occPct) }}>
                                  {isFull ? t('box_office.full') : t('box_office.available', { n: avail })}
                                </span>
                              </div>
                            )}
                            <div className={styles.sessionPrice}>{t('box_office.from', { price: (s.price ?? 0).toFixed(2) })}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={styles.sessionListThumb} style={mv.imageUrl ? {} : { background: GENRE_GRADIENT[mv.genre] || DEFAULT_GRADIENT }}>
                            {mv.imageUrl
                              ? <img src={mv.imageUrl} alt={mv.title} className={styles.sessionListThumbImg} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.style.background = GENRE_GRADIENT[mv.genre] || DEFAULT_GRADIENT; }} />
                              : <span className={styles.sessionListInitials}>{getInitials(mv.title)}</span>
                            }
                          </div>
                          <div className={styles.sessionCardTop}>
                            <div className={styles.sessionTime}>{time}</div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <Badge variant={FORMAT_BADGE[mv.format] || 'default'}>{mv.format}</Badge>
                              <Badge variant="default">{mv.language}</Badge>
                            </div>
                          </div>
                          <div className={styles.sessionMovie}>{mv.title}</div>
                          <div className={styles.sessionRoom}>{rm.name?.split('—')[0]?.trim()}</div>
                          <div className={styles.sessionPrice}>{t('box_office.from', { price: (s.price ?? 0).toFixed(2) })}</div>
                          {!isFull && <ChevronRight size={14} className={styles.sessionArrow} />}
                        </>
                      )}
                    </button>
                  );
                })}
                {filteredSessions.length === 0 && <div className={styles.emptyMsg}>{t('box_office.noSessions')}</div>}
              </div>
            )}
          </>
        )}

        {/* STEP: seats */}
        {step === 'seats' && selectedSession && (
          <>
            <div className={styles.leftHeader}>
              <button className={styles.backBtn} onClick={() => setStep('sessions')}>
                <ArrowLeft size={13} /> {t('box_office.changeSession')}
              </button>
              <div className={styles.sessionPill}>
                <span className={styles.sessionPillTime}>{selectedSession.dateTime?.split('T')[1]?.substring(0, 5)}</span>
                <span className={styles.sessionPillMovie}>{movie?.title}</span>
                <Badge variant={FORMAT_BADGE[movie?.format] || 'default'}>{movie?.format}</Badge>
              </div>
            </div>

            <div className={styles.typeSelector}>
              <span className={styles.typeSelectorLabel}>{t('box_office.ticketType')}</span>
              <div className={styles.typeButtons}>
                {ticketTypes.filter(tt => !tt.extra).map(tt => (
                  <button key={tt.id}
                    className={`${styles.typeBtn} ${ticketType === tt.id ? styles.typeBtnActive : ''}`}
                    onClick={() => setTicketType(tt.id)}>
                    <span>{tt.label}</span>
                    <span className={styles.typeBtnPrice}>€{tt.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
              {extra && <p className={styles.extraNote}>+ suplemento {extra.label}: €{extra.price.toFixed(2)} / entrada</p>}
            </div>

            <div className={styles.seatMapWrap}>
              {loadingSeats ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
                  <Loader size={20} /> {t('box_office.loadingSeats')}
                </div>
              ) : (
                <SeatMap
                  session={seatMapSession}
                  room={seatMapRoom}
                  seats={realSeats}
                  selectedSeats={selectedSeats}
                  onToggle={setSelectedSeats}
                  maxSelect={20}
                />
              )}
            </div>

            {selectedSeats.length > 0 && (
              <button className={styles.proceedBtn} onClick={() => setStep('payment')}>
                {selectedSeats.length} butaca{selectedSeats.length !== 1 ? 's' : ''} · {t('box_office.pay')}
                <strong> €{total.toFixed(2)}</strong>
                <ChevronRight size={15} />
              </button>
            )}
          </>
        )}

        {/* STEP: payment */}
        {step === 'payment' && (
          <>
            <div className={styles.leftHeader}>
              <button className={styles.backBtn} onClick={() => setStep('seats')}>
                <ArrowLeft size={13} /> {t('box_office.changeSeats')}
              </button>
            </div>

            {/* Client search */}
            <div className={styles.paySection}>
              <p className={styles.paySectionLabel}>{t('box_office.client')}</p>
              {selectedClient ? (
                <div className={styles.clientChip}>
                  <div className={styles.clientChipInfo}>
                    <span className={styles.clientChipName}>{selectedClient.name ?? selectedClient.username}</span>
                    <span className={styles.clientChipEmail}>{selectedClient.email ?? ''}</span>
                  </div>
                  {selectedClient.fidelityDiscountEligible && (
                    <span className={styles.fidelityBadge}><Star size={10} /> Socio</span>
                  )}
                  <button className={styles.clientChipRemove} onClick={() => { setSelectedClient(null); setClientQuery(''); setClientResults([]); }}>
                    <UserX size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.clientSearchWrap}>
                    <Search size={12} className={styles.searchIcon} />
                    <input
                      className={styles.clientSearchInput}
                      placeholder={t('box_office.clientSearch')}
                      value={clientQuery}
                      onChange={e => setClientQuery(e.target.value)}
                    />
                    {clientSearching && <Loader size={12} className={styles.clientLoader} />}
                  </div>
                  {clientResults.length > 0 && (
                    <div className={styles.clientDropdown}>
                      {clientResults.slice(0, 6).map(c => (
                        <button key={c.id} className={styles.clientDropdownItem}
                          onClick={() => { setSelectedClient(c); setClientQuery(''); setClientResults([]); }}>
                          <span className={styles.clientDropdownName}>{c.name ?? c.username}</span>
                          <span className={styles.clientDropdownEmail}>{c.email ?? ''}</span>
                          {c.fidelityDiscountEligible && <Star size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={styles.paySection}>
              <p className={styles.paySectionLabel}>{t('box_office.payMethod')}</p>
              <div className={styles.payMethods}>
                {[
                  { id: 'card',   label: t('box_office.pay.card'),   Icon: CreditCard },
                  { id: 'cash',   label: t('box_office.pay.cash'),   Icon: Banknote   },
                  { id: 'online', label: t('box_office.pay.online'), Icon: Smartphone },
                ].map(({ id, label, Icon }) => (
                  <button key={id} className={`${styles.payMethod} ${payMethod === id ? styles.payActive : ''}`}
                    onClick={() => setPayMethod(id)}>
                    <Icon size={22} /><span>{label}</span>
                  </button>
                ))}
              </div>

              {payMethod === 'cash' && (
                <div className={styles.cashSection}>
                  <label className={styles.cashLabel}>{t('box_office.cashGiven')}</label>
                  <input className={styles.cashInput} type="number" step="0.50" min={total}
                    placeholder={`Mínimo €${total.toFixed(2)}`}
                    value={cashGiven} onChange={e => setCashGiven(e.target.value)} autoFocus />
                  {change !== null && parseFloat(change) >= 0 && (
                    <div className={styles.change}>
                      <span>{t('box_office.change')}</span>
                      <span className={styles.changeAmount}>€{change}</span>
                    </div>
                  )}
                  {change !== null && parseFloat(change) < 0 && (
                    <div className={styles.changeError}>{t('box_office.insufficient')}</div>
                  )}
                  <div className={styles.payQuickAmounts}>
                    {[20, 50, 100].map(v => (
                      <button key={v} className={styles.quickAmt} onClick={() => setCashGiven(String(v))}>€{v}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT — summary ──────────────────────── */}
      <div className={styles.right}>
        <div className={styles.cartHeader}>
          <Ticket size={14} />
          <span>{t('box_office.summary')}</span>
          {selectedSeats.length > 0 && (
            <button className={styles.clearCart} onClick={() => setSelectedSeats([])} title="Vaciar selección">
              <X size={12} />
            </button>
          )}
        </div>

        {selectedSession && (
          <div className={styles.cartSession}>
            <Film size={12} />
            <div>
              <div className={styles.cartSessionTitle}>{movie?.title}</div>
              <div className={styles.cartSessionMeta}>{selectedSession.dateTime?.split('T')[1]?.substring(0, 5)} · {theater?.name?.split('—')[0]?.trim()}</div>
              <div className={styles.cartSessionMeta}>{selectedSession.dateTime?.split('T')[0]}</div>
            </div>
          </div>
        )}

        <div className={styles.cartLines}>
          {selectedSeats.length === 0 ? (
            <div className={styles.cartEmpty}>
              <Ticket size={26} opacity={0.15} />
              <p>{step === 'sessions' ? t('box_office.selectSession') : t('box_office.selectSeat')}</p>
            </div>
          ) : (
            <>
              <div className={styles.cartTypeRow}>
                <span className={styles.cartTypeLabel}>{baseType.label}</span>
                <span className={styles.cartTypePrice}>€{basePrice.toFixed(2)} / ud.</span>
              </div>
              {fidelityEligible && (
                <div className={styles.cartTypeRow} style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
                  <span className={styles.cartTypeLabel} style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={10} /> {t('box_office.fidelity')}
                  </span>
                  <span className={styles.cartTypePrice} style={{ color: 'var(--accent)' }}>−€{(basePrice * 0.1).toFixed(2)} / ud.</span>
                </div>
              )}
              {extra && (
                <div className={styles.cartTypeRow} style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
                  <span className={styles.cartTypeLabel} style={{ color: 'var(--accent)' }}>+ {extra.label}</span>
                  <span className={styles.cartTypePrice}>€{extra.price.toFixed(2)} / ud.</span>
                </div>
              )}
              <div className={styles.cartSeatsList}>
                {selectedSeats.map(s => (
                  <div key={s} className={styles.cartSeat}>
                    <span className={styles.cartSeatId}>{s}</span>
                    <span className={styles.cartSeatPrice}>€{totalPerTicket.toFixed(2)}</span>
                    <button className={styles.cartSeatRemove}
                      onClick={() => setSelectedSeats(prev => prev.filter(x => x !== s))}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className={styles.cartFooter}>
          <div className={styles.cartTotal}>
            <span>TOTAL</span>
            <span className={styles.cartTotalAmount}>€{total.toFixed(2)}</span>
          </div>
          <div className={styles.cartCount}>{selectedSeats.length} butaca{selectedSeats.length !== 1 ? 's' : ''}</div>

          {step === 'payment' ? (
            <button className={styles.cobrarBtn}
              disabled={paying || !selectedSeats.length || (payMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < total))}
              onClick={handlePay}>
              {paying ? <Loader size={17} /> : <CheckCircle size={17} />}
              {paying ? t('box_office.processing') : t('box_office.confirmPay')}
            </button>
          ) : (
            <button className={styles.cobrarBtn}
              disabled={!selectedSeats.length || step === 'sessions'}
              onClick={() => step === 'seats' ? setStep('payment') : undefined}>
              <CreditCard size={17} />
              {step === 'sessions' ? t('box_office.selectSessionBtn') : t('box_office.pay')}
            </button>
          )}
        </div>
      </div>

      {stripeData && (
        <StripePaymentModal
          clientSecret={stripeData.clientSecret}
          publishableKey={stripeData.publishableKey}
          amount={total}
          title="Pago online de entradas"
          onSuccess={handleStripeSuccess}
          onCancel={handleStripeCancel}
        />
      )}
    </div>
  );
}

/* ── Ticket success screen ───────────────────────── */
function TicketSuccess({ tickets, total, payMethod, onReset, t }) {
  const [current, setCurrent] = useState(0);
  const ticket    = tickets[current];
<<<<<<< HEAD

  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);
  const PAY_LABEL = { card: 'Tarjeta', cash: 'Efectivo', online: 'Online/QR' };
=======
  const PAY_LABEL = {
    card:   t('box_office.pay.card'),
    cash:   t('box_office.pay.cash'),
    online: t('box_office.pay.online'),
  };

  const langLabel = (lang) => {
    if (lang === 'ES') return t('box_office.ticket.dubbed');
    if (lang === 'VO') return t('box_office.ticket.original');
    return t('box_office.ticket.subbed');
  };
>>>>>>> b80d8bd (feat(i18n): traducción completa de todas las páginas y componentes)

  return (
    <div className={styles.successShell}>
      <div className={styles.successLeft}>
        <div className={styles.successIcon}><CheckCircle size={30} /></div>
        <h2 className={styles.successTitle}>{t('box_office.success.title')}</h2>
        <p className={styles.successSub}>{tickets.length} entrada{tickets.length !== 1 ? 's' : ''} · €{total.toFixed(2)} · {PAY_LABEL[payMethod]}</p>
        {tickets.length > 1 && (
          <div className={styles.ticketNav}>
            {tickets.map((_, i) => (
              <button key={i} className={`${styles.ticketNavBtn} ${i === current ? styles.ticketNavActive : ''}`}
                onClick={() => setCurrent(i)}>{i + 1}</button>
            ))}
          </div>
        )}
        <div className={styles.actions}>
          <button className={styles.printBtn} onClick={() => window.print()}>
            <Printer size={14} /> {t('box_office.success.print')}
          </button>
          <button className={styles.newSaleBtn} onClick={onReset}>
            <Ticket size={14} /> {t('box_office.success.newSale')}
          </button>
        </div>
      </div>

      <div className={styles.ticketCard}>
        <div className={styles.ticketCardHeader}>
          <Film size={15} className={styles.ticketCardLogo} />
          <span>LUMEN CINEMA</span>
        </div>
        <div className={styles.ticketCardDivider} />
        <h3 className={styles.ticketCardMovie}>{ticket.movie}</h3>
        <p className={styles.ticketCardFormat}>{ticket.format} · {langLabel(ticket.language)}</p>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketCardInfo}>
          <div><span className={styles.tcLabel}>{t('box_office.ticket.date')}</span><span className={styles.tcVal}>{ticket.date}</span></div>
          <div><span className={styles.tcLabel}>{t('box_office.ticket.time')}</span><span className={styles.tcVal}>{ticket.time} h</span></div>
          <div><span className={styles.tcLabel}>{t('box_office.ticket.room')}</span><span className={styles.tcVal}>{ticket.room}</span></div>
          <div><span className={styles.tcLabel}>{t('box_office.ticket.seat')}</span><span className={styles.tcVal}>{ticket.seat}</span></div>
        </div>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketCardTotal}>
          <span className={styles.tcLabel}>{t('box_office.ticket.total', { n: tickets.length })}</span>
          <span className={styles.tcTotalVal}>€{total.toFixed(2)}</span>
        </div>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketQRWrap}>
          <QRCodeSVG value={ticket.qrValue} size={110} bgColor="transparent" fgColor="var(--text-1)" level="M" />
          <div className={styles.ticketQRInfo}>
            <span className={styles.ticketQRLabel}>{t('box_office.ticket.scan')}</span>
            <span className={styles.ticketId}>{ticket.id}</span>
            <span className={styles.ticketIdSeat}>Butaca {ticket.seat}</span>
          </div>
        </div>
        <div className={styles.ticketCardDivider} />
        <p className={styles.ticketFooter}>{t('box_office.ticket.footer')}</p>
      </div>
    </div>
  );
}
