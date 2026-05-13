import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Film, ChevronRight, Minus, Plus,
  CreditCard, Banknote, Smartphone, Printer,
  CheckCircle, X, Ticket, ArrowLeft, Search,
  Loader, Star, UserX
} from 'lucide-react';
import { sessionsService }    from '../../services/sessionsService';
import { seatsService }       from '../../services/seatsService';
import { salesService }       from '../../services/salesService';
import { clientsService }     from '../../services/clientsService';
import { roomsService }       from '../../services/roomsService';
import { useApp }  from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import Badge      from '../../components/ui/Badge';
import SeatMap    from '../../components/shared/SeatMap';
import EmptyState from '../../components/shared/EmptyState';
import styles     from './BoxOfficePage.module.css';

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
  const [searchQuery, setSearchQuery]     = useState('');
  const [renderError, setRenderError]     = useState(false);
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
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        console.log('Sessions from API:', arr.length, 'items, first item:', arr[0]);
        setSessions(mergeSessionPosters(arr));
      })
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

  const movieGroups = useMemo(() => {
    const groups = {};
    filteredSessions.forEach(s => {
      const mv = s.movie ?? {};
      const mid = mv.id ?? s.movie_id;
      if (mid == null) return;
      if (!groups[mid]) {
        groups[mid] = {
          movie: mv,
          sessions: [],
        };
      }
      groups[mid].sessions.push(s);
    });
    return Object.values(groups);
  }, [filteredSessions]);

  const selectSession = (session) => {
    console.log('selectSession called with:', session);
    if (!session) return;
    setSelectedSession(session);
    setSelectedSeats([]);
    setRealSeats(null);
    setStep('seats');
    setLoadingSeats(true);

    if (!session.theater && !session.room && session.room_id) {
      roomsService.getById(session.room_id).then(room => {
        if (room) {
          setSelectedSession(prev => prev ? { ...prev, theater: room, room } : prev);
        }
      }).catch(() => {});
    }

    seatsService.getByScreening(session.id)
      .then(seats => {
        console.log('Seats received:', seats?.length, 'items');
        setRealSeats(Array.isArray(seats) ? seats : null);
      })
      .catch(() => setRealSeats(null))
      .finally(() => setLoadingSeats(false));
  };

  const movie   = selectedSession?.movie ?? selectedSession?.film ?? null;
  const theater = selectedSession?.theater ?? selectedSession?.room ?? null;

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

  const handlePay = useCallback(async () => {
    if (!selectedSeats.length) { toast('Selecciona al menos una butaca.', 'error'); return; }
    setPaying(true);
    try {
      const res = await salesService.createTicketSale({
        screeningId:   selectedSession.id,
        seats:         selectedSeats,
        ticketType:    baseType.backendType ?? 'ADULT',
        unitPrice:     discountedBase,
        surcharge:     extra?.price ?? 0,
        total,
        paymentMethod: PAY_METHOD_MAP[payMethod] ?? 'CARD',
        cashierId:     user?.id ?? null,
        userId:        selectedClient?.id ?? null,
      });

      const time = selectedSession.startTime?.split('T')[1]?.substring(0, 5) ?? selectedSession.dateTime?.split('T')[1]?.substring(0, 5) ?? '';
      const date = selectedSession.startTime?.split('T')[0] ?? selectedSession.dateTime?.split('T')[0] ?? '';

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
      setStep('done');
    } catch {
      toast('Error al procesar el cobro. Inténtalo de nuevo.', 'error');
    } finally {
      setPaying(false);
    }
  }, [selectedSeats, selectedSession, baseType, extra, discountedBase, total, payMethod, user, selectedClient, movie, theater, toast]);

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
              <div className={styles.searchBox}>
                <Search size={12} className={styles.searchIcon} aria-hidden="true" />
                <input className={styles.searchInput}
                  aria-label={t('box_office.search')}
                  placeholder={t('box_office.search')}
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>

            {loadingSessions ? (
              <div className={styles.emptyMsg}><Loader size={16} /> {t('box_office.loading')}</div>
            ) : (
              <div className={styles.sessionGrid}>
                  {movieGroups.map(group => {
                  const mv = group.movie ?? {};
                  const anyFull = group.sessions.every(s => s.full === true);
                  const movieTitle = mv.title ?? group.sessions[0]?.movie?.title ?? '';

                  return (
                    <div key={mv.id ?? group.sessions[0]?.id} className={`${styles.sessionCard} ${anyFull ? styles.sessionFull : ''}`}>
                      <div className={styles.sessionPoster} style={mv.imageUrl ? {} : { background: GENRE_GRADIENT[mv.genre] || DEFAULT_GRADIENT }}>
                        {mv.imageUrl
                          ? <img src={mv.imageUrl} alt={movieTitle} className={styles.sessionPosterImg} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.style.background = GENRE_GRADIENT[mv.genre] || DEFAULT_GRADIENT; }} />
                          : <span className={styles.sessionPosterInitials}>{getInitials(movieTitle)}</span>
                        }
                        <div className={styles.sessionPosterBadges}>
                          <Badge variant={FORMAT_BADGE[mv.format] || 'default'}>{mv.format}</Badge>
                          <Badge variant="default">{mv.language}</Badge>
                        </div>
                        {anyFull && <div className={styles.posterFullOverlay}>{t('box_office.full')}</div>}
                      </div>
                      <div className={styles.sessionCardBody}>
                        <div className={styles.sessionMovie}>{movieTitle}</div>
                        <div className={styles.sessionTimesGrid}>
                              {group.sessions.map(s => {
                            const rm = s.theater ?? s.room ?? {};
                            const isFull = s.full === true;
                            const cap = rm.capacity ?? s.capacity ?? 1;
                            const soldCnt = cap - (s.availableSeats ?? cap);
                            const occPct = cap > 0 ? Math.round((soldCnt / cap) * 100) : 0;
                            const time = s.startTime?.split('T')[1]?.substring(0, 5)
                              || s.time?.trim()?.substring(0, 5)
                              || s.dateTime?.split('T')[1]?.substring(0, 5)
                              || '--:--';

                            return (
                              <button
                                key={s.id}
                                className={`${styles.timeBtn} ${isFull ? styles.timeBtnFull : ''}`}
                                onClick={() => selectSession(s)}
                                disabled={isFull}
                              >
                                <span className={styles.timeBtnHour}>{time}</span>
                                <span className={styles.timeBtnRoom}>{rm.name?.split('—')[0]?.trim() ?? `Sala ${s.room_id ?? ''}`}</span>
                                <span className={styles.timeBtnOcc} style={{ color: OCC_COLOR(occPct) }}>
                                  {isFull ? t('box_office.full') : `${soldCnt}/${cap}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className={styles.sessionPrice}>{t('box_office.from', { price: (group.sessions[0]?.basePrice ?? group.sessions[0]?.price ?? 0).toFixed(2) })}</div>
                      </div>
                    </div>
                  );
                })}
                {movieGroups.length === 0 && <EmptyState icon={Film} title={t('box_office.noSessions')} />}
              </div>
            )}
          </>
        )}

        {/* STEP: seats */}
        {step === 'seats' && selectedSession && selectedSession.id && (
          <>
            <div className={styles.leftHeader}>
              <button className={styles.backBtn} onClick={() => setStep('sessions')}>
                <ArrowLeft size={13} /> {t('box_office.changeSession')}
              </button>
              <div className={styles.sessionPill}>
                <span className={styles.sessionPillTime}>{selectedSession.startTime?.split('T')[1]?.substring(0, 5) || selectedSession.time?.trim()?.substring(0, 5) || selectedSession.dateTime?.split('T')[1]?.substring(0, 5) || '--:--'}</span>
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
                    aria-pressed={ticketType === tt.id}
                    onClick={() => setTicketType(tt.id)}>
                    <span>{tt.label}</span>
                    <span className={styles.typeBtnPrice}>€{tt.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
              {extra && <p className={styles.extraNote}>+ suplemento {extra.label}: €{extra.price.toFixed(2)} / entrada</p>}
            </div>

            <div className={styles.seatMapWrap}>
              {loadingSeats || !seatMapRoom ? (
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
                {selectedSeats.length} butaca{selectedSeats.length !== 1 ? 's' : ''} · {t('box_office.payButton')}
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
                  <button className={styles.clientChipRemove} aria-label={t('box_office.removeClient')} onClick={() => { setSelectedClient(null); setClientQuery(''); setClientResults([]); }}>
                    <UserX size={13} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.clientSearchWrap}>
                    <Search size={12} className={styles.searchIcon} />
                    <input
                      className={styles.clientSearchInput}
                      aria-label={t('box_office.clientSearch')}
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
                    aria-pressed={payMethod === id}
                    onClick={() => setPayMethod(id)}>
                    <Icon size={22} aria-hidden="true" /><span>{label}</span>
                  </button>
                ))}
              </div>

              {payMethod === 'cash' && (
                <div className={styles.cashSection}>
                  <label className={styles.cashLabel} htmlFor="bo-cash-input">{t('box_office.cashGiven')}</label>
                  <input id="bo-cash-input" className={styles.cashInput} type="number" step="0.50" min={total}
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
            <button className={styles.clearCart} aria-label={t('box_office.clearSelection')} onClick={() => setSelectedSeats([])}>
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>

        {selectedSession && (
          <div className={styles.cartSession}>
            <Film size={12} />
            <div>
              <div className={styles.cartSessionTitle}>{movie?.title}</div>
              <div className={styles.cartSessionMeta}>{selectedSession.startTime?.split('T')[1]?.substring(0, 5) || selectedSession.time?.trim()?.substring(0, 5) || selectedSession.dateTime?.split('T')[1]?.substring(0, 5) || '--:--'} · {theater?.name?.split('—')[0]?.trim()}</div>
              <div className={styles.cartSessionMeta}>{selectedSession.startTime?.split('T')[0] || selectedSession.date?.split('T')[0] || selectedSession.dateTime?.split('T')[0] || ''}</div>
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
                      aria-label={`${t('box_office.removeSeat')} ${s}`}
                      onClick={() => setSelectedSeats(prev => prev.filter(x => x !== s))}>
                      <X size={10} aria-hidden="true" />
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
              {step === 'sessions' ? t('box_office.selectSessionBtn') : t('box_office.payButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Ticket success screen ───────────────────────── */
function TicketSuccess({ tickets, total, payMethod, onReset, t }) {
  const [current, setCurrent] = useState(0);
  const ticket    = tickets[current];
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

  return (
    <div className={styles.successShell}>
      <div className={styles.successLeft}>
        <div className={styles.successIcon}><CheckCircle size={30} /></div>
        <h2 className={styles.successTitle}>{t('box_office.success.title')}</h2>
        <p className={styles.successSub}>{tickets.length} entrada{tickets.length !== 1 ? 's' : ''} · €{total.toFixed(2)} · {PAY_LABEL[payMethod]}</p>
        {tickets.length > 1 && (
          <div className={styles.ticketNav} role="group" aria-label={t('box_office.ticketNavLabel')}>
            {tickets.map((_, i) => (
              <button key={i} className={`${styles.ticketNavBtn} ${i === current ? styles.ticketNavActive : ''}`}
                aria-pressed={i === current}
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
          <div role="img" aria-label={`${t('box_office.qrLabel')} ${ticket.seat}`}>
            <QRCodeSVG value={ticket.qrValue} size={110} bgColor="transparent" fgColor="var(--text-1)" level="M" />
          </div>
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
