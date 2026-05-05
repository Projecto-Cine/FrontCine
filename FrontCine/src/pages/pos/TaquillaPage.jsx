import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Film, ChevronRight, CreditCard, Banknote, Smartphone, Printer,
  CheckCircle, X, Ticket, ArrowLeft, Search, LayoutGrid, List
} from 'lucide-react';
import { sessionsService }     from '../../services/sessionsService';
import { moviesService }       from '../../services/moviesService';
import { roomsService }        from '../../services/roomsService';
import { reservationsService } from '../../services/reservationsService';
import { useApp }  from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import Badge    from '../../components/ui/Badge';
import SeatMap  from '../../components/shared/SeatMap';
import styles   from './TaquillaPage.module.css';

// Frontend display types → backend ticketType
const TICKET_TYPES = [
  { id: 'adulto',     label: 'Adulto',        price: 13.50, backendType: 'ADULT'  },
  { id: 'reducida',   label: 'Reducida',       price: 9.00,  backendType: 'SENIOR' },
  { id: 'estudiante', label: 'Estudiante',      price: 8.00,  backendType: 'ADULT'  },
  { id: 'infantil',   label: 'Infantil (<12)', price: 7.00,  backendType: 'CHILD'  },
  { id: 'imax',       label: 'IMAX +',         price: 5.00,  backendType: null, extra: true },
  { id: '4dx',        label: '4DX +',          price: 6.50,  backendType: null, extra: true },
  { id: 'vip',        label: 'VIP +',          price: 8.00,  backendType: null, extra: true },
];

const FORMAT_BADGE  = { IMAX: 'purple', '4DX': 'red', '3D': 'cyan', '2D': 'default', VIP: 'yellow', 'IMAX 3D': 'purple', '2D/3D': 'cyan' };
const OCC_COLOR     = (pct) => pct >= 95 ? 'var(--red)' : pct >= 80 ? 'var(--yellow)' : 'var(--green)';
const GENRE_GRADIENT = {
  'Ciencia ficción': 'linear-gradient(145deg,#071828 0%,#0e3252 100%)',
  'Drama':           'linear-gradient(145deg,#150d22 0%,#321860 100%)',
  'Animación':       'linear-gradient(145deg,#0a1e0c 0%,#173d1a 100%)',
  'Terror':          'linear-gradient(145deg,#1a0606 0%,#3d0d0d 100%)',
  'Thriller':        'linear-gradient(145deg,#141008 0%,#32260a 100%)',
  'Acción':          'linear-gradient(145deg,#180c04 0%,#3d1a06 100%)',
};
const DEFAULT_GRADIENT = 'linear-gradient(145deg,#161008 0%,#2a1e10 100%)';

function getInitials(title = '') {
  const words = title.split(' ').filter(w => w.length > 2);
  return (words.slice(0, 2).map(w => w[0]).join('') || title.slice(0, 2)).toUpperCase();
}

function generateTicketId() {
  return 'TKT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

function isPastSession(fechaHora) {
  return fechaHora ? new Date(fechaHora) < new Date() : false;
}

// Reads common Spanish/English field name variants from a backend object
const get = {
  movieId:  (s) => s.peliculaId   ?? s.movieId    ?? s.movie_id,
  roomId:   (s) => s.salaId       ?? s.theaterId  ?? s.room_id,
  title:    (m) => m?.titulo      ?? m?.title      ?? '—',
  genre:    (m) => m?.genero      ?? m?.genre,
  format:   (m) => m?.formato     ?? m?.format,
  language: (m) => m?.idioma      ?? m?.language,
  roomName: (r) => r?.nombre      ?? r?.name       ?? '—',
  capacity: (r) => r?.aforo       ?? r?.capacity   ?? 100,
  sold:     (s) => s?.butacasOcupadas ?? s?.sold   ?? 0,
  price:    (s) => s?.precio      ?? s?.price,
  time:     (s) => s?.fechaHora   ? s.fechaHora.slice(11, 16) : (s?.time ?? ''),
  date:     (s) => s?.fechaHora   ? s.fechaHora.slice(0, 10)  : (s?.date ?? ''),
};

export default function TaquillaPage() {
  const { user }   = useAuth();
  const { toast }  = useApp();

  const [step, setStep]                   = useState('sessions');
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);   // number[] — backend seat IDs
  const [seats, setSeats]                 = useState([]);        // ScreeningSeatResponseDTO[]
  const [ticketType, setTicketType]       = useState('adulto');
  const [payMethod, setPayMethod]         = useState('card');
  const [cashGiven, setCashGiven]         = useState('');
  const [tickets, setTickets]             = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [viewMode, setViewMode]           = useState('grid');
  const [sessions, setSessions]           = useState([]);
  const [movies, setMovies]               = useState([]);
  const [rooms, setRooms]                 = useState([]);
  const [submitting, setSubmitting]       = useState(false);

  useEffect(() => {
    sessionsService.getAll().then(setSessions).catch(() => {});
    moviesService.getAll().then(setMovies).catch(() => {});
    roomsService.getAll().then(setRooms).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const todaySessions = sessions.filter(s => {
    const dateStr = s.fechaHora?.slice(0, 10) ?? s.date;
    return dateStr === today;
  });

  const filteredSessions = todaySessions.filter(s => {
    if (!searchQuery) return true;
    const mv = movies.find(m => m.id === get.movieId(s));
    return get.title(mv).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectSession = async (session) => {
    if (isPastSession(session.fechaHora)) {
      toast('Esta sesión ya ha comenzado o ha finalizado.', 'error');
      return;
    }
    setSelectedSession(session);
    setSelectedSeatIds([]);
    setSeats([]);
    setStep('seats');
    try {
      const data = await sessionsService.getSeats(session.id);
      setSeats(Array.isArray(data) ? data : []);
    } catch {
      toast('Error al cargar el mapa de asientos.', 'error');
    }
  };

  // Derived from selected session
  const movie = selectedSession
    ? (selectedSession.pelicula ?? movies.find(m => m.id === get.movieId(selectedSession)))
    : null;
  const room = selectedSession
    ? (selectedSession.sala ?? selectedSession.theater ?? rooms.find(r => r.id === get.roomId(selectedSession)))
    : null;

  const baseType       = TICKET_TYPES.find(t => t.id === ticketType) ?? TICKET_TYPES[0];
  const basePrice      = baseType.price;
  const roomName       = get.roomName(room);
  const extra          = TICKET_TYPES.filter(t => t.extra).find(t => {
    if (!room) return false;
    const n = roomName.toLowerCase();
    const f = get.format(room) ?? '';
    if (t.id === 'imax') return f.includes('IMAX') || n.includes('imax');
    if (t.id === '4dx')  return f.includes('4DX')  || n.includes('4dx');
    if (t.id === 'vip')  return n.includes('vip');
    return false;
  });
  const totalPerTicket = basePrice + (extra?.price ?? 0);
  const total          = totalPerTicket * selectedSeatIds.length;

  const handlePay = async () => {
    if (!selectedSeatIds.length) {
      toast('Selecciona al menos una butaca.', 'error');
      return;
    }

    // Past session check
    if (isPastSession(selectedSession?.fechaHora)) {
      toast('No se pueden comprar entradas para sesiones ya finalizadas.', 'error');
      return;
    }

    // CHILD ticket requires at least one ADULT in the same order
    if (baseType.backendType === 'CHILD') {
      toast('Las entradas infantiles requieren al menos una entrada de adulto en el mismo pedido.', 'error');
      return;
    }

    if (payMethod === 'cash' && cashGiven && parseFloat(cashGiven) < total) {
      toast('El importe entregado es insuficiente.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const purchase = await reservationsService.create({
        userId:      user.id,
        screeningId: selectedSession.id,
        tickets:     selectedSeatIds.map(seatId => ({
          seatId,
          ticketType: baseType.backendType,
        })),
      });
      await reservationsService.confirm(purchase.id);

      const sessionTime  = get.time(selectedSession);
      const sessionDate  = get.date(selectedSession);
      const movieTitle   = get.title(movie);
      const movieFormat  = get.format(movie) ?? '';
      const movieLang    = get.language(movie) ?? '';

      const generated = selectedSeatIds.map((seatId, i) => {
        const seat     = seats.find(s => s.id === seatId);
        const seatLabel = seat ? `${seat.fila}${String(seat.numero).padStart(2, '0')}` : `#${seatId}`;
        return {
          id: generateTicketId(),
          movie:    movieTitle,
          room:     roomName,
          date:     sessionDate,
          time:     sessionTime,
          format:   movieFormat,
          language: movieLang,
          seat:     seatLabel,
          sessionId: selectedSession.id,
          idx:      i + 1,
        };
      });
      setTickets(generated);
      setStep('done');
    } catch (err) {
      toast(err.message ?? 'Error al procesar la compra.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep('sessions');
    setSelectedSession(null);
    setSelectedSeatIds([]);
    setSeats([]);
    setPayMethod('card');
    setCashGiven('');
    setTickets([]);
    setSearchQuery('');
  };

  const change = cashGiven && payMethod === 'cash' ? (parseFloat(cashGiven) - total).toFixed(2) : null;

  if (step === 'done') {
    return <TicketSuccess tickets={tickets} total={total} payMethod={payMethod} onReset={reset} />;
  }

  return (
    <div className={styles.shell}>
      {/* ── LEFT ─────────────────────────────────── */}
      <div className={styles.left}>

        {/* STEP: sessions */}
        {step === 'sessions' && (
          <>
            <div className={styles.leftHeader}>
              <h2 className={styles.leftTitle}>Sesiones de hoy</h2>
              <div className={styles.headerRight}>
                <div className={styles.searchBox}>
                  <Search size={12} className={styles.searchIcon} />
                  <input className={styles.searchInput} placeholder="Buscar película..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className={styles.viewToggle}>
                  <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={13} /></button>
                  <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`} onClick={() => setViewMode('list')}><List size={13} /></button>
                </div>
              </div>
            </div>

            <div className={`${styles.sessionGrid} ${viewMode === 'list' ? styles.sessionList : ''}`}>
              {filteredSessions.map(s => {
                const mv      = movies.find(m => m.id === get.movieId(s));
                const rm      = rooms.find(r => r.id === get.roomId(s));
                const cap     = get.capacity(rm);
                const sold    = get.sold(s);
                const occPct  = cap > 0 ? Math.round((sold / cap) * 100) : 0;
                const avail   = cap - sold;
                const isFull  = avail <= 0;
                const isPast  = isPastSession(s.fechaHora);
                const title   = get.title(mv);
                const genre   = get.genre(mv);
                const format  = get.format(mv);
                const lang    = get.language(mv);
                const time    = get.time(s);
                const price   = get.price(s);
                const rmName  = get.roomName(rm);

                return (
                  <button
                    key={s.id}
                    className={`${styles.sessionCard} ${(isFull || isPast) ? styles.sessionFull : ''} ${viewMode === 'list' ? styles.sessionCardList : ''}`}
                    onClick={() => !isFull && !isPast && selectSession(s)}
                    disabled={isFull || isPast}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className={styles.sessionPoster} style={{ background: GENRE_GRADIENT[genre] || DEFAULT_GRADIENT }}>
                          <span className={styles.sessionPosterInitials}>{getInitials(title)}</span>
                          <div className={styles.sessionPosterBadges}>
                            {format   && <Badge variant={FORMAT_BADGE[format] || 'default'}>{format}</Badge>}
                            {lang     && <Badge variant="default">{lang}</Badge>}
                          </div>
                          {isFull  && <div className={styles.posterFullOverlay}>LLENA</div>}
                          {isPast  && <div className={styles.posterFullOverlay}>FINALIZADA</div>}
                        </div>
                        <div className={styles.sessionCardBody}>
                          <div className={styles.sessionTime}>{time}</div>
                          <div className={styles.sessionMovie}>{title}</div>
                          <div className={styles.sessionRoom}>{rmName.split('—')[0].trim()}</div>
                          <div className={styles.sessionOcc}>
                            <div className={styles.occBar}>
                              <div className={styles.occFill} style={{ width: `${occPct}%`, background: OCC_COLOR(occPct) }} />
                            </div>
                            <span className={styles.occText} style={{ color: OCC_COLOR(occPct) }}>
                              {isFull ? 'LLENA' : `${avail} libres`}
                            </span>
                          </div>
                          {price != null && <div className={styles.sessionPrice}>Desde €{price.toFixed(2)}</div>}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.sessionListThumb} style={{ background: GENRE_GRADIENT[genre] || DEFAULT_GRADIENT }}>
                          <span className={styles.sessionListInitials}>{getInitials(title)}</span>
                        </div>
                        <div className={styles.sessionCardTop}>
                          <div className={styles.sessionTime}>{time}</div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {format && <Badge variant={FORMAT_BADGE[format] || 'default'}>{format}</Badge>}
                            {lang   && <Badge variant="default">{lang}</Badge>}
                          </div>
                        </div>
                        <div className={styles.sessionMovie}>{title}</div>
                        <div className={styles.sessionRoom}>{rmName.split('—')[0].trim()}</div>
                        <div className={styles.sessionOcc}>
                          <div className={styles.occBar}>
                            <div className={styles.occFill} style={{ width: `${occPct}%`, background: OCC_COLOR(occPct) }} />
                          </div>
                          <span className={styles.occText} style={{ color: OCC_COLOR(occPct) }}>
                            {isFull ? 'LLENA' : `${avail} libres`}
                          </span>
                        </div>
                        {price != null && <div className={styles.sessionPrice}>Desde €{price.toFixed(2)}</div>}
                        {!isFull && !isPast && <ChevronRight size={14} className={styles.sessionArrow} />}
                      </>
                    )}
                  </button>
                );
              })}
              {filteredSessions.length === 0 && (
                <div className={styles.emptyMsg}>No hay sesiones disponibles hoy</div>
              )}
            </div>
          </>
        )}

        {/* STEP: seats */}
        {step === 'seats' && selectedSession && (
          <>
            <div className={styles.leftHeader}>
              <button className={styles.backBtn} onClick={() => setStep('sessions')}>
                <ArrowLeft size={13} /> Cambiar sesión
              </button>
              <div className={styles.sessionPill}>
                <span className={styles.sessionPillTime}>{get.time(selectedSession)}</span>
                <span className={styles.sessionPillMovie}>{get.title(movie)}</span>
                {get.format(movie) && <Badge variant={FORMAT_BADGE[get.format(movie)] || 'default'}>{get.format(movie)}</Badge>}
              </div>
            </div>

            <div className={styles.typeSelector}>
              <span className={styles.typeSelectorLabel}>Tipo de entrada</span>
              <div className={styles.typeButtons}>
                {TICKET_TYPES.filter(t => !t.extra).map(t => (
                  <button key={t.id}
                    className={`${styles.typeBtn} ${ticketType === t.id ? styles.typeBtnActive : ''}`}
                    onClick={() => setTicketType(t.id)}>
                    <span>{t.label}</span>
                    <span className={styles.typeBtnPrice}>€{t.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
              {extra && (
                <p className={styles.extraNote}>+ suplemento {extra.label}: €{extra.price.toFixed(2)} / entrada</p>
              )}
              {baseType.backendType === 'CHILD' && (
                <p style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 6 }}>
                  ⚠ Las entradas infantiles requieren al menos una entrada de adulto en el pedido.
                </p>
              )}
            </div>

            <div className={styles.seatMapWrap}>
              <SeatMap
                seats={seats}
                selectedIds={selectedSeatIds}
                onToggle={setSelectedSeatIds}
                maxSelect={20}
              />
            </div>

            {selectedSeatIds.length > 0 && (
              <button className={styles.proceedBtn} onClick={() => setStep('payment')}>
                {selectedSeatIds.length} butaca{selectedSeatIds.length !== 1 ? 's' : ''} · Ir al cobro ·
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
                <ArrowLeft size={13} /> Cambiar butacas
              </button>
            </div>
            <div className={styles.paySection}>
              <p className={styles.paySectionLabel}>Método de pago</p>
              <div className={styles.payMethods}>
                {[
                  { id: 'card',   label: 'Tarjeta',   Icon: CreditCard },
                  { id: 'cash',   label: 'Efectivo',  Icon: Banknote   },
                  { id: 'online', label: 'Online/QR', Icon: Smartphone },
                ].map(({ id, label, Icon }) => (
                  <button key={id} className={`${styles.payMethod} ${payMethod === id ? styles.payActive : ''}`}
                    onClick={() => setPayMethod(id)}>
                    <Icon size={22} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {payMethod === 'cash' && (
                <div className={styles.cashSection}>
                  <label className={styles.cashLabel}>Importe entregado (€)</label>
                  <input className={styles.cashInput} type="number" step="0.50" min={total}
                    placeholder={`Mínimo €${total.toFixed(2)}`}
                    value={cashGiven} onChange={e => setCashGiven(e.target.value)} autoFocus />
                  {change !== null && parseFloat(change) >= 0 && (
                    <div className={styles.change}>
                      <span>Cambio a devolver</span>
                      <span className={styles.changeAmount}>€{change}</span>
                    </div>
                  )}
                  {change !== null && parseFloat(change) < 0 && (
                    <div className={styles.changeError}>Importe insuficiente</div>
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

      {/* ── RIGHT — resumen ──────────────────────── */}
      <div className={styles.right}>
        <div className={styles.cartHeader}>
          <Ticket size={14} />
          <span>Resumen</span>
          {selectedSeatIds.length > 0 && (
            <button className={styles.clearCart} onClick={() => setSelectedSeatIds([])} title="Vaciar selección">
              <X size={12} />
            </button>
          )}
        </div>

        {selectedSession && (
          <div className={styles.cartSession}>
            <Film size={12} />
            <div>
              <div className={styles.cartSessionTitle}>{get.title(movie)}</div>
              <div className={styles.cartSessionMeta}>{get.time(selectedSession)} · {roomName.split('—')[0].trim()}</div>
              <div className={styles.cartSessionMeta}>{get.date(selectedSession)}</div>
            </div>
          </div>
        )}

        <div className={styles.cartLines}>
          {selectedSeatIds.length === 0 ? (
            <div className={styles.cartEmpty}>
              <Ticket size={26} opacity={0.15} />
              <p>{step === 'sessions' ? 'Selecciona una sesión' : 'Haz clic en una butaca libre'}</p>
            </div>
          ) : (
            <>
              <div className={styles.cartTypeRow}>
                <span className={styles.cartTypeLabel}>{baseType.label}</span>
                <span className={styles.cartTypePrice}>€{basePrice.toFixed(2)} / ud.</span>
              </div>
              {extra && (
                <div className={styles.cartTypeRow} style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
                  <span className={styles.cartTypeLabel} style={{ color: 'var(--accent)' }}>+ {extra.label}</span>
                  <span className={styles.cartTypePrice}>€{extra.price.toFixed(2)} / ud.</span>
                </div>
              )}
              <div className={styles.cartSeatsList}>
                {seats.filter(s => selectedSeatIds.includes(s.id)).map(seat => {
                  const lbl = `${seat.fila}${String(seat.numero).padStart(2, '0')}`;
                  return (
                    <div key={seat.id} className={styles.cartSeat}>
                      <span className={styles.cartSeatId}>{lbl}</span>
                      <span className={styles.cartSeatPrice}>€{totalPerTicket.toFixed(2)}</span>
                      <button className={styles.cartSeatRemove}
                        onClick={() => setSelectedSeatIds(prev => prev.filter(id => id !== seat.id))}>
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className={styles.cartFooter}>
          <div className={styles.cartTotal}>
            <span>TOTAL</span>
            <span className={styles.cartTotalAmount}>€{total.toFixed(2)}</span>
          </div>
          <div className={styles.cartCount}>{selectedSeatIds.length} butaca{selectedSeatIds.length !== 1 ? 's' : ''}</div>

          {step === 'payment' ? (
            <button className={styles.cobrarBtn}
              disabled={submitting || !selectedSeatIds.length || (payMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < total))}
              onClick={handlePay}>
              <CheckCircle size={17} />
              {submitting ? 'Procesando…' : 'Confirmar cobro'}
            </button>
          ) : (
            <button className={styles.cobrarBtn}
              disabled={!selectedSeatIds.length || step === 'sessions'}
              onClick={() => step === 'seats' ? setStep('payment') : undefined}>
              <CreditCard size={17} />
              {step === 'sessions' ? 'Selecciona sesión' : 'Cobrar →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Ticket success screen ───────────────────────── */
function TicketSuccess({ tickets, total, payMethod, onReset }) {
  const [current, setCurrent] = useState(0);
  const ticket = tickets[current];
  const PAY_LABEL = { card: 'Tarjeta', cash: 'Efectivo', online: 'Online/QR' };

  return (
    <div className={styles.successShell}>
      <div className={styles.successLeft}>
        <div className={styles.successIcon}><CheckCircle size={30} /></div>
        <h2 className={styles.successTitle}>¡Cobro completado!</h2>
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
            <Printer size={14} /> Imprimir
          </button>
          <button className={styles.newSaleBtn} onClick={onReset}>
            <Ticket size={14} /> Nueva venta
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
        <p className={styles.ticketCardFormat}>
          {ticket.format} · {ticket.language === 'ES' ? 'Doblada' : ticket.language === 'VO' ? 'V. Original' : ticket.language ? 'V. Subtitulada' : ''}
        </p>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketCardInfo}>
          <div><span className={styles.tcLabel}>FECHA</span><span className={styles.tcVal}>{ticket.date}</span></div>
          <div><span className={styles.tcLabel}>HORA</span><span className={styles.tcVal}>{ticket.time} h</span></div>
          <div><span className={styles.tcLabel}>SALA</span><span className={styles.tcVal}>{ticket.room}</span></div>
          <div><span className={styles.tcLabel}>BUTACA</span><span className={styles.tcVal}>{ticket.seat}</span></div>
        </div>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketCardTotal}>
          <span className={styles.tcLabel}>TOTAL ({tickets.length} ent.)</span>
          <span className={styles.tcTotalVal}>€{total.toFixed(2)}</span>
        </div>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketQRWrap}>
          <QRCodeSVG
            value={`LUMEN:${ticket.id}:${ticket.seat}:SES${ticket.sessionId}:${ticket.date}:${ticket.time}`}
            size={110} bgColor="transparent" fgColor="var(--text-1)" level="M"
          />
          <div className={styles.ticketQRInfo}>
            <span className={styles.ticketQRLabel}>Escanear en entrada</span>
            <span className={styles.ticketId}>{ticket.id}</span>
            <span className={styles.ticketIdSeat}>Butaca {ticket.seat}</span>
          </div>
        </div>
        <div className={styles.ticketCardDivider} />
        <p className={styles.ticketFooter}>Conserve este ticket. No se admiten cambios ni devoluciones una vez comenzada la sesión.</p>
      </div>
    </div>
  );
}
