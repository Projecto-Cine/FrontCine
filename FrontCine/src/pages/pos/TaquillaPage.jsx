import { useState, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Film, ChevronRight, Minus, Plus,
  CreditCard, Banknote, Smartphone, Printer,
  CheckCircle, X, Ticket, ArrowLeft, Search,
  LayoutGrid, List
} from 'lucide-react';
import { sessionsService } from '../../services/sessionsService';
import { moviesService } from '../../services/moviesService';
import { roomsService } from '../../services/roomsService';
import { useApp } from '../../contexts/AppContext';
import Badge from '../../components/ui/Badge';
import SeatMap from '../../components/shared/SeatMap';
import styles from './TaquillaPage.module.css';

const TICKET_TYPES = [
  { id: 'adulto',     label: 'Adulto',        price: 13.50, color: 'accent' },
  { id: 'reducida',   label: 'Reducida',       price: 9.00,  color: 'cyan'   },
  { id: 'estudiante', label: 'Estudiante',      price: 8.00,  color: 'purple' },
  { id: 'infantil',   label: 'Infantil (<12)', price: 7.00,  color: 'green'  },
  { id: 'imax',       label: 'IMAX +',         price: 5.00,  color: 'yellow', extra: true },
  { id: '4dx',        label: '4DX +',          price: 6.50,  color: 'red',    extra: true },
  { id: 'vip',        label: 'VIP +',          price: 8.00,  color: 'purple', extra: true },
];

const FORMAT_BADGE = { IMAX: 'purple', '4DX': 'red', '3D': 'cyan', '2D': 'default', VIP: 'yellow', 'IMAX 3D': 'purple', '2D/3D': 'cyan' };
const OCC_COLOR = (pct) => pct >= 95 ? 'var(--red)' : pct >= 80 ? 'var(--yellow)' : 'var(--green)';

const GENRE_GRADIENT = {
  'Ciencia ficción': 'linear-gradient(145deg, #071828 0%, #0e3252 100%)',
  'Drama':           'linear-gradient(145deg, #150d22 0%, #321860 100%)',
  'Drama/Historia':  'linear-gradient(145deg, #120d1e 0%, #2e1a55 100%)',
  'Drama/Thriller':  'linear-gradient(145deg, #12100a 0%, #30260e 100%)',
  'Animación':       'linear-gradient(145deg, #0a1e0c 0%, #173d1a 100%)',
  'Terror':          'linear-gradient(145deg, #1a0606 0%, #3d0d0d 100%)',
  'Terror/Sci-Fi':   'linear-gradient(145deg, #100a18 0%, #280d30 100%)',
  'Terror/Drama':    'linear-gradient(145deg, #180606 0%, #350f0f 100%)',
  'Thriller':        'linear-gradient(145deg, #141008 0%, #32260a 100%)',
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
  // step: sessions | seats | payment | done
  const [step, setStep] = useState('sessions');
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [ticketType, setTicketType] = useState('adulto');
  const [payMethod, setPayMethod] = useState('card');
  const [cashGiven, setCashGiven] = useState('');
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [sessions, setSessions] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const { toast } = useApp();

  useEffect(() => {
    sessionsService.getAll().then(setSessions).catch(() => {});
    moviesService.getAll().then(setMovies).catch(() => {});
    roomsService.getAll().then(setRooms).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter(s => s.date === today && s.status !== 'cancelled');

  const filteredSessions = todaySessions.filter(s => {
    if (!searchQuery) return true;
    const movie = movies.find(m => m.id === s.movie_id);
    return movie?.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectSession = (session) => {
    setSelectedSession(session);
    setSelectedSeats([]);
    setStep('seats');
  };

  const movie = selectedSession ? movies.find(m => m.id === selectedSession.movie_id) : null;
  const room  = selectedSession ? rooms.find(r => r.id === selectedSession.room_id) : null;

  const baseType  = TICKET_TYPES.find(t => t.id === ticketType) || TICKET_TYPES[0];
  const basePrice = baseType.price;

  // Extras aplicables a este formato de sala
  const extra = TICKET_TYPES.filter(t => t.extra).find(t => {
    if (!room) return false;
    if (t.id === 'imax')  return room.format.includes('IMAX');
    if (t.id === '4dx')   return room.format.includes('4DX');
    if (t.id === 'vip')   return room.name.toLowerCase().includes('vip');
    return false;
  });
  const totalPerTicket = basePrice + (extra?.price || 0);
  const total = totalPerTicket * selectedSeats.length;

  const handlePay = () => {
    if (!selectedSeats.length) { toast('Selecciona al menos una butaca.', 'error'); return; }
    const generated = selectedSeats.map((seat, i) => ({
      id: generateTicketId(),
      movie: movie?.title,
      room: room?.name,
      date: selectedSession.date,
      time: selectedSession.time,
      format: movie?.format,
      language: movie?.language,
      seat,
      sessionId: selectedSession.id,
      idx: i + 1,
    }));
    setTickets(generated);
    setStep('done');
  };

  const reset = () => {
    setStep('sessions');
    setSelectedSession(null);
    setSelectedSeats([]);
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
                const mv = MOVIES.find(m => m.id === s.movie_id);
                const rm = ROOMS.find(r => r.id === s.room_id);
                const occPct = Math.round((s.sold / s.capacity) * 100);
                const avail = s.capacity - s.sold;
                return (
                  <button
                    key={s.id}
                    className={`${styles.sessionCard} ${s.status === 'full' ? styles.sessionFull : ''} ${viewMode === 'list' ? styles.sessionCardList : ''}`}
                    onClick={() => s.status !== 'full' && selectSession(s)}
                    disabled={s.status === 'full'}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className={styles.sessionPoster} style={{ background: GENRE_GRADIENT[mv?.genre] || DEFAULT_GRADIENT }}>
                          <span className={styles.sessionPosterInitials}>{getInitials(mv?.title)}</span>
                          <div className={styles.sessionPosterBadges}>
                            <Badge variant={FORMAT_BADGE[mv?.format] || 'default'}>{mv?.format}</Badge>
                            <Badge variant="default">{mv?.language}</Badge>
                          </div>
                          {s.status === 'full' && <div className={styles.posterFullOverlay}>LLENA</div>}
                        </div>
                        <div className={styles.sessionCardBody}>
                          <div className={styles.sessionTime}>{s.time}</div>
                          <div className={styles.sessionMovie}>{mv?.title}</div>
                          <div className={styles.sessionRoom}>{rm?.name.split('—')[0].trim()}</div>
                          <div className={styles.sessionOcc}>
                            <div className={styles.occBar}>
                              <div className={styles.occFill} style={{ width: `${occPct}%`, background: OCC_COLOR(occPct) }} />
                            </div>
                            <span className={styles.occText} style={{ color: OCC_COLOR(occPct) }}>
                              {s.status === 'full' ? 'LLENA' : `${avail} libres`}
                            </span>
                          </div>
                          <div className={styles.sessionPrice}>Desde €{s.price.toFixed(2)}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.sessionListThumb} style={{ background: GENRE_GRADIENT[mv?.genre] || DEFAULT_GRADIENT }}>
                          <span className={styles.sessionListInitials}>{getInitials(mv?.title)}</span>
                        </div>
                        <div className={styles.sessionCardTop}>
                          <div className={styles.sessionTime}>{s.time}</div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <Badge variant={FORMAT_BADGE[mv?.format] || 'default'}>{mv?.format}</Badge>
                            <Badge variant="default">{mv?.language}</Badge>
                          </div>
                        </div>
                        <div className={styles.sessionMovie}>{mv?.title}</div>
                        <div className={styles.sessionRoom}>{rm?.name.split('—')[0].trim()}</div>
                        <div className={styles.sessionOcc}>
                          <div className={styles.occBar}>
                            <div className={styles.occFill} style={{ width: `${occPct}%`, background: OCC_COLOR(occPct) }} />
                          </div>
                          <span className={styles.occText} style={{ color: OCC_COLOR(occPct) }}>
                            {s.status === 'full' ? 'LLENA' : `${avail} libres`}
                          </span>
                        </div>
                        <div className={styles.sessionPrice}>Desde €{s.price.toFixed(2)}</div>
                        {s.status !== 'full' && <ChevronRight size={14} className={styles.sessionArrow} />}
                      </>
                    )}
                  </button>
                );
              })}
              {filteredSessions.length === 0 && <div className={styles.emptyMsg}>No hay sesiones disponibles</div>}
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
                <span className={styles.sessionPillTime}>{selectedSession.time}</span>
                <span className={styles.sessionPillMovie}>{movie?.title}</span>
                <Badge variant={FORMAT_BADGE[movie?.format] || 'default'}>{movie?.format}</Badge>
              </div>
            </div>

            {/* Tipo de entrada */}
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
            </div>

            {/* Mapa de asientos */}
            <div className={styles.seatMapWrap}>
              <SeatMap
                session={selectedSession}
                room={room}
                selectedSeats={selectedSeats}
                onToggle={setSelectedSeats}
                maxSelect={20}
              />
            </div>

            {selectedSeats.length > 0 && (
              <button className={styles.proceedBtn} onClick={() => setStep('payment')}>
                {selectedSeats.length} butaca{selectedSeats.length !== 1 ? 's' : ''} · Ir al cobro ·
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
                  { id: 'card',   label: 'Tarjeta',    Icon: CreditCard },
                  { id: 'cash',   label: 'Efectivo',   Icon: Banknote },
                  { id: 'online', label: 'Online/QR',  Icon: Smartphone },
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
              <div className={styles.cartSessionMeta}>{selectedSession.time} · {room?.name.split('—')[0].trim()}</div>
              <div className={styles.cartSessionMeta}>{selectedSession.date}</div>
            </div>
          </div>
        )}

        <div className={styles.cartLines}>
          {selectedSeats.length === 0 ? (
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
              disabled={!selectedSeats.length || (payMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < total))}
              onClick={handlePay}>
              <CheckCircle size={17} />
              Confirmar cobro
            </button>
          ) : (
            <button className={styles.cobrarBtn}
              disabled={!selectedSeats.length || step === 'sessions'}
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
        <p className={styles.ticketCardFormat}>{ticket.format} · {ticket.language === 'ES' ? 'Doblada' : ticket.language === 'VO' ? 'V. Original' : 'V. Subtitulada'}</p>
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
            size={110}
            bgColor="transparent"
            fgColor="var(--text-1)"
            level="M"
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
