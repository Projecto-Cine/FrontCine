import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Film, ChevronRight,
  CreditCard, Banknote, Printer,
  CheckCircle, X, Ticket, ArrowLeft, Search,
  Loader, Star, UserX, Plus, Edit2, Trash2, RotateCcw
} from 'lucide-react';
import { sessionsService }    from '../../services/sessionsService';
import { seatsService }       from '../../services/seatsService';
import { salesService }       from '../../services/salesService';
import { clientsService }     from '../../services/clientsService';
import { roomsService }       from '../../services/roomsService';
import { moviesService }      from '../../services/moviesService';
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

const PAY_METHOD_MAP = { card: 'CARD', cash: 'CASH' };

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
  const [seatTypes, setSeatTypes]         = useState({}); // seatId → ticketType id
  const [payMethod, setPayMethod]         = useState('card');
  const [cashGiven, setCashGiven]         = useState('');
  const [tickets, setTickets]             = useState([]);
  const [paying, setPaying]               = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedDate, setSelectedDate]   = useState(() => new Date().toISOString().split('T')[0]);
  const [renderError, setRenderError]     = useState(false);
  const [clientQuery, setClientQuery]     = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [clientSearching, setClientSearching] = useState(false);
  const [selectedClient, setSelectedClient]   = useState(null);
  const clientDebounce   = useRef(null);
  const searchRef        = useRef(null);
  const activeSessionRef = useRef(null); // race-condition guard

  // ── Devolución modal ────────────────────────────
  const [showRefund, setShowRefund]             = useState(false);
  const [refundInput, setRefundInput]           = useState('');
  const [refundProcessing, setRefundProcessing] = useState(false);
  const [refundReceipt, setRefundReceipt]       = useState(null);

  // Accepts: "30-56", "30", or full QR "LUMEN:30-56|movie|..."
  const parseRefundInput = (raw) => {
    const s = raw.trim();
    if (s.startsWith('LUMEN:')) {
      const body = s.slice(6);
      const [idPart, movie = '', theater = '', date = '', time = '', seat = '', ticketType = ''] = body.split('|');
      const purchaseId = Number(idPart.split('-')[0]);
      return isNaN(purchaseId) || purchaseId <= 0 ? null : { purchaseId, movie, theater, date, time, seat, ticketType };
    }
    const purchaseId = Number(s.split('-')[0]);
    return isNaN(purchaseId) || purchaseId <= 0 ? null : { purchaseId, movie: '', theater: '', date: '', time: '', seat: '', ticketType: '' };
  };

  const handleRefundSubmit = async () => {
    const data = parseRefundInput(refundInput);
    if (!data?.purchaseId) { toast('Introduce un número de ticket válido (ej: 30-56).', 'error'); return; }
    setRefundProcessing(true);
    try {
      await salesService.cancelPurchase(data.purchaseId);
      setRefundReceipt({
        refundId:   `RF-${data.purchaseId}-${Date.now().toString(36).toUpperCase()}`,
        refundedAt: new Date().toISOString(),
        movie:      data.movie    || '—',
        theater:    data.theater  || '—',
        date:       data.date     || '—',
        time:       data.time     || '—',
        seat:       data.seat     || '—',
        ticketType: data.ticketType || '—',
        purchaseId: data.purchaseId,
      });
      setShowRefund(false);
      setRefundInput('');
      toast('Devolución procesada correctamente.', 'success');
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      const msg =
        status === 404 ? 'Ticket no encontrado. Verifica el número.' :
        status === 409 ? 'Esta entrada ya fue devuelta anteriormente.' :
        status === 400 ? 'No se pueden devolver entradas de sesiones que ya han comenzado.' :
        'Error al procesar la devolución. Inténtalo de nuevo.';
      toast(msg, 'error');
    } finally {
      setRefundProcessing(false);
    }
  };

  // ── Nueva sesión modal ───────────────────────────
  const [showNewSession, setShowNewSession] = useState(false);
  const [newMovies, setNewMovies]           = useState([]);
  const [newRooms, setNewRooms]             = useState([]);
  const [newSaving, setNewSaving]           = useState(false);
  const [newForm, setNewForm]               = useState({ movieId: '', theaterId: '', date: '', time: '', basePrice: '' });
  const setNF = (k, v) => setNewForm(prev => ({ ...prev, [k]: v }));

  // ── Editar sesión modal ──────────────────────────
  const [editSession, setEditSession]       = useState(null);
  const [editForm, setEditForm]             = useState({ movieId: '', theaterId: '', date: '', time: '', basePrice: '' });
  const [editSaving, setEditSaving]         = useState(false);
  const [syncing, setSyncing]               = useState(false);
  const [deleteSession, setDeleteSession]   = useState(null);
  const [showResetConfirm, setShowResetConfirm]         = useState(false);
  const [resetting, setResetting]                       = useState(false);
  const [showFullResetConfirm, setShowFullResetConfirm] = useState(false);
  const [fullResetting, setFullResetting]               = useState(false);
  const [fullResetProgress, setFullResetProgress]       = useState('');
  const setEF = (k, v) => setEditForm(prev => ({ ...prev, [k]: v }));

  const openEditSession = (s, e) => {
    e.stopPropagation();
    const dt = s.startTime ?? s.dateTime ?? '';
    setEditForm({
      movieId:   s.movie?.id   ?? '',
      theaterId: s.theater?.id ?? s.room?.id ?? '',
      date:      dt.split('T')[0] ?? '',
      time:      dt.split('T')[1]?.substring(0, 5) ?? '',
      basePrice: s.basePrice ?? s.price ?? '',
    });
    setEditSession(s);
  };

  const handleEditSession = async () => {
    if (!editForm.movieId || !editForm.theaterId || !editForm.date || !editForm.time || !editForm.basePrice) {
      toast('Todos los campos son obligatorios.', 'error'); return;
    }
    setEditSaving(true);
    try {
      const saved = await sessionsService.update(editSession.id, {
        movieId:   Number(editForm.movieId),
        theaterId: Number(editForm.theaterId),
        startTime: `${editForm.date}T${editForm.time}`,
        basePrice: Number(editForm.basePrice),
      });
      setSessions(prev => mergeSessionPosters(prev.map(s => s.id === editSession.id ? (saved ?? { ...s, ...editForm }) : s)));
      setEditSession(null);
      toast('Sesión actualizada.', 'success');
    } catch {
      toast('Error al actualizar la sesión.', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleSyncSeats = async () => {
    setSyncing(true);
    try {
      const screeningSeats = await sessionsService.syncSeats(editSession.id);
      // If this session is currently open in the seat map, refresh realSeats
      if (selectedSession?.id === editSession.id && Array.isArray(screeningSeats)) {
        const seen = new Set();
        const normalized = [];
        for (const ss of screeningSeats) {
          const seat = ss.seat ?? ss;
          if (!seat?.row || seat.number == null || ss.id == null) continue;
          const displayId = `${seat.row}${String(seat.number).padStart(2, '0')}`;
          if (seen.has(displayId)) continue;
          seen.add(displayId);
          normalized.push({
            id: displayId, row: seat.row, number: seat.number,
            status: ss.status === 'available' ? 'available' : 'occupied',
            screeningSeatId: ss.id,
          });
        }
        setRealSeats(normalized.length ? normalized : null);
      }
      toast('Butacas sincronizadas correctamente.', 'success');
    } catch {
      toast('Error al sincronizar butacas.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteSession = async () => {
    try {
      await sessionsService.remove(deleteSession.id);
      setSessions(prev => prev.filter(s => s.id !== deleteSession.id));
      toast('Sesión eliminada.', 'warning');
    } catch {
      toast('Error al eliminar la sesión.', 'error');
    } finally {
      setDeleteSession(null);
    }
  };

  const handleFullReset = async () => {
    setFullResetting(true);
    setFullResetProgress('Buscando sesiones…');
    try {
      // Backend requires date param — fetch a range of dates in parallel
      const today = new Date();
      const dates = Array.from({ length: 60 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - 14 + i); // -14 days to +45 days
        return d.toISOString().split('T')[0];
      });

      const results = await Promise.all(
        dates.map(date => sessionsService.getAll({ date }).catch(() => []))
      );

      // Deduplicate by session ID
      const seen = new Set();
      const list = [];
      for (const arr of results) {
        for (const s of (Array.isArray(arr) ? arr : [])) {
          if (!seen.has(s.id)) { seen.add(s.id); list.push(s); }
        }
      }

      let deleted = 0; let failed = 0;
      for (let i = 0; i < list.length; i++) {
        setFullResetProgress(`Eliminando ${i + 1} de ${list.length}…`);
        try {
          await sessionsService.remove(list[i].id);
          deleted++;
        } catch { failed++; }
      }

      setSessions([]);
      setShowFullResetConfirm(false);
      setFullResetProgress('');
      if (failed === 0) {
        toast(`Reset completado: ${deleted} sesión${deleted !== 1 ? 'es' : ''} eliminada${deleted !== 1 ? 's' : ''}.`, 'success');
      } else {
        toast(`${deleted} eliminadas, ${failed} no se pudieron borrar.`, 'warning');
      }
    } catch {
      toast('Error durante el reset total.', 'error');
      setFullResetProgress('');
    } finally {
      setFullResetting(false);
    }
  };

  const handleResetSessions = async () => {
    setResetting(true);
    const toDelete = [...filteredSessions];
    let deleted = 0;
    let failed  = 0;
    for (const s of toDelete) {
      try {
        await sessionsService.remove(s.id);
        setSessions(prev => prev.filter(x => x.id !== s.id));
        deleted++;
      } catch {
        failed++;
      }
    }
    setShowResetConfirm(false);
    setResetting(false);
    if (failed === 0) {
      toast(`${deleted} sesión${deleted !== 1 ? 'es' : ''} eliminada${deleted !== 1 ? 's' : ''}. Ahora puedes crear las nuevas.`, 'success');
    } else {
      toast(`${deleted} eliminada${deleted !== 1 ? 's' : ''}, ${failed} no se pudo${failed !== 1 ? 'n' : ''} borrar (tienen entradas vendidas).`, 'warning');
    }
  };

  useEffect(() => {
    if (!showNewSession && !editSession) return;
    if (showNewSession) setNewForm(prev => ({ ...prev, date: selectedDate, time: '' }));
    Promise.all([moviesService.getActive(), roomsService.getAll()])
      .then(([mv, rm]) => {
        setNewMovies(Array.isArray(mv) ? mv : []);
        setNewRooms(Array.isArray(rm) ? rm : []);
      })
      .catch(() => {});
  }, [showNewSession, editSession, selectedDate]);

  const handleCreateSession = async () => {
    if (!newForm.movieId || !newForm.theaterId || !newForm.date || !newForm.time || !newForm.basePrice) {
      toast('Película, sala, fecha, hora y precio son obligatorios.', 'error'); return;
    }
    setNewSaving(true);
    try {
      const saved = await sessionsService.create({
        movieId:   Number(newForm.movieId),
        theaterId: Number(newForm.theaterId),
        startTime: `${newForm.date}T${newForm.time}`,
        basePrice: Number(newForm.basePrice),
      });
      setSessions(prev => mergeSessionPosters([...prev, saved]));
      setShowNewSession(false);
      toast('Sesión creada correctamente.', 'success');
    } catch {
      toast('Error al crear la sesión.', 'error');
    } finally {
      setNewSaving(false);
    }
  };

  // Translated ticket types (computed in render so they react to language changes)
  const ticketTypes = TICKET_TYPES.map(tt => ({ ...tt, label: t(`box_office.type.${tt.id}`) }));

  useEffect(() => {
    setLoadingSessions(true);
    sessionsService.getAll({ date: selectedDate })
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setSessions(mergeSessionPosters(arr));
      })
      .catch(() => toast('Error al cargar sesiones.', 'error'))
      .finally(() => setLoadingSessions(false));
  }, [selectedDate]);

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
    // For today: hide sessions that ended more than 3 h ago (backend may return past ones)
    if (selectedDate === new Date().toISOString().split('T')[0]) {
      const dt = s.startTime ?? s.dateTime ?? null;
      if (dt) {
        const started = new Date(dt);
        if (Date.now() - started.getTime() > 3 * 60 * 60 * 1000) return false;
      }
    }
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

  const selectSession = async (session) => {
    if (!session) return;
    setSelectedSession(session);
    setSelectedSeats([]);
    setSeatTypes({});
    setRealSeats(null);
    setStep('seats');
    setLoadingSeats(true);

    if (!session.theater && !session.room && session.room_id) {
      roomsService.getById(session.room_id).then(room => {
        if (room) setSelectedSession(prev => prev ? { ...prev, theater: room, room } : prev);
      }).catch(() => {});
    }

    const theaterId = session.theater?.id ?? session.room?.id ?? null;
    activeSessionRef.current = session.id;

    try {
      let [screeningData, theaterData] = await Promise.all([
        seatsService.getByScreening(session.id),
        theaterId ? seatsService.getByTheater(theaterId) : Promise.resolve([]),
      ]);

      if (activeSessionRef.current !== session.id) return;

      let screeningSeats = Array.isArray(screeningData) ? screeningData : [];
      const theaterSeats = Array.isArray(theaterData)   ? theaterData   : [];

      // Auto-sync: if this screening has no ScreeningSeats yet, create them
      if (screeningSeats.length === 0 && theaterSeats.length > 0) {
        try {
          const synced = await sessionsService.syncSeats(session.id);
          if (Array.isArray(synced) && synced.length > 0) screeningSeats = synced;
        } catch {}
      }

      const screeningByPos = new Map();
      for (const ss of screeningSeats) {
        const seat = ss.seat ?? ss;
        if (seat?.row && seat.number != null) {
          screeningByPos.set(`${seat.row}-${seat.number}`, ss);
        }
      }

      const layout = theaterSeats.length > 0
        ? theaterSeats
        : screeningSeats.map(ss => ss.seat ?? ss);

      const seen       = new Set();
      const normalized = [];
      for (const seat of layout) {
        if (!seat?.row || seat.number == null) continue;
        const displayId = `${seat.row}${String(seat.number).padStart(2, '0')}`;
        if (seen.has(displayId)) continue;
        seen.add(displayId);
        const ss = screeningByPos.get(`${seat.row}-${seat.number}`);
        normalized.push({
          id:              displayId,
          row:             seat.row,
          number:          seat.number,
          status:          ss ? (ss.status === 'available' ? 'available' : 'occupied') : 'unavailable',
          screeningSeatId: ss?.id ?? null,
        });
      }

      setRealSeats(normalized.length ? normalized : null);
    } catch {
      if (activeSessionRef.current === session.id) setRealSeats(null);
    } finally {
      if (activeSessionRef.current === session.id) setLoadingSeats(false);
    }
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
  // Per-seat total: each seat can have its own type
  const total = selectedSeats.reduce((sum, seatId) => {
    const typeId = seatTypes[seatId] || ticketType;
    const type   = ticketTypes.find(t => t.id === typeId) || ticketTypes[0];
    const isFidelity = !!(selectedClient?.fidelityDiscountEligible && typeId === 'adult');
    const price  = isFidelity ? +(type.price * 0.9).toFixed(2) : type.price;
    return sum + price + (extra?.price ?? 0);
  }, 0);
  const change           = cashGiven && payMethod === 'cash' ? (parseFloat(cashGiven) - total).toFixed(2) : null;

  const handleSeatToggle = useCallback((newSeats) => {
    setSeatTypes(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(s => { if (!newSeats.includes(s)) delete next[s]; });
      newSeats.forEach(s => { if (!(s in next)) next[s] = ticketType; });
      return next;
    });
    setSelectedSeats(newSeats);
  }, [ticketType]);

  const handlePay = useCallback(async () => {
    if (!selectedSeats.length) { toast('Selecciona al menos una butaca.', 'error'); return; }
    setPaying(true);
    try {
      const seatData = selectedSeats
        .map(seatStr => ({
          seatStr,
          screeningSeatId: realSeats?.find(s => s.id === seatStr)?.screeningSeatId,
          typeId: seatTypes[seatStr] || ticketType,
        }))
        .filter(d => d.screeningSeatId);

      if (!seatData.length) {
        toast('Error al identificar las butacas. Vuelve a seleccionarlas.', 'error');
        setPaying(false);
        return;
      }

      // Backend rule: CHILD requires at least 1 ADULT in same purchase
      const hasChild = seatData.some(d => d.typeId === 'child');
      const hasAdult = seatData.some(d => d.typeId === 'adult');
      if (hasChild && !hasAdult) {
        toast('Una entrada infantil requiere al menos una entrada adulto en la misma compra.', 'error');
        setPaying(false);
        return;
      }

      const res = await salesService.createPurchase({
        userId:        selectedClient?.id ?? user?.id,
        screeningId:   selectedSession.id,
        paymentMethod: PAY_METHOD_MAP[payMethod],
        tickets:       seatData.map(d => {
          const type = ticketTypes.find(t => t.id === d.typeId) || ticketTypes[0];
          return { screeningSeatId: d.screeningSeatId, ticketType: type.backendType ?? 'ADULT' };
        }),
      });

      if (res?.id) {
        await salesService.confirmPurchase(res.id);
      }

      const time = selectedSession.startTime?.split('T')[1]?.substring(0, 5) ?? selectedSession.dateTime?.split('T')[1]?.substring(0, 5) ?? '';
      const date = selectedSession.startTime?.split('T')[0] ?? selectedSession.dateTime?.split('T')[0] ?? '';

      const generated = (res?.tickets?.length > 0 ? res.tickets : []).map(tk => {
        const seatStr = `${tk.row}${String(tk.number).padStart(2, '0')}`;
        const qrValue = `LUMEN:${res.id}-${tk.id}|${movie?.title}|${theater?.name}|${date}|${time}|${seatStr}|${tk.ticketType}`;
        return {
          id:       `${res.id}-${tk.id}`,
          movie:    movie?.title,
          room:     theater?.name,
          date,
          time,
          seat:     seatStr,
          format:   movie?.format,
          language: movie?.language,
          qrValue,
        };
      });

      if (!generated.length) {
        selectedSeats.forEach(seat => {
          const qrValue = `LUMEN:${generateTicketId()}|${movie?.title}|${theater?.name}|${date}|${time}|${seat}|${baseType.backendType ?? 'ADULT'}`;
          generated.push({ id: generateTicketId(), movie: movie?.title, room: theater?.name, date, time, seat, format: movie?.format, language: movie?.language, qrValue });
        });
      }

      setTickets(generated);
      setStep('done');
    } catch (err) {
      console.error('[purchase] full error:', err?.message);
      // Extract backend message from "API 4xx /purchases: {\"message\":\"...\"}"
      let backendMsg = '';
      try { backendMsg = JSON.parse(err?.message?.replace(/^API \d+ [^:]+: /, '') ?? '{}').message ?? ''; } catch {}
      const status = err?.status ?? 0;
      const msg =
        status === 409 ? 'Una o más butacas ya han sido reservadas. Actualiza el mapa e inténtalo de nuevo.' :
        status === 422 ? (backendMsg || 'Compra no válida. Revisa los tipos de entrada.') :
        status === 400 ? (backendMsg || 'Solicitud incorrecta. Revisa los datos.') :
        backendMsg || 'Error al procesar el cobro. Inténtalo de nuevo.';
      toast(msg, 'error');
    } finally {
      setPaying(false);
    }
  }, [selectedSeats, seatTypes, ticketType, ticketTypes, realSeats, selectedSession, extra, total, payMethod, user, selectedClient, movie, theater, toast]);

  const reset = useCallback(() => {
    setStep('sessions');
    setSelectedSession(null);
    setRealSeats(null);
    setSelectedSeats([]);
    setSeatTypes({});
    setPayMethod('card');
    setCashGiven('');
    setTickets([]);
    setSearchQuery('');
    setClientQuery('');
    setClientResults([]);
    setSelectedClient(null);
  }, []);

  // Atajos POS: F2=buscar sesión, F4=cobrar, F5=nueva venta, Esc=paso anterior
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2' && step === 'sessions') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'F4' && step === 'seats' && selectedSeats.length > 0 && !paying) {
        e.preventDefault();
        handlePay();
      } else if (e.key === 'F5') {
        e.preventDefault();
        reset();
        setTimeout(() => searchRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && step === 'seats') {
        setStep('sessions');
        setSelectedSeats([]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, selectedSeats, paying, handlePay, reset]);

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
              <input
                type="date"
                className={styles.datePicker}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                aria-label="Fecha de sesiones"
              />
              <div className={styles.searchBox}>
                <Search size={12} className={styles.searchIcon} aria-hidden="true" />
                <input className={styles.searchInput}
                  ref={searchRef}
                  aria-label={t('box_office.search')}
                  placeholder={t('box_office.search')}
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <button className={styles.newSessionBtn} onClick={() => setShowNewSession(true)} title="Nueva sesión">
                <Plus size={14} />
                <span>Nueva sesión</span>
              </button>
              <button className={styles.refundHeaderBtn} onClick={() => { setShowRefund(true); setRefundQR(''); setRefundParsed(null); setRefundMode('qr'); }} title="Devolución de entrada">
                <RotateCcw size={14} />
                <span>Devolución</span>
              </button>
              <button className={styles.fullResetBtn} onClick={() => setShowFullResetConfirm(true)} title="Reset total — borrar TODAS las sesiones">
                <Trash2 size={12} />
                <span>Reset total</span>
              </button>
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
                              <div key={s.id} className={styles.timeBtnWrap}>
                                <button
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
                                <div className={styles.timeBtnActions}>
                                  <button className={styles.timeBtnEdit} onClick={e => openEditSession(s, e)} title="Editar sesión">
                                    <Edit2 size={11} />
                                  </button>
                                  <button className={styles.timeBtnDelete} onClick={e => { e.stopPropagation(); setDeleteSession(s); }} title="Eliminar sesión">
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
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
                  onToggle={handleSeatToggle}
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
                  { id: 'card', label: t('box_office.pay.card'), Icon: CreditCard },
                  { id: 'cash', label: t('box_office.pay.cash'), Icon: Banknote   },
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
            <button className={styles.clearCart} aria-label={t('box_office.clearSelection')} onClick={() => { setSelectedSeats([]); setSeatTypes({}); }}>
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
                {selectedSeats.map(s => {
                  const typeId   = seatTypes[s] || ticketType;
                  const type     = ticketTypes.find(t => t.id === typeId) || ticketTypes[0];
                  const isFid    = !!(selectedClient?.fidelityDiscountEligible && typeId === 'adult');
                  const seatPrice = (isFid ? +(type.price * 0.9).toFixed(2) : type.price) + (extra?.price ?? 0);
                  return (
                    <div key={s} className={styles.cartSeat}>
                      <span className={styles.cartSeatId}>{s}</span>
                      <select
                        className={styles.cartSeatTypeSelect}
                        value={typeId}
                        onChange={e => setSeatTypes(prev => ({ ...prev, [s]: e.target.value }))}
                        aria-label={`Tipo de entrada butaca ${s}`}
                      >
                        {ticketTypes.filter(tt => !tt.extra).map(tt => (
                          <option key={tt.id} value={tt.id}>{tt.label}</option>
                        ))}
                      </select>
                      <span className={styles.cartSeatPrice}>€{seatPrice.toFixed(2)}</span>
                      <button className={styles.cartSeatRemove}
                        aria-label={`${t('box_office.removeSeat')} ${s}`}
                        onClick={() => {
                          setSelectedSeats(prev => prev.filter(x => x !== s));
                          setSeatTypes(prev => { const n = { ...prev }; delete n[s]; return n; });
                        }}>
                        <X size={10} aria-hidden="true" />
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

      {/* ── Modal devolución ─────────────────────── */}
      {showRefund && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Devolución de entrada">
          <div className={styles.modalBox} style={{ maxWidth: 400 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><RotateCcw size={15} /> Devolución de entrada</h3>
              <button className={styles.modalClose} onClick={() => setShowRefund(false)}><X size={15} /></button>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.modalLabel}>Nº de ticket (ej: 30-56)</label>
              <input
                className={styles.modalInput}
                placeholder="Escanea el QR o escribe el número"
                value={refundInput}
                onChange={e => setRefundInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRefundSubmit()}
                autoFocus
              />
              <p className={styles.modalSyncHint}>
                El número aparece en el ticket impreso bajo el QR. También puedes pegar el contenido del QR directamente.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalCancel} onClick={() => setShowRefund(false)} disabled={refundProcessing}>Cancelar</button>
              <button className={styles.modalSave} style={{ background: 'var(--red)' }}
                onClick={handleRefundSubmit} disabled={refundProcessing || !refundInput.trim()}>
                {refundProcessing ? <Loader size={14} /> : <RotateCcw size={14} />}
                {refundProcessing ? 'Procesando…' : 'Confirmar devolución'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recibo de devolución ─────────────────── */}
      {refundReceipt && (
        <RefundReceipt receipt={refundReceipt} onClose={() => setRefundReceipt(null)} t={t} />
      )}

      {/* ── Modal nueva sesión ────────────────────── */}
      {showNewSession && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Nueva sesión">
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><Film size={15} /> Nueva sesión</h3>
              <button className={styles.modalClose} onClick={() => setShowNewSession(false)} aria-label="Cerrar"><X size={15} /></button>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.modalLabel}>Película *</label>
              <select className={styles.modalSelect} value={newForm.movieId} onChange={e => setNF('movieId', e.target.value)}>
                <option value="">— Selecciona película —</option>
                {newMovies.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>

              <label className={styles.modalLabel}>Sala *</label>
              <select className={styles.modalSelect} value={newForm.theaterId} onChange={e => setNF('theaterId', e.target.value)}>
                <option value="">— Selecciona sala —</option>
                {newRooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.capacity} butacas)</option>
                ))}
              </select>

              <div className={styles.modalRow}>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Fecha *</label>
                  <input type="date" className={styles.modalInput} value={newForm.date} onChange={e => setNF('date', e.target.value)} />
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Hora *</label>
                  <input type="time" className={styles.modalInput} value={newForm.time} onChange={e => setNF('time', e.target.value)} />
                </div>
              </div>

              <label className={styles.modalLabel}>Precio base (€) *</label>
              <input type="number" className={styles.modalInput} min="0.01" step="0.50"
                placeholder="Ej: 9.00" required
                value={newForm.basePrice} onChange={e => setNF('basePrice', e.target.value)} />
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalCancel} onClick={() => setShowNewSession(false)}>Cancelar</button>
              <button className={styles.modalSave} onClick={handleCreateSession} disabled={newSaving}>
                {newSaving ? <Loader size={14} /> : <CheckCircle size={14} />}
                Crear sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal editar sesión ───────────────────────── */}
      {editSession && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Editar sesión">
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><Edit2 size={15} /> Editar sesión</h3>
              <button className={styles.modalClose} onClick={() => setEditSession(null)} aria-label="Cerrar"><X size={15} /></button>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.modalLabel}>Película *</label>
              <select className={styles.modalSelect} value={editForm.movieId} onChange={e => setEF('movieId', e.target.value)}>
                <option value="">— Selecciona película —</option>
                {newMovies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>

              <label className={styles.modalLabel}>Sala *</label>
              <select className={styles.modalSelect} value={editForm.theaterId} onChange={e => setEF('theaterId', e.target.value)}>
                <option value="">— Selecciona sala —</option>
                {newRooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity} but.)</option>)}
              </select>

              <div className={styles.modalRow}>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Fecha *</label>
                  <input type="date" className={styles.modalInput} value={editForm.date} onChange={e => setEF('date', e.target.value)} />
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Hora *</label>
                  <input type="time" className={styles.modalInput} value={editForm.time} onChange={e => setEF('time', e.target.value)} />
                </div>
              </div>

              <label className={styles.modalLabel}>Precio base (€) *</label>
              <input type="number" className={styles.modalInput} min="0.01" step="0.50"
                placeholder="Ej: 9.00" required
                value={editForm.basePrice} onChange={e => setEF('basePrice', e.target.value)} />
            </div>

            <div className={styles.modalSync}>
              <button className={styles.modalSyncBtn} onClick={handleSyncSeats} disabled={syncing}>
                {syncing ? <Loader size={13} /> : <Film size={13} />}
                {syncing ? 'Sincronizando…' : 'Resincronizar butacas con la sala'}
              </button>
              <span className={styles.modalSyncHint}>Actualiza las butacas de esta sesión si la sala cambió de capacidad</span>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalCancel} onClick={() => setEditSession(null)}>Cancelar</button>
              <button className={styles.modalSave} onClick={handleEditSession} disabled={editSaving}>
                {editSaving ? <Loader size={14} /> : <CheckCircle size={14} />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset total (todos los días) ─────────────── */}
      {showFullResetConfirm && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalBox} style={{ maxWidth: 420 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: 'var(--red)' }}><Trash2 size={15} /> Reset total</h3>
              <button className={styles.modalClose} onClick={() => !fullResetting && setShowFullResetConfirm(false)}><X size={15} /></button>
            </div>
            <div className={styles.modalBody}>
              {fullResetting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-2)', padding: '8px 0' }}>
                  <Loader size={16} />
                  <span>{fullResetProgress}</span>
                </div>
              ) : (
                <>
                  <p style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: 'var(--fs-md)', marginBottom: 8 }}>
                    Se eliminarán TODAS las sesiones de todos los días.
                  </p>
                  <p style={{ color: 'var(--text-3)', fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>
                    Las entradas vendidas se cancelarán automáticamente antes de borrar cada sesión. Esta acción no se puede deshacer.
                  </p>
                </>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalCancel} onClick={() => setShowFullResetConfirm(false)} disabled={fullResetting}>Cancelar</button>
              <button className={styles.modalSave} style={{ background: 'var(--red)' }} onClick={handleFullReset} disabled={fullResetting}>
                {fullResetting ? <Loader size={14} /> : <Trash2 size={14} />}
                {fullResetting ? fullResetProgress : 'Borrar todo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm reset todas las sesiones del día ──── */}
      {showResetConfirm && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalBox} style={{ maxWidth: 400 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><Trash2 size={15} /> Borrar sesiones del día</h3>
              <button className={styles.modalClose} onClick={() => setShowResetConfirm(false)}><X size={15} /></button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'var(--text-2)', fontSize: 'var(--fs-md)', lineHeight: 1.6 }}>
                Se eliminarán <strong>{filteredSessions.length} sesión{filteredSessions.length !== 1 ? 'es' : ''}</strong> del {selectedDate}.
              </p>
              <p style={{ color: 'var(--text-3)', fontSize: 'var(--fs-sm)', marginTop: 8, lineHeight: 1.5 }}>
                Las sesiones con entradas vendidas no se podrán borrar y se te avisará. El resto se eliminarán permanentemente.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalCancel} onClick={() => setShowResetConfirm(false)} disabled={resetting}>Cancelar</button>
              <button className={styles.modalSave} style={{ background: 'var(--red)' }} onClick={handleResetSessions} disabled={resetting}>
                {resetting ? <Loader size={14} /> : <Trash2 size={14} />}
                {resetting ? 'Borrando…' : 'Sí, borrar todas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete sesión ─────────────────────── */}
      {deleteSession && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalBox} style={{ maxWidth: 380 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><Trash2 size={15} /> Eliminar sesión</h3>
              <button className={styles.modalClose} onClick={() => setDeleteSession(null)}><X size={15} /></button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'var(--text-2)', fontSize: 'var(--fs-md)', lineHeight: 1.5 }}>
                ¿Eliminar la sesión de <strong>{deleteSession.movie?.title}</strong> a las{' '}
                <strong>{(deleteSession.startTime ?? deleteSession.dateTime ?? '').split('T')[1]?.substring(0, 5)}</strong>?
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalCancel} onClick={() => setDeleteSession(null)}>Cancelar</button>
              <button className={styles.modalSave} style={{ background: 'var(--red)' }} onClick={handleDeleteSession}>
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Refund receipt ──────────────────────────────── */
function RefundReceipt({ receipt, onClose, t }) {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 200);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className={styles.successShell}>
      <div className={styles.ticketCard} style={{ borderColor: 'rgba(220,40,74,.3)' }}>
        <div className={styles.ticketCardHeader} style={{ background: 'rgba(220,40,74,.12)', color: 'var(--red,#e0294a)' }}>
          <RotateCcw size={15} className={styles.ticketCardLogo} />
          <span>LUMEN CINEMA — REEMBOLSO</span>
        </div>
        <div className={styles.ticketCardDivider} />
        <h3 className={styles.ticketCardMovie}>{receipt.movie}</h3>
        <p className={styles.ticketCardFormat}>{receipt.ticketType}</p>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketCardInfo}>
          <div><span className={styles.tcLabel}>FECHA</span><span className={styles.tcVal}>{receipt.date}</span></div>
          <div><span className={styles.tcLabel}>HORA</span><span className={styles.tcVal}>{receipt.time} h</span></div>
          <div><span className={styles.tcLabel}>SALA</span><span className={styles.tcVal}>{receipt.theater}</span></div>
          <div><span className={styles.tcLabel}>BUTACA</span><span className={styles.tcVal}>{receipt.seat}</span></div>
        </div>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketCardTotal}>
          <span className={styles.tcLabel}>IMPORTE DEVUELTO</span>
          <span className={styles.tcTotalVal} style={{ color: 'var(--red,#e0294a)' }}>REEMBOLSO</span>
        </div>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketQRWrap}>
          <div role="img" aria-label="QR de comprobante de reembolso">
            <QRCodeSVG value={`REFUND:${receipt.refundId}`} size={110} bgColor="transparent" fgColor="var(--text-1)" level="M" />
          </div>
          <div className={styles.ticketQRInfo}>
            <span className={styles.ticketQRLabel}>Comprobante reembolso</span>
            <span className={styles.ticketId}>{receipt.refundId}</span>
            <span className={styles.ticketIdSeat}>Compra #{receipt.purchaseId}</span>
            <span className={styles.ticketIdSeat}>{new Date(receipt.refundedAt).toLocaleString('es-ES')}</span>
          </div>
        </div>
        <div className={styles.ticketCardDivider} />
        <p className={styles.ticketFooter}>Conserve este comprobante. El importe se abonará en 1-3 días hábiles si fue con tarjeta.</p>
      </div>

      <div className={styles.ticketActions}>
        <button className={styles.printBtn} onClick={() => window.print()}>
          <Printer size={14} /> Imprimir comprobante
        </button>
        <button className={styles.newSaleBtn} onClick={onClose}>
          <X size={14} /> Cerrar
        </button>
      </div>
    </div>
  );
}

/* ── Ticket success screen ───────────────────────── */
function TicketSuccess({ tickets, total, payMethod, onReset, t }) {
  const [current, setCurrent] = useState(0);
  const ticket    = tickets[current];

  useEffect(() => {
    const id = setTimeout(() => window.print(), 300);
    return () => clearTimeout(id);
  }, []);
  const PAY_LABEL = {
    card: t('box_office.pay.card'),
    cash: t('box_office.pay.cash'),
  };

  const langLabel = (lang) => {
    if (lang === 'ES') return t('box_office.ticket.dubbed');
    if (lang === 'VO') return t('box_office.ticket.original');
    return t('box_office.ticket.subbed');
  };

  return (
    <div className={styles.successShell}>
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

      <div className={styles.ticketActions}>
        {tickets.length > 1 && (
          <div className={styles.ticketNav} role="group" aria-label={t('box_office.ticketNavLabel')}>
            {tickets.map((_, i) => (
              <button key={i} className={`${styles.ticketNavBtn} ${i === current ? styles.ticketNavActive : ''}`}
                aria-pressed={i === current}
                onClick={() => setCurrent(i)}>{i + 1}</button>
            ))}
          </div>
        )}
        <button className={styles.printBtn} onClick={() => window.print()}>
          <Printer size={14} /> {t('box_office.success.print')}
        </button>
        <button className={styles.newSaleBtn} onClick={onReset}>
          <Ticket size={14} /> {t('box_office.success.newSale')}
        </button>
      </div>
    </div>
  );
}
