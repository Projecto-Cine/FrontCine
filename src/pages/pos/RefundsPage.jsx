import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  RotateCcw, Ticket, ShoppingCart, Search, Film,
  Loader, CheckCircle, X, Printer, ChevronRight,
  AlertTriangle, Calendar,
} from 'lucide-react';
import { sessionsService }         from '../../services/sessionsService';
import { salesService }            from '../../services/salesService';
import { merchandiseSalesService } from '../../services/merchandiseSalesService';
import { useApp }                  from '../../contexts/AppContext';
import EmptyState                  from '../../components/shared/EmptyState';
import styles                      from './RefundsPage.module.css';

/* ── helpers ─────────────────────────────────────── */
const fmt = (dt) => {
  if (!dt) return '—';
  const d = new Date(dt);
  return `${d.toLocaleDateString('es-ES')}  ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
};

const STATUS_LABEL = { PAID: 'Pagada', PENDING: 'Pendiente', CANCELLED: 'Cancelada' };
const STATUS_COLOR = { PAID: 'var(--green)', PENDING: 'var(--yellow)', CANCELLED: 'var(--text-3)' };

/* ── RefundReceipt ───────────────────────────────── */
function RefundReceipt({ receipt, onClose }) {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 200);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className={styles.receiptBackdrop}>
      <div className={styles.receiptCard}>
        <div className={styles.receiptHeader}>
          <RotateCcw size={14} />
          <span>LUMEN CINEMA — REEMBOLSO</span>
        </div>
        <div className={styles.receiptDivider} />

        {receipt.type === 'ticket' ? (
          <>
            <p className={styles.receiptMovie}>{receipt.movieTitle}</p>
            <div className={styles.receiptGrid}>
              <div><span className={styles.rcLabel}>FECHA SESIÓN</span><span className={styles.rcVal}>{receipt.sessionDate}</span></div>
              <div><span className={styles.rcLabel}>HORA</span><span className={styles.rcVal}>{receipt.sessionTime}</span></div>
              <div><span className={styles.rcLabel}>SALA</span><span className={styles.rcVal}>{receipt.theater}</span></div>
              <div><span className={styles.rcLabel}>BUTACAS</span><span className={styles.rcVal}>{receipt.seats}</span></div>
            </div>
          </>
        ) : (
          <div className={styles.receiptGrid}>
            {receipt.items.map((it, i) => (
              <div key={i} style={{ gridColumn: '1/-1' }}>
                <span className={styles.rcLabel}>{it.name} × {it.quantity}</span>
                <span className={styles.rcVal}>€{it.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.receiptDivider} />
        <div className={styles.receiptTotal}>
          <span className={styles.rcLabel}>IMPORTE REEMBOLSADO</span>
          <span className={styles.receiptAmount}>−€{receipt.amount.toFixed(2)}</span>
        </div>
        <div className={styles.receiptDivider} />

        <div className={styles.receiptQR}>
          <QRCodeSVG value={`REFUND:${receipt.refundId}`} size={80} bgColor="transparent" fgColor="var(--text-1)" level="M" />
          <div className={styles.receiptQRInfo}>
            <span className={styles.rcLabel}>COMPROBANTE</span>
            <span className={styles.receiptRefId}>{receipt.refundId}</span>
            <span className={styles.rcLabel} style={{ marginTop: 4 }}>{fmt(receipt.refundedAt)}</span>
          </div>
        </div>

        <div className={styles.receiptDivider} />
        <p className={styles.receiptFooter}>Conserve este comprobante. El reembolso se procesará en 1-3 días hábiles si fue con tarjeta.</p>
      </div>

      <div className={styles.receiptActions}>
        <button className={styles.receiptPrint} onClick={() => window.print()}><Printer size={14} /> Imprimir</button>
        <button className={styles.receiptClose} onClick={onClose}><X size={14} /> Cerrar</button>
      </div>
    </div>
  );
}

/* ── TicketRefunds (taquilla) ────────────────────── */
function TicketRefunds() {
  const { toast } = useApp();
  const [date, setDate]               = useState(() => new Date().toISOString().split('T')[0]);
  const [sessions, setSessions]       = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [purchases, setPurchases]     = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [search, setSearch]           = useState('');
  const [confirming, setConfirming]   = useState(null); // purchase to refund
  const [processing, setProcessing]   = useState(false);
  const [receipt, setReceipt]         = useState(null);

  useEffect(() => {
    setLoadingSessions(true);
    sessionsService.getAll({ date })
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(() => toast('Error al cargar sesiones.', 'error'))
      .finally(() => setLoadingSessions(false));
    setSelectedSession(null);
    setPurchases([]);
  }, [date]);

  const selectSession = (s) => {
    setSelectedSession(s);
    setLoadingPurchases(true);
    sessionsService.getPurchases(s.id)
      .then(data => setPurchases(Array.isArray(data) ? data : []))
      .catch(() => toast('Error al cargar compras.', 'error'))
      .finally(() => setLoadingPurchases(false));
  };

  const handleRefund = async () => {
    if (!confirming) return;
    setProcessing(true);
    try {
      await salesService.cancelPurchase(confirming.id);
      const mv      = selectedSession?.movie ?? {};
      const theater = selectedSession?.theater ?? selectedSession?.room ?? {};
      const dt      = selectedSession?.startTime ?? selectedSession?.dateTime ?? '';
      const seats   = (confirming.tickets ?? []).map(tk => `${tk.seat?.row ?? ''}${String(tk.seat?.number ?? '').padStart(2, '0')}`).join(', ');
      setReceipt({
        type:        'ticket',
        refundId:    `RF-${confirming.id}-${Date.now().toString(36).toUpperCase()}`,
        refundedAt:  new Date().toISOString(),
        movieTitle:  mv.title ?? '—',
        sessionDate: dt.split('T')[0] ?? '—',
        sessionTime: dt.split('T')[1]?.substring(0, 5) ?? '—',
        theater:     theater.name ?? '—',
        seats:       seats || '—',
        amount:      confirming.totalAmount ?? 0,
      });
      setPurchases(prev => prev.map(p => p.id === confirming.id ? { ...p, status: 'CANCELLED' } : p));
      setConfirming(null);
      toast('Reembolso procesado correctamente.', 'success');
    } catch {
      toast('Error al procesar el reembolso.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filteredPurchases = purchases.filter(p => {
    if (!search) return true;
    const name = (p.user?.name ?? p.user?.username ?? '').toLowerCase();
    const email = (p.user?.email ?? '').toLowerCase();
    const id = String(p.id);
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || id.includes(search);
  });

  if (receipt) return <RefundReceipt receipt={receipt} onClose={() => setReceipt(null)} />;

  return (
    <div className={styles.tabContent}>
      {/* Date + session selector */}
      <div className={styles.selectorRow}>
        <input type="date" className={styles.datePicker} value={date} onChange={e => setDate(e.target.value)} />
        {loadingSessions
          ? <span className={styles.hint}><Loader size={13} /> Cargando sesiones…</span>
          : <span className={styles.hint}>{sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} el {date}</span>
        }
      </div>

      <div className={styles.splitPane}>
        {/* Sessions list */}
        <div className={styles.sessionList}>
          <p className={styles.panelLabel}><Film size={12} /> Selecciona sesión</p>
          {sessions.length === 0 && !loadingSessions && (
            <p className={styles.empty}>Sin sesiones para este día.</p>
          )}
          {sessions.map(s => {
            const time = (s.startTime ?? s.dateTime ?? '').split('T')[1]?.substring(0, 5) ?? '--:--';
            const room = s.theater?.name ?? s.room?.name ?? '—';
            const isActive = selectedSession?.id === s.id;
            return (
              <button key={s.id}
                className={`${styles.sessionItem} ${isActive ? styles.sessionItemActive : ''}`}
                onClick={() => selectSession(s)}>
                <span className={styles.sessionItemTime}>{time}</span>
                <span className={styles.sessionItemMovie}>{s.movie?.title ?? '—'}</span>
                <span className={styles.sessionItemRoom}>{room}</span>
                <ChevronRight size={12} className={styles.sessionItemArrow} />
              </button>
            );
          })}
        </div>

        {/* Purchases list */}
        <div className={styles.purchaseList}>
          {!selectedSession ? (
            <EmptyState icon={Ticket} title="Selecciona una sesión para ver sus compras" />
          ) : loadingPurchases ? (
            <div className={styles.loading}><Loader size={16} /> Cargando compras…</div>
          ) : (
            <>
              <div className={styles.purchaseSearch}>
                <Search size={13} />
                <input className={styles.purchaseSearchInput} placeholder="Buscar por cliente o nº compra…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {filteredPurchases.length === 0
                ? <EmptyState icon={Ticket} title="No hay compras para esta sesión" />
                : filteredPurchases.map(p => {
                    const canRefund = p.status === 'PAID';
                    return (
                      <div key={p.id} className={`${styles.purchaseCard} ${!canRefund ? styles.purchaseCardDim : ''}`}>
                        <div className={styles.purchaseCardHead}>
                          <span className={styles.purchaseId}>#{p.id}</span>
                          <span className={styles.purchaseStatus} style={{ color: STATUS_COLOR[p.status] }}>
                            {STATUS_LABEL[p.status] ?? p.status}
                          </span>
                          <span className={styles.purchaseAmount}>€{(p.totalAmount ?? 0).toFixed(2)}</span>
                        </div>
                        <div className={styles.purchaseCardMeta}>
                          <span>{p.user?.name ?? p.user?.username ?? 'Cliente anónimo'}</span>
                          <span>{fmt(p.createdAt ?? p.purchaseDate)}</span>
                          <span>{p.paymentMethod ?? '—'}</span>
                        </div>
                        {(p.tickets ?? []).length > 0 && (
                          <div className={styles.purchaseSeats}>
                            {p.tickets.map((tk, i) => (
                              <span key={i} className={styles.seatBadge}>
                                {tk.seat?.row}{String(tk.seat?.number ?? '').padStart(2, '0')} · {tk.ticketType}
                              </span>
                            ))}
                          </div>
                        )}
                        {canRefund && (
                          <button className={styles.refundBtn} onClick={() => setConfirming(p)}>
                            <RotateCcw size={12} /> Reembolsar
                          </button>
                        )}
                      </div>
                    );
                  })
              }
            </>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div className={styles.confirmBackdrop}>
          <div className={styles.confirmBox}>
            <div className={styles.confirmHeader}>
              <AlertTriangle size={16} style={{ color: 'var(--yellow)' }} />
              <span>Confirmar reembolso</span>
              <button onClick={() => setConfirming(null)}><X size={14} /></button>
            </div>
            <div className={styles.confirmBody}>
              <p>¿Reembolsar <strong>€{(confirming.totalAmount ?? 0).toFixed(2)}</strong> a <strong>{confirming.user?.name ?? 'cliente'}</strong>?</p>
              <p className={styles.confirmHint}>La compra #{confirming.id} pasará a estado CANCELADA y se liberarán las butacas.</p>
            </div>
            <div className={styles.confirmFooter}>
              <button className={styles.confirmCancel} onClick={() => setConfirming(null)} disabled={processing}>Cancelar</button>
              <button className={styles.confirmOk} onClick={handleRefund} disabled={processing}>
                {processing ? <Loader size={13} /> : <RotateCcw size={13} />}
                {processing ? 'Procesando…' : 'Sí, reembolsar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MerchandiseRefunds (caja) ───────────────────── */
function MerchandiseRefunds() {
  const { toast } = useApp();
  const [sales, setSales]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0]);
  const [confirming, setConfirming] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt]       = useState(null);

  useEffect(() => {
    setLoading(true);
    merchandiseSalesService.getAll()
      .then(data => setSales(Array.isArray(data) ? data : []))
      .catch(() => toast('Error al cargar ventas de caja.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleRefund = async () => {
    if (!confirming) return;
    setProcessing(true);
    try {
      await merchandiseSalesService.remove(confirming.id);
      setReceipt({
        type:       'merchandise',
        refundId:   `RF-M${confirming.id}-${Date.now().toString(36).toUpperCase()}`,
        refundedAt: new Date().toISOString(),
        items:      [{ name: confirming.merchandise?.name ?? '—', quantity: confirming.quantity ?? 1, total: confirming.totalPrice ?? confirming.merchandise?.price ?? 0 }],
        amount:     confirming.totalPrice ?? confirming.merchandise?.price ?? 0,
      });
      setSales(prev => prev.filter(s => s.id !== confirming.id));
      setConfirming(null);
      toast('Reembolso de caja procesado.', 'success');
    } catch {
      toast('Error al procesar el reembolso.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = sales.filter(s => {
    const dateOk = !dateFilter || (s.saleDate ?? s.createdAt ?? '').startsWith(dateFilter);
    if (!dateOk) return false;
    if (!search) return true;
    const name = (s.user?.name ?? s.user?.username ?? '').toLowerCase();
    const prod = (s.merchandise?.name ?? '').toLowerCase();
    return name.includes(search.toLowerCase()) || prod.includes(search.toLowerCase());
  });

  if (receipt) return <RefundReceipt receipt={receipt} onClose={() => setReceipt(null)} />;

  return (
    <div className={styles.tabContent}>
      <div className={styles.selectorRow}>
        <input type="date" className={styles.datePicker} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        <div className={styles.purchaseSearch} style={{ flex: 1 }}>
          <Search size={13} />
          <input className={styles.purchaseSearchInput} placeholder="Buscar por cliente o producto…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}><Loader size={16} /> Cargando ventas…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Sin ventas de caja para este día" />
      ) : (
        <div className={styles.saleGrid}>
          {filtered.map(s => (
            <div key={s.id} className={styles.purchaseCard}>
              <div className={styles.purchaseCardHead}>
                <span className={styles.purchaseId}>#{s.id}</span>
                <span className={styles.purchaseItemName}>{s.merchandise?.name ?? '—'}</span>
                <span className={styles.purchaseAmount}>€{(s.totalPrice ?? 0).toFixed(2)}</span>
              </div>
              <div className={styles.purchaseCardMeta}>
                <span>{s.user?.name ?? s.user?.username ?? 'Cliente anónimo'}</span>
                <span>× {s.quantity ?? 1} ud.</span>
                <span>{fmt(s.saleDate ?? s.createdAt)}</span>
              </div>
              <button className={styles.refundBtn} onClick={() => setConfirming(s)}>
                <RotateCcw size={12} /> Reembolsar
              </button>
            </div>
          ))}
        </div>
      )}

      {confirming && (
        <div className={styles.confirmBackdrop}>
          <div className={styles.confirmBox}>
            <div className={styles.confirmHeader}>
              <AlertTriangle size={16} style={{ color: 'var(--yellow)' }} />
              <span>Confirmar reembolso</span>
              <button onClick={() => setConfirming(null)}><X size={14} /></button>
            </div>
            <div className={styles.confirmBody}>
              <p>¿Reembolsar <strong>€{(confirming.totalPrice ?? 0).toFixed(2)}</strong> por <strong>{confirming.merchandise?.name}</strong> × {confirming.quantity}?</p>
              <p className={styles.confirmHint}>La venta #{confirming.id} se eliminará del sistema.</p>
            </div>
            <div className={styles.confirmFooter}>
              <button className={styles.confirmCancel} onClick={() => setConfirming(null)} disabled={processing}>Cancelar</button>
              <button className={styles.confirmOk} onClick={handleRefund} disabled={processing}>
                {processing ? <Loader size={13} /> : <RotateCcw size={13} />}
                {processing ? 'Procesando…' : 'Sí, reembolsar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────── */
export default function RefundsPage() {
  const [tab, setTab] = useState('ticket');

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <RotateCcw size={18} />
          <h1>Reembolsos</h1>
        </div>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'ticket' ? styles.tabActive : ''}`} onClick={() => setTab('ticket')}>
            <Ticket size={14} /> Taquilla
          </button>
          <button className={`${styles.tab} ${tab === 'merchandise' ? styles.tabActive : ''}`} onClick={() => setTab('merchandise')}>
            <ShoppingCart size={14} /> Caja
          </button>
        </div>
      </div>

      {tab === 'ticket'       && <TicketRefunds />}
      {tab === 'merchandise'  && <MerchandiseRefunds />}
    </div>
  );
}
