import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Film, ChevronRight,
  CreditCard, Banknote, Printer,
  CheckCircle, X, Ticket, ArrowLeft, Search,
  Loader, Star, UserX, Plus, Edit2, Trash2, RotateCcw, User, UserPlus
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
  { id: 'adult',    price: 9.00, backendType: 'ADULT'   },
  { id: 'senior',   price: 2.00,  backendType: 'SENIOR'  },
  { id: 'student',  price: 6.00,  backendType: 'STUDENT' },
  { id: 'child',    price: 6.00,  backendType: 'CHILD'   },
];

const VIP_SEAT_SUPPLEMENT = 1.00;

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

function generateOfflineSeats(sessionId, capacity = 100, roomName = '') {
  const isVipRoom = roomName.toUpperCase().includes('VIP');
  const COLS = capacity <= 80 ? 8 : capacity <= 150 ? 12 : 16;
  const ROWS = Math.ceil(capacity / COLS);
  const VIP_ROW_COUNT = isVipRoom ? 2 : 0;
  const seats = [];
  let fakeId = 900000 + ((sessionId ?? 0) * 100);
  for (let r = 0; r < ROWS; r++) {
    const row = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[r] ?? `R${r + 1}`;
    const rowLetter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[r] ?? '';
    const seatType  = rowLetter === 'E' || rowLetter === 'F' ? 'VIP' : 'NORMAL';
    for (let c = 0; c < COLS; c++) {
      if (r * COLS + c >= capacity) break;
      seats.push({ id: `${row}${String(c + 1).padStart(2, '0')}`, row, number: c + 1, status: 'available', screeningSeatId: fakeId++, seatType });
    }
  }
  return seats;
}

export default function TaquillaPage() {
  const { toast } = useApp();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isCajero = user?.role === 'CAJERO';


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
  const [guestEmail, setGuestEmail]           = useState('');
  const [isMember, setIsMember]             = useState(null); // null=unasked, true=member, false=guest
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '', lastName: '', username: '', email: '', password: '',
    dateOfBirth: '', student: false, isFidelityMember: false,
  });
  const [registering, setRegistering] = useState(false);
  const clientDebounce   = useRef(null);
  const searchRef        = useRef(null);
  const activeSessionRef = useRef(null); // race-condition guard

  // ── Modal datos cliente ─────────────────────────
  const [showClientModal, setShowClientModal]   = useState(false);
  const [pendingSession,  setPendingSession]    = useState(null);

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
      let amount = null;
      let purchaseTickets = [];
      let purchaseMovie = '';
      let purchaseTheater = '';
      let purchaseDate = '';
      let purchaseTime = '';
      try {
        const purchase = await salesService.getById(data.purchaseId);
        purchaseTickets = purchase?.tickets ?? [];
        purchaseMovie   = purchase?.movieTitle  ?? '';
        purchaseTheater = purchase?.theaterName ?? '';
        if (purchase?.startTime) {
          const dt = new Date(purchase.startTime);
          purchaseDate = dt.toLocaleDateString('es-ES');
          purchaseTime = dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
        if (typeof purchase?.totalAmount === 'number') {
          amount = purchase.totalAmount;
        } else if (typeof purchase?.totalAmount === 'string') {
          amount = parseFloat(purchase.totalAmount);
        } else if (purchaseTickets.length > 0) {
          const TYPE_PRICE = { ADULT: 9.00, SENIOR: 2.00, STUDENT: 6.00, CHILD: 6.00 };
          amount = purchaseTickets.reduce((s, tk) => s + (TYPE_PRICE[tk.ticketType] ?? 9.00), 0);
        }
      } catch {}

      await salesService.cancelPurchase(data.purchaseId);

      const seats = purchaseTickets.length > 0
        ? purchaseTickets.map(tk => `${tk.row}${String(tk.number).padStart(2,'0')}`).join(', ')
        : (data.seat || '—');
      const types = purchaseTickets.length > 0
        ? [...new Set(purchaseTickets.map(tk => tk.ticketType))].join(', ')
        : (data.ticketType || '—');

      setRefundReceipt({
        refundId:   `RF-${data.purchaseId}-${Date.now().toString(36).toUpperCase()}`,
        refundedAt: new Date().toISOString(),
        movie:      data.movie   || purchaseMovie   || '—',
        theater:    data.theater || purchaseTheater || '—',
        date:       data.date    || purchaseDate    || '—',
        time:       data.time    || purchaseTime    || '—',
        seat:       seats,
        ticketType: types,
        purchaseId: data.purchaseId,
        amount,
        numTickets: purchaseTickets.length || 1,
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
    if (!newForm.movieId || !newForm.theaterId || !newForm.date || !newForm.time) {
      toast('Película, sala, fecha y hora son obligatorios.', 'error'); return;
    }
    setNewSaving(true);
    try {
      const saved = await sessionsService.create({
        movieId:   Number(newForm.movieId),
        theaterId: Number(newForm.theaterId),
        startTime: `${newForm.date}T${newForm.time}`,
        basePrice: TICKET_TYPES[0].price,
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

    activeSessionRef.current = session.id;

    const normalizeSeats = (raw) => {
      const list = Array.isArray(raw) ? raw
        : Array.isArray(raw?.content) ? raw.content
        : Array.isArray(raw?.data)    ? raw.data
        : Array.isArray(raw?.seats)   ? raw.seats
        : Array.isArray(raw?.items)   ? raw.items
        : [];
      const now  = Date.now();
      const seen = new Set();
      const out  = [];
      for (const ss of list) {
        if (ss?.id == null) continue;
        const seatObj = ss.seat ?? ss;
        const row     = ss.row    ?? seatObj.row;
        const number  = ss.number ?? seatObj.number ?? seatObj.seatNumber ?? seatObj.col;
        if (!row || number == null) continue;
        const displayId = `${String(row).toUpperCase()}${String(number).padStart(2, '0')}`;
        if (seen.has(displayId)) continue;
        seen.add(displayId);
        const statusLow = (ss.status ?? '').toLowerCase();
        const isOccupied =
          ss.occupied === true ||
          (ss.reservedUntil && new Date(ss.reservedUntil).getTime() > now) ||
          (statusLow !== '' && statusLow !== 'available');
        const rawType  = (seatObj.seatType ?? seatObj.seat_type ?? ss.seatType ?? '').toUpperCase();
        const seatType = rawType === 'VIP' || row === 'E' || row === 'F' ? 'VIP' : 'NORMAL';
        out.push({
          id: displayId, row: String(row).toUpperCase(), number,
          status:          isOccupied ? 'occupied' : 'available',
          screeningSeatId: ss.id,
          seatId:          seatObj.id ?? ss.seatId ?? ss.id,
          seatType,
        });
      }
      return out;
    };

    const sessionRoom     = session.theater ?? session.room;
    const sessionCapacity = sessionRoom?.capacity ?? 100;
    const sessionRoomName = sessionRoom?.name ?? '';

    sessionsService.syncSeats(session.id)
      .catch(() => seatsService.getByScreening(session.id))
      .then(data => {
        if (activeSessionRef.current !== session.id) return;
        const normalized = normalizeSeats(data);
        setRealSeats(normalized.length ? normalized : generateOfflineSeats(session.id, sessionCapacity, sessionRoomName));
      })
      .catch(() => {
        if (activeSessionRef.current !== session.id) return;
        setRealSeats(generateOfflineSeats(session.id, sessionCapacity, sessionRoomName));
      })
      .finally(() => {
        if (activeSessionRef.current === session.id) setLoadingSeats(false);
      });
  };

  const movie   = selectedSession?.movie ?? selectedSession?.film ?? null;
  const theater = selectedSession?.theater ?? selectedSession?.room ?? null;

  const seatMapSession = selectedSession ? {
    id:   selectedSession.id,
    sold: realSeats
      ? realSeats.filter(s => s.status === 'occupied' || s.status === 'reserved').length
      : (() => {
          const cap = theater?.capacity ?? 100;
          const avail = selectedSession.availableSeats;
          if (avail != null) return Math.max(0, cap - avail);
          return selectedSession.sold ?? 0;
        })(),
  } : null;
  const seatMapRoom = theater ? {
    capacity: theater.capacity ?? 100,
    format:   movie?.format ?? '',
    name:     theater.name ?? '',
  } : null;

  const baseType       = ticketTypes.find(t => t.id === ticketType) || ticketTypes[0];
  const basePrice      = baseType.price;
  // +€3 solo para salas 4D/4DX
  const is4D  = /4D|4DX/i.test(theater?.name ?? movie?.format ?? '');
  const extra = is4D ? { price: 3.00, label: '4D' } : null;
  const clientVisits     = Number(selectedClient?.annualVisits ?? selectedClient?.visitsPerYear ?? 0);
  const fidelityEligible = !!(selectedClient && clientVisits > 10 && ticketType === 'adult');
  const discountedBase   = fidelityEligible ? +(basePrice * 0.9).toFixed(2) : basePrice;
  // Per-seat total: tipo por butaca + VIP automático si el asiento es VIP + suplemento 4D
  const total = selectedSeats.reduce((sum, seatId) => {
    const typeId = seatTypes[seatId] || ticketType;
    const type   = ticketTypes.find(t => t.id === typeId) || ticketTypes[0];
    const isFidelity = !!(selectedClient && (Number(selectedClient?.annualVisits ?? selectedClient?.visitsPerYear ?? 0)) > 10 && typeId === 'adult');
    const price  = isFidelity ? +(type.price * 0.9).toFixed(2) : type.price;
    const seat   = realSeats?.find(s => s.id === seatId);
    const isVip  = (seat?.seatType ?? '').toUpperCase() === 'VIP';
    return sum + price + (isVip ? VIP_SEAT_SUPPLEMENT : 0) + (extra?.price ?? 0);
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
      // Fetch fresh screening seats — fall back to already-loaded realSeats if sync fails
      let normalized = [];
      try {
        const freshData = await sessionsService.syncSeats(selectedSession.id);
        const raw = Array.isArray(freshData) ? freshData
          : Array.isArray(freshData?.content) ? freshData.content
          : Array.isArray(freshData?.data)    ? freshData.data
          : Array.isArray(freshData?.seats)   ? freshData.seats
          : [];
        const seen = new Set();
        for (const ss of raw) {
          if (ss?.id == null) continue;
          const seatObj = ss.seat ?? ss;
          const row     = ss.row    ?? seatObj.row;
          const number  = ss.number ?? seatObj.number ?? seatObj.seatNumber ?? seatObj.col;
          if (!row || number == null) continue;
          const displayId = `${String(row).toUpperCase()}${String(number).padStart(2, '0')}`;
          if (seen.has(displayId)) continue;
          seen.add(displayId);
          const statusLow = (ss.status ?? '').toLowerCase();
          normalized.push({
            id: displayId, row: String(row).toUpperCase(), number,
            status: (statusLow !== '' && statusLow !== 'available') ? 'occupied' : 'available',
            screeningSeatId: ss.id,
          });
        }
        if (normalized.length) setRealSeats(normalized);
      } catch {
        // syncSeats failed — use already-loaded seat map data
        normalized = realSeats ?? [];
      }

      // If sync returned nothing, fall back to realSeats
      if (!normalized.length) normalized = realSeats ?? [];

      let screeningSeatIds = selectedSeats
        .map(seatStr => normalized.find(s => s.id === seatStr)?.screeningSeatId)
        .filter(Boolean);

      if (!screeningSeatIds.length) {
        toast('Butaca no encontrada. Vuelve al mapa y selecciona las butacas de nuevo.', 'error');
        setPaying(false);
        return;
      }

      // Backend rule: CHILD requires at least 1 ADULT in same purchase
      const seatTypeIds = selectedSeats.map(s => seatTypes[s] || ticketType);
      const hasChild = seatTypeIds.includes('child');
      const hasAdult = seatTypeIds.includes('adult');
      if (hasChild && !hasAdult) {
        toast('Una entrada infantil requiere al menos una entrada adulto en la misma compra.', 'error');
        setPaying(false);
        return;
      }

      // Resolve user based on member/guest flow
      let resolvedUserId = null;
      let resolvedGuestEmail = '';

      if (isMember === true) {
        if (!selectedClient?.id) {
          toast('Por favor, busca y selecciona el socio antes de pagar.', 'error');
          setPaying(false);
          return;
        }
        resolvedUserId = selectedClient.id;
      } else if (selectedClient?.id) {
        resolvedUserId = selectedClient.id;
        resolvedGuestEmail = selectedClient.email || guestEmail;
      } else if (guestEmail.trim()) {
        resolvedGuestEmail = guestEmail.trim();
      }

      const purchaseBody = {
        screeningId:   selectedSession.id,
        paymentMethod: PAY_METHOD_MAP[payMethod],
        tickets: screeningSeatIds.map(screeningSeatId => {
          const seat   = realSeats?.find(s => s.screeningSeatId === screeningSeatId);
          const typeId = seat ? (seatTypes[seat.id] || ticketType) : ticketType;
          const type   = ticketTypes.find(t => t.id === typeId) || ticketTypes[0];
          return { screeningSeatId, ticketType: type.backendType ?? 'ADULT' };
        }),
      };
      if (resolvedUserId) purchaseBody.userId = resolvedUserId;
      else purchaseBody.guestEmail = resolvedGuestEmail || 'anonimo@taquilla.com';

      const res = await salesService.createPurchase(purchaseBody);

      if (res?.id) {
        try {
          const confirmed = await salesService.confirmPurchase(res.id);
          if (resolvedGuestEmail) {
            if (confirmed?.emailSent === false) {
              toast('Compra confirmada, pero el email no se pudo enviar. Revisa la configuración SMTP del servidor.', 'warning');
            } else {
              toast(`Ticket enviado por email a ${resolvedGuestEmail}`, 'success');
            }
          }
        } catch (confirmErr) {
          console.warn('[purchase] confirmPurchase error:', confirmErr?.message);
          if (resolvedGuestEmail) {
            toast('Compra confirmada, pero el email no se pudo enviar. Verifica el correo del cliente.', 'warning');
          }
        }
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
      console.error('[handlePay] error:', err);
      const status = err?.status ?? (err?.response?.status ?? (err?.message?.match(/API (\d+)/) ? Number(err.message.match(/API (\d+)/)[1]) : null));

      if (!status) {
        const time = selectedSession.startTime?.split('T')[1]?.substring(0, 5) ?? selectedSession.dateTime?.split('T')[1]?.substring(0, 5) ?? '';
        const date = selectedSession.startTime?.split('T')[0] ?? selectedSession.dateTime?.split('T')[0] ?? '';
        const localTickets = selectedSeats.map(seat => {
          const localId = generateTicketId();
          const typeId  = seatTypes[seat] || ticketType;
          const type    = ticketTypes.find(t => t.id === typeId) || ticketTypes[0];
          return {
            id: localId,
            movie: movie?.title,
            room: theater?.name,
            date, time, seat,
            format: movie?.format,
            language: movie?.language,
            qrValue: `LUMEN:${localId}|${movie?.title}|${theater?.name}|${date}|${time}|${seat}|${type.backendType ?? 'ADULT'}`,
          };
        });
        setTickets(localTickets);
        setStep('done');
        toast('Servidor no disponible — ticket generado en modo offline.', 'warning');
        return;
      }

      const rawBody = err?.message ?? '';
      const jsonText = rawBody.replace(/^API \d+ [^:]+:\s*/, '').trim();
      let backendMsg = '';
      try {
        const parsed = JSON.parse(jsonText);
        backendMsg = (parsed?.message ?? parsed?.error ?? parsed?.detail ?? parsed?.title ?? parsed?.msg ?? '').slice(0, 150);
      } catch {
        backendMsg = jsonText.slice(0, 150);
      }
      const msg =
        status === 404 && (rawBody.toLowerCase().includes('seat') || rawBody.toLowerCase().includes('butaca'))
          ? 'Butaca no encontrada. Vuelve al mapa y selecciona las butacas de nuevo.' :
        status === 404 ? 'Recurso no encontrado. Recarga la página e inténtalo de nuevo.' :
        status === 409 ? 'Esa butaca ya no está disponible.' :
        status === 422 && rawBody.toLowerCase().includes('minor') ? 'Un menor debe ir acompañado de un adulto.' :
        status === 422 ? 'Esta compra ya fue procesada.' :
        backendMsg ? `Error ${status}: ${backendMsg}` : `Error ${status ?? '?'}: no se pudo procesar el cobro.`;
      toast(msg, 'error');
    } finally {
      setPaying(false);
    }
  }, [selectedSeats, seatTypes, ticketType, ticketTypes, realSeats, selectedSession, extra, baseType, discountedBase, total, payMethod, selectedClient, guestEmail, movie, theater, toast]);

  const handleTimeClick = (session) => {
    setPendingSession(session);
    setIsMember(null);
    setSelectedClient(null);
    setGuestEmail('');
    setClientQuery('');
    setClientResults([]);
    setShowRegisterForm(false);
    setRegForm({ name: '', lastName: '', username: '', email: '', password: '', dateOfBirth: '', student: false, isFidelityMember: false });
    setShowClientModal(true);
  };

  const handleClientSubmit = () => {
    setShowClientModal(false);
    if (guestEmail.trim() && /\S+@\S+\.\S+/.test(guestEmail.trim())) {
      setGuestEmail(guestEmail.trim());
    }
    selectSession(pendingSession);
  };

  const handleClientDiscard = () => {
    setShowClientModal(false);
    setIsMember(null);
    setSelectedClient(null);
    setGuestEmail('');
    setShowRegisterForm(false);
    setRegForm({ name: '', lastName: '', username: '', email: '', password: '', dateOfBirth: '', student: false, isFidelityMember: false });
    selectSession(pendingSession);
  };

  const setRegField = (k, v) => setRegForm(prev => ({ ...prev, [k]: v }));

  const handleRegisterClient = async () => {
    if (!regForm.name.trim()) { toast('El nombre es obligatorio.', 'error'); return; }
    if (!regForm.email.trim()) { toast('El email es obligatorio.', 'error'); return; }
    if (!regForm.password.trim()) { toast('La contraseña es obligatoria.', 'error'); return; }
    if (!regForm.dateOfBirth.trim()) { toast('La fecha de nacimiento es obligatoria.', 'error'); return; }
    setRegistering(true);
    try {
      const payload = {
        name:           regForm.name,
        lastName:       regForm.lastName || '',
        email:          regForm.email,
        password:       regForm.password,
        birthDate:      regForm.dateOfBirth || null,
        student:        regForm.student,
        discountActive: false,
        role:           'CLIENT',
      };
      const raw = await clientsService.create(payload);
      const newClient = {
        id: raw?.id ?? raw?.userId ?? raw?.clientId,
        name: raw?.name ?? regForm.name,
        lastName: raw?.lastName ?? regForm.lastName,
        email: raw?.email ?? regForm.email,
        username: raw?.username ?? regForm.username ?? '',
        birthDate: raw?.birthDate ?? regForm.dateOfBirth,
        student: regForm.student,
      };
      setSelectedClient(newClient);
      setIsMember(true);
      setShowRegisterForm(false);
      setGuestEmail('');
      toast('Socio registrado correctamente ✓', 'success');
    } catch (err) {
      if (err?.status === 409) {
        toast('Este email ya está registrado.', 'error');
      } else {
        toast('Error al registrar el socio.', 'error');
      }
    }
    setRegistering(false);
  };

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
    setGuestEmail('');
    setIsMember(null);
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

  if (refundReceipt) {
    return <RefundReceipt receipt={refundReceipt} onClose={() => setRefundReceipt(null)} t={t} />;
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
              {!isCajero && (
                <button className={styles.newSessionBtn} onClick={() => setShowNewSession(true)} title="Nueva sesión">
                  <Plus size={14} />
                  <span>Nueva sesión</span>
                </button>
              )}
              {/* Botón devolución desactivado por petición del cliente */}
              {!isCajero && (
                <button className={styles.fullResetBtn} onClick={() => setShowFullResetConfirm(true)} title="Reset total — borrar TODAS las sesiones">
                  <Trash2 size={12} />
                  <span>Reset total</span>
                </button>
              )}
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

                            const isPrivate = (s.basePrice ?? s.price ?? 9) === 0;
                            return (
                              <div key={s.id} className={styles.timeBtnWrap}>
                                <button
                                  className={`${styles.timeBtn} ${isFull ? styles.timeBtnFull : ''}`}
                                  onClick={() => !isPrivate && handleTimeClick(s)}
                                  disabled={isFull || isPrivate}
                                  title={isPrivate ? 'Sala reservada — evento privado' : undefined}
                                >
                                  <span className={styles.timeBtnHour}>{time}</span>
                                  <span className={styles.timeBtnRoom}>{rm.name?.split('—')[0]?.trim() ?? `Sala ${s.room_id ?? ''}`}</span>
                                  <span className={styles.timeBtnOcc} style={{ color: isPrivate ? 'var(--yellow)' : OCC_COLOR(occPct) }}>
                                    {isPrivate ? '🔒 Reserva privada' : isFull ? t('box_office.full') : `${soldCnt}/${cap}`}
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
                {ticketTypes.map(tt => (
                  <button key={tt.id}
                    className={`${styles.typeBtn} ${ticketType === tt.id ? styles.typeBtnActive : ''}`}
                    aria-pressed={ticketType === tt.id}
                    onClick={() => setTicketType(tt.id)}>
                    <span>{tt.label}</span>
                    <span className={styles.typeBtnPrice}>€{tt.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
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

            {/* Client identity — selected in pre-seat modal */}
            <div className={styles.paySection}>
              <p className={styles.paySectionLabel}>{t('box_office.client')}</p>

              {selectedClient && isMember ? (
                <div className={styles.clientChip}>
                  <div className={styles.clientChipInfo}>
                    <span className={styles.clientChipName}>{selectedClient.name ?? selectedClient.username}</span>
                    <span className={styles.clientChipEmail}>{selectedClient.email ?? ''}</span>
                  </div>
                  {clientVisits > 10
                    ? <span className={styles.fidelityBadge}><Star size={10} /> −10%</span>
                    : <span className={styles.fidelityBadge} style={{ opacity: 0.55 }}><Star size={10} /> {clientVisits}/10 visitas</span>
                  }
                </div>
              ) : guestEmail ? (
                <div className={styles.clientChip}>
                  <div className={styles.clientChipInfo}>
                    <span className={styles.clientChipName}>Visita</span>
                    <span className={styles.clientChipEmail}>{guestEmail}</span>
                  </div>
                </div>
              ) : (
                <p className={styles.payMuted}>—</p>
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
              {selectedClient && !fidelityEligible && (
                <div className={styles.cartTypeRow} style={{ borderColor: 'rgba(100,100,100,0.15)' }}>
                  <span className={styles.cartTypeLabel} style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={10} /> Club Lumen · {clientVisits}/10 visitas — sin descuento aún
                  </span>
                </div>
              )}
              {extra && (
                <div className={styles.cartTypeRow} style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
                  <span className={styles.cartTypeLabel} style={{ color: 'var(--accent)' }}>+ Suplemento {extra.label}</span>
                  <span className={styles.cartTypePrice}>€{extra.price.toFixed(2)} / ud.</span>
                </div>
              )}
              <div className={styles.cartSeatsList}>
                {selectedSeats.map(s => {
                  const typeId    = seatTypes[s] || ticketType;
                  const type      = ticketTypes.find(t => t.id === typeId) || ticketTypes[0];
                  const isFid     = !!(selectedClient && (Number(selectedClient?.annualVisits ?? selectedClient?.visitsPerYear ?? 0)) > 10 && typeId === 'adult');
                  const seat      = realSeats?.find(r => r.id === s);
                  const isVip     = (seat?.seatType ?? '').toUpperCase() === 'VIP';
                  const seatPrice = (isFid ? +(type.price * 0.9).toFixed(2) : type.price) + (isVip ? VIP_SEAT_SUPPLEMENT : 0) + (extra?.price ?? 0);
                  return (
                    <div key={s} className={styles.cartSeat}>
                      <span className={styles.cartSeatId}>{s}{isVip && <span className={styles.vipBadge}>VIP</span>}</span>
                      <select
                        className={styles.cartSeatTypeSelect}
                        value={typeId}
                        onChange={e => setSeatTypes(prev => ({ ...prev, [s]: e.target.value }))}
                        aria-label={`Tipo de entrada butaca ${s}`}
                      >
                        {ticketTypes.map(tt => (
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

      {/* ── Modal socio / visita ────────────────── */}
      {showClientModal && pendingSession && (
        <div
          className={styles.modalBackdrop}
          onClick={e => e.target === e.currentTarget && handleClientDiscard()}
          onKeyDown={e => e.key === 'Escape' && handleClientDiscard()}
        >
          <div
            className={styles.modalBox}
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-modal-title"
            style={{ maxWidth: 360 }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <User size={15} aria-hidden="true" />
                <span id="client-modal-title">Cliente</span>
              </div>
              <button className={styles.modalClose} onClick={handleClientDiscard} aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {(pendingSession.movie?.title || pendingSession.startTime || pendingSession.dateTime) && (
                <p className={styles.modalSubtitle}>
                  {[
                    pendingSession.movie?.title,
                    pendingSession.startTime?.split('T')[1]?.substring(0, 5) || pendingSession.dateTime?.split('T')[1]?.substring(0, 5),
                  ].filter(Boolean).join(' · ')}
                </p>
              )}

              {/* Ask socio / visit */}
              {isMember === null && (
                <div className={styles.memberToggle}>
                  <p className={styles.memberToggleLabel}>¿El cliente es socio?</p>
                  <div className={styles.memberToggleBtns}>
                    <button className={`${styles.memberToggleBtn} ${styles.memberToggleYes}`}
                      autoFocus
                      onClick={() => setIsMember(true)}>
                      <User size={16} /> Sí, es socio
                    </button>
                    <button className={`${styles.memberToggleBtn} ${styles.memberToggleNo}`}
                      onClick={() => setIsMember(false)}>
                      <UserPlus size={16} /> No, es visita
                    </button>
                  </div>
                </div>
              )}

              {/* Socio flow — search clients */}
              {isMember === true && (
                <>
                  <div className={styles.memberLookup}>
                    <div className={styles.clientSearchWrap}>
                      <Search size={12} className={styles.searchIcon} />
                      <input className={styles.clientSearchInput}
                        placeholder="Buscar socio por nombre o email"
                        value={clientQuery}
                        onChange={e => { setClientQuery(e.target.value); setSelectedClient(null); }}
                        autoFocus
                      />
                      {clientSearching && <Loader size={12} className={styles.clientLoader} />}
                    </div>
                    {clientResults.length > 0 && !selectedClient && (
                      <div className={styles.clientDropdown}>
                        {clientResults.map(c => (
                          <button key={c.id} className={styles.clientDropdownItem}
                            onClick={() => { setSelectedClient(c); setClientQuery(''); setClientResults([]); }}>
                            <span className={styles.clientDropdownName}>{c.name ?? c.username}</span>
                            <span className={styles.clientDropdownEmail}>{c.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedClient && (
                    <div className={styles.clientChip}>
                      <div className={styles.clientChipInfo}>
                        <span className={styles.clientChipName}>{selectedClient.name ?? selectedClient.username}</span>
                        <span className={styles.clientChipEmail}>{selectedClient.email ?? ''}</span>
                      </div>
                      <button className={styles.clientChipRemove} aria-label="Quitar socio"
                        onClick={() => { setSelectedClient(null); setClientQuery(''); }}>
                        <UserX size={13} />
                      </button>
                    </div>
                  )}
                  <button className={styles.memberToggleBack}
                    onClick={() => { setIsMember(null); setSelectedClient(null); setClientQuery(''); setClientResults([]); }}>
                    ← Atrás
                  </button>
                </>
              )}

              {/* Visit flow — email + signup option */}
              {isMember === false && (
                <>
                  <div className={styles.guestFlow}>
                    <input className={styles.guestEmailInput}
                      type="email"
                      placeholder="Email para enviar el ticket (opcional)"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      autoFocus
                    />
                    <p className={styles.guestEmailHint}>Si introduces un email, el ticket se enviará por correo.</p>

                    {!showRegisterForm && (
                      <button className={styles.signupPromptBtn}
                        onClick={() => { setShowRegisterForm(true); setGuestEmail(''); }}>
                        <UserPlus size={14} /> ¿Quiere hacerse socio?
                      </button>
                    )}

                    {showRegisterForm && (
                      <div className={styles.registerForm}>
                        <p className={styles.registerFormTitle}>Nuevo socio</p>
                        <p className={styles.registerFormHint}>Completa los datos para registrar al cliente como socio.</p>

                        <div className={styles.modalRow}>
                          <div className={styles.modalField}>
                            <label className={styles.modalLabel}>Nombre *</label>
                            <input className={styles.modalInput} placeholder="Nombre"
                              value={regForm.name} onChange={e => setRegField('name', e.target.value)} />
                          </div>
                          <div className={styles.modalField}>
                            <label className={styles.modalLabel}>Apellidos</label>
                            <input className={styles.modalInput} placeholder="Apellidos"
                              value={regForm.lastName} onChange={e => setRegField('lastName', e.target.value)} />
                          </div>
                        </div>

                        <div className={styles.modalField}>
                          <label className={styles.modalLabel}>Email *</label>
                          <input className={styles.modalInput} type="email" placeholder="Email"
                            value={regForm.email} onChange={e => setRegField('email', e.target.value)} />
                        </div>

                        <div className={styles.modalField}>
                          <label className={styles.modalLabel}>Contraseña *</label>
                          <input className={styles.modalInput} type="password" placeholder="Contraseña"
                            value={regForm.password} onChange={e => setRegField('password', e.target.value)} />
                        </div>

                        <div className={styles.modalField}>
                          <label className={styles.modalLabel}>Fecha de nacimiento *</label>
                          <input className={styles.modalInput} type="date"
                            value={regForm.dateOfBirth} onChange={e => setRegField('dateOfBirth', e.target.value)} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="checkbox" id="reg-student" checked={regForm.student}
                            onChange={e => setRegField('student', e.target.checked)}
                            style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                          <label htmlFor="reg-student" style={{ fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
                            Es estudiante
                          </label>
                        </div>

                        <div className={styles.registerFormActions}>
                          <button className={styles.cancelBtn}
                            onClick={() => { setShowRegisterForm(false); setRegForm({ name: '', lastName: '', username: '', email: '', password: '', dateOfBirth: '', student: false, isFidelityMember: false }); }}>
                            Cancelar
                          </button>
                          <button className={styles.registerBtn} disabled={registering}
                            onClick={handleRegisterClient}>
                            {registering ? <Loader size={14} /> : null}
                            {registering ? 'Registrando…' : 'Guardar socio'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button className={styles.memberToggleBack}
                    onClick={() => { setIsMember(null); setGuestEmail(''); setShowRegisterForm(false); }}>
                    ← Atrás
                  </button>
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalCancel} onClick={handleClientDiscard}>Saltar</button>
              <button className={styles.modalSave} disabled={(isMember === true && !selectedClient) || showRegisterForm} onClick={handleClientSubmit}>
                <ChevronRight size={14} aria-hidden="true" /> Continuar
              </button>
            </div>
          </div>
        </div>
      )}

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
const TYPE_LABEL = { ADULT: 'Adulto', SENIOR: 'Reducida', STUDENT: 'Estudiante', CHILD: 'Infantil' };

function RefundReceipt({ receipt, onClose, t }) {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 200);
    return () => clearTimeout(id);
  }, []);

  const typeLabel = receipt.ticketType
    ? receipt.ticketType.split(', ').map(tp => TYPE_LABEL[tp] || tp).join(', ')
    : '—';
  const amountStr = receipt.amount != null ? `€${Number(receipt.amount).toFixed(2)}` : '—';

  return (
    <div className={styles.successShell}>
      <div className={styles.ticketCard} style={{ borderColor: 'rgba(220,40,74,.3)' }}>
        <div className={styles.ticketCardHeader} style={{ background: 'rgba(220,40,74,.15)', color: '#c0293a' }}>
          <RotateCcw size={15} className={styles.ticketCardLogo} />
          <span>LUMEN CINEMA — REEMBOLSO</span>
        </div>
        <div className={styles.ticketCardDivider} />
        <h3 className={styles.ticketCardMovie}>{receipt.movie}</h3>
        <p className={styles.ticketCardFormat}>{typeLabel} · {receipt.numTickets ?? 1} entrada{(receipt.numTickets ?? 1) !== 1 ? 's' : ''}</p>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketCardInfo}>
          <div><span className={styles.tcLabel}>FECHA</span><span className={styles.tcVal}>{receipt.date}</span></div>
          <div><span className={styles.tcLabel}>HORA</span><span className={styles.tcVal}>{receipt.time}</span></div>
          <div><span className={styles.tcLabel}>SALA</span><span className={styles.tcVal}>{receipt.theater}</span></div>
          <div><span className={styles.tcLabel}>BUTACA(S)</span><span className={styles.tcVal}>{receipt.seat}</span></div>
        </div>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketCardTotal}>
          <span className={styles.tcLabel}>IMPORTE REEMBOLSADO</span>
          <span className={styles.tcTotalVal} style={{ color: '#c0293a' }}>{amountStr}</span>
        </div>
        <div className={styles.ticketCardDivider} />
        <div className={styles.ticketQRWrap}>
          <div role="img" aria-label="QR de comprobante de reembolso">
            <QRCodeSVG value={`REFUND:${receipt.refundId}`} size={110} bgColor="transparent" fgColor="#111111" level="M" />
          </div>
          <div className={styles.ticketQRInfo}>
            <span className={styles.ticketQRLabel}>Comprobante reembolso</span>
            <span className={styles.ticketId}>{receipt.refundId}</span>
            <span className={styles.ticketIdSeat}>Compra #{receipt.purchaseId}</span>
            <span className={styles.ticketIdSeat}>{new Date(receipt.refundedAt).toLocaleString('es-ES')}</span>
          </div>
        </div>
        <div className={styles.ticketCardDivider} />
        <p className={styles.ticketFooter}>Conserve este comprobante. El importe se abonará en 1-3 días hábiles si el pago fue con tarjeta.</p>
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
      <div className={styles.successLeft}>
        <div className={styles.successIconWrap}>
          <div className={styles.successIcon}><CheckCircle size={30} /></div>
          {[
            { tx: '-60px', ty: '-50px', bg: '#C49A6C', delay: '0ms' },
            { tx: '60px',  ty: '-50px', bg: '#EDD8A5', delay: '60ms' },
            { tx: '-80px', ty: '-20px', bg: '#C49A6C', delay: '120ms' },
            { tx: '80px',  ty: '-20px', bg: '#EDD8A5', delay: '40ms' },
            { tx: '-50px', ty: '50px',  bg: '#C49A6C', delay: '80ms' },
            { tx: '50px',  ty: '50px',  bg: '#EDD8A5', delay: '100ms' },
            { tx: '0px',   ty: '-70px', bg: '#B8966A', delay: '20ms' },
            { tx: '0px',   ty: '70px',  bg: '#D4B890', delay: '140ms' },
          ].map((p, i) => (
            <span key={i} className={styles.confetti}
              style={{ '--tx': p.tx, '--ty': p.ty, background: p.bg, animationDelay: p.delay }} />
          ))}
        </div>
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
          <div><span className={styles.tcLabel}>{tickets.length > 1 ? 'BUTACAS' : t('box_office.ticket.seat')}</span><span className={styles.tcVal}>{tickets.map(tk => tk.seat).join(' · ')}</span></div>
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
            <span className={styles.ticketIdSeat}>Butaca {ticket.seat} {tickets.length > 1 ? `(${current + 1}/${tickets.length})` : ''}</span>
          </div>
        </div>
        <div className={styles.ticketCardDivider} />
        <p className={styles.ticketFooter}>{t('box_office.ticket.footer')}</p>
      </div>

    </div>
  );
}
