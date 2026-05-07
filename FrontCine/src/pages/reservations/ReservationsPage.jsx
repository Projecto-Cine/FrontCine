import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Euro, Search, Ticket, XCircle, Plus, Edit2,
  CreditCard, Banknote, Smartphone, Globe,
  CheckCircle, Loader, RotateCcw, Eye, Mail, Printer, Star, UserX,
} from 'lucide-react';
import PageHeader   from '../../components/shared/PageHeader';
import DataTable    from '../../components/shared/DataTable';
import Badge        from '../../components/ui/Badge';
import Button       from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard      from '../../components/shared/KPICard';
import { useApp }   from '../../contexts/AppContext';
import { purchasesService } from '../../services/reservationsService';
import { screeningsService } from '../../services/sessionsService';
import { clientsService }   from '../../services/clientsService';
import styles from './ReservationsPage.module.css';

/* ── Local persistence ───────────────────────────────── */
const PURCH_KEY       = 'lumen_purchases';
const CLIENTS_KEY     = 'lumen_clients';
const loadLocalPurch  = () => { try { return JSON.parse(localStorage.getItem(PURCH_KEY)  ?? '[]'); } catch { return []; } };
const loadLocalCli    = () => { try { return JSON.parse(localStorage.getItem(CLIENTS_KEY) ?? '[]'); } catch { return []; } };
const saveLocalPurch  = (list) => localStorage.setItem(PURCH_KEY, JSON.stringify(list.filter(p => p._local)));

/* ── Constants ───────────────────────────────────────── */
const STATUS_MAP = {
  CONFIRMED: { label: 'Confirmada',  v: 'green'   },
  PENDING:   { label: 'Pendiente',   v: 'yellow'  },
  CANCELLED: { label: 'Cancelada',   v: 'default' },
  REFUNDED:  { label: 'Reembolsada', v: 'red'     },
};
const STATUS_BADGE = { ...STATUS_MAP, PAID: { label: 'Confirmada', v: 'green' } };

const PAYMENT_LABEL = { CARD: 'Tarjeta', CASH: 'Efectivo', ONLINE: 'Online', QR: 'QR' };
const PAYMENT_COLOR = { CARD: 'accent', CASH: 'green', ONLINE: 'purple', QR: 'cyan' };

const PAY_METHODS = [
  { id: 'CARD',   label: 'Tarjeta',   Icon: CreditCard },
  { id: 'CASH',   label: 'Efectivo',  Icon: Banknote   },
  { id: 'QR',     label: 'QR / App',  Icon: Smartphone },
  { id: 'ONLINE', label: 'Online',    Icon: Globe      },
];

/* ── Helpers ─────────────────────────────────────────── */
const mkTicketId = () =>
  'TKT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();

const buildLocalQRs = (purchase, scr) => {
  const seats   = (purchase.seats ?? purchase.seatCodes ?? []).filter(Boolean);
  const movie   = scr?.movie?.title  ?? 'Película';
  const theater = scr?.theater?.name ?? '-';
  const dt      = scr?.dateTime ?? '';
  const date    = dt.split('T')[0] ?? '';
  const time    = dt.split('T')[1]?.substring(0, 5) ?? '';
  if (seats.length > 0)
    return seats.map(s => `LUMEN:${mkTicketId()}|${movie}|${theater}|${date}|${time}|${s}|RESERVATION`);
  return [`LUMEN:${mkTicketId()}|${movie}|${theater}|${date}|${time}|${purchase.id}|RESERVATION`];
};

const normalizeStatus = (s) => s === 'PAID' ? 'CONFIRMED' : (s ?? 'PENDING');
const getStatus       = (p) => normalizeStatus(p.status ?? p.purchaseStatus);
const getAmount       = (p) => Number(p.total ?? p.amount ?? p.totalAmount ?? 0);
const getSeats        = (p) => {
  const s = p.seats ?? p.seatCodes ?? p.tickets?.map(t => t.seat?.code ?? t.seatCode ?? t.seat) ?? [];
  return Array.isArray(s) ? s.filter(Boolean) : [];
};
const getClientName  = (p) => p?.clientName ?? p?.client?.name ?? p?.user?.name ?? p?.user?.email ?? '-';
const getClientEmail = (p) => p?.clientEmail ?? p?.client?.email ?? p?.user?.email ?? '';
const getScreening   = (p, list) =>
  p?.screening ?? list.find(s => s.id === (p?.screeningId ?? p?.screening_id));
const getScreeningLabel = (s) => {
  if (!s) return 'Sin proyección';
  const title   = s.movie?.title ?? 'Película';
  const theater = s.theater?.name ? ` · ${s.theater.name}` : '';
  const date    = s.dateTime ? ` · ${s.dateTime.slice(0, 16).replace('T', ' ')}` : '';
  return `${title}${theater}${date}`;
};

/* Merge backend list + _local entries that backend doesn't have */
const mergePurchases = (backend, local) => {
  const ids = new Set(backend.map(p => p.id));
  return [...backend, ...local.filter(p => p._local && !ids.has(p.id))];
};

const EMPTY_FORM = { clientName: '', clientEmail: '', screeningId: '', totalAmount: '' };

/* ── Component ───────────────────────────────────────── */
export default function ReservationsPage() {
  const [purchases,  setPurchases]  = useState(() => loadLocalPurch());
  const [screenings, setScreenings] = useState([]);
  const [modal,      setModal]      = useState(null);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [filterStatus,    setFilterStatus]    = useState('all');
  const [filterScreening, setFilterScreening] = useState('all');
  const [detail,     setDetail]     = useState(null);

  // Client search inside form
  const [selectedClient,  setSelectedClient]  = useState(null);
  const [clientQuery,     setClientQuery]     = useState('');
  const [clientResults,   setClientResults]   = useState([]);
  const [clientSearching, setClientSearching] = useState(false);
  const clientDebounce = useRef(null);

  // Payment flow
  const [payTarget,    setPayTarget]    = useState(null);
  const [payMethod,    setPayMethod]    = useState('CARD');
  const [cashGiven,    setCashGiven]    = useState('');
  const [paying,       setPaying]       = useState(false);
  const [paidTickets,  setPaidTickets]  = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const qrContainerRef = useRef(null);

  // Refund / cancel
  const [refundTarget, setRefundTarget] = useState(null);
  const [refunding,    setRefunding]    = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  const { toast } = useApp();

  /* ── Load on mount ───────────────────────────────── */
  useEffect(() => {
    Promise.all([purchasesService.getAll(), screeningsService.getAll()])
      .then(([pd, sd]) => {
        const backend = Array.isArray(pd) ? pd : (pd?.content ?? []);
        const local   = loadLocalPurch();
        setPurchases(mergePurchases(backend, local));
        setScreenings(sd ?? []);
      })
      .catch(() => {
        // Keep whatever was loaded from localStorage as initial state
        setScreenings([]);
      });
  }, []);

  /* ── Client search (debounced) ───────────────────── */
  useEffect(() => {
    clearTimeout(clientDebounce.current);
    if (!clientQuery.trim()) { setClientResults([]); return; }
    clientDebounce.current = setTimeout(async () => {
      setClientSearching(true);
      try {
        const data    = await clientsService.search(clientQuery);
        const backend = Array.isArray(data) ? data : (data?.content ?? []);
        const local   = loadLocalCli();
        const q       = clientQuery.toLowerCase();
        const localHits = local.filter(c =>
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.username ?? '').toLowerCase().includes(q)
        );
        const emails = new Set(backend.map(c => c.email));
        setClientResults([...backend, ...localHits.filter(c => !emails.has(c.email))]);
      } catch {
        const local = loadLocalCli();
        const q     = clientQuery.toLowerCase();
        setClientResults(local.filter(c =>
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q)
        ));
      }
      setClientSearching(false);
    }, 350);
    return () => clearTimeout(clientDebounce.current);
  }, [clientQuery]);

  /* ── Helpers: persist ────────────────────────────── */
  const persist = (updater) => {
    setPurchases(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveLocalPurch(next);
      return next;
    });
  };

  /* ── Filters ─────────────────────────────────────── */
  const filtered = useMemo(() => purchases.filter(p => {
    const statusOk    = filterStatus === 'all' || getStatus(p) === filterStatus;
    const scr         = getScreening(p, screenings);
    const screeningOk = filterScreening === 'all' || String(scr?.id ?? p.screeningId) === filterScreening;
    return statusOk && screeningOk;
  }), [filterStatus, filterScreening, purchases, screenings]);

  /* ── Form helpers ────────────────────────────────── */
  const setField   = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const resetClientSearch = () => {
    setSelectedClient(null); setClientQuery(''); setClientResults([]);
  };

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); resetClientSearch(); setModal('form');
  };
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      clientName:  getClientName(row),
      clientEmail: getClientEmail(row),
      screeningId: String(getScreening(row, screenings)?.id ?? row.screeningId ?? ''),
      totalAmount: String(getAmount(row)),
    });
    resetClientSearch();
    setModal('form');
  };

  const selectClient = (c) => {
    setSelectedClient(c);
    setForm(prev => ({
      ...prev,
      clientName:  c.name ?? c.username ?? '',
      clientEmail: c.email ?? '',
    }));
    setClientQuery(''); setClientResults([]);
  };

  /* ── Save reservation ────────────────────────────── */
  const handleSave = async () => {
    if (!form.clientName.trim()) { toast('El nombre del cliente es obligatorio.', 'error'); return; }
    setSaving(true);
    const payload = {
      clientName:  form.clientName,
      clientEmail: form.clientEmail,
      screeningId: form.screeningId ? Number(form.screeningId) : undefined,
      totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
      status:      editing ? getStatus(editing) : 'PENDING',
    };
    try {
      if (editing) {
        const updated = await purchasesService.update(editing.id, payload).catch(() => null);
        const merged  = updated ?? { ...editing, ...payload };
        persist(prev => prev.map(p => p.id === editing.id ? { ...merged, _local: editing._local } : p));
        toast('Reserva actualizada.', 'success');
        setModal(null);
      } else {
        let created;
        try {
          created = await purchasesService.create(payload);
        } catch {
          created = { ...payload, id: 'RES-' + Date.now(), createdAt: new Date().toISOString(), status: 'PENDING', _local: true };
          toast('Reserva guardada localmente.', 'warning');
        }
        const newPurchase = { ...(created ?? { ...payload, id: 'RES-' + Date.now() }), _local: !created?.id || String(created.id).startsWith('RES-') };
        persist(prev => [...prev, newPurchase]);
        setModal(null);
        toast('Reserva creada. Usa Cobrar para proceder al pago.', 'success');
      }
    } catch {
      toast('Error al guardar la reserva.', 'error');
      setModal(null);
    }
    setSaving(false);
  };

  /* ── Pay reservation ─────────────────────────────── */
  const payTotal = getAmount(payTarget ?? {});
  const change   = payMethod === 'CASH' && cashGiven ? (parseFloat(cashGiven) - payTotal).toFixed(2) : null;
  const canPay   = payMethod !== 'CASH' || (cashGiven && parseFloat(cashGiven) >= payTotal);

  const finalizePay = (paid, scr, qrs) => {
    persist(prev => prev.map(p => p.id === paid.id ? paid : p));
    setPaidTickets({ purchase: paid, scr, qrs, total: payTotal, change });
    setModal('ticket');
    purchasesService.sendEmail(paid.id)
      .then(() => toast('Email con ticket enviado al cliente.', 'success'))
      .catch(() => null);
  };

  const handlePay = async () => {
    setPaying(true);
    const scr  = getScreening(payTarget, screenings);
    try {
      const res        = await purchasesService.pay(payTarget.id, { paymentMethod: payMethod });
      const backendQrs = res?.tickets?.map(t => t.qrCode ?? t.qr).filter(Boolean) ?? res?.qrCodes?.filter(Boolean) ?? [];
      const qrs        = backendQrs.length > 0 ? backendQrs : buildLocalQRs(payTarget, scr);
      const paid       = { ...payTarget, status: 'CONFIRMED', paymentMethod: payMethod, _local: payTarget._local };
      finalizePay(paid, scr, qrs);
      toast('¡Cobro realizado! Entradas generadas.', 'success');
    } catch (err) {
      if (err?.status === 401) {
        const qrs  = buildLocalQRs(payTarget, scr);
        const paid = { ...payTarget, status: 'CONFIRMED', paymentMethod: payMethod, _local: true };
        finalizePay(paid, scr, qrs);
        toast('¡Cobro registrado!', 'success');
      } else {
        toast('Error al procesar el cobro. Inténtalo de nuevo.', 'error');
      }
    }
    setPaying(false);
  };

  /* ── Cancel ──────────────────────────────────────── */
  const handleCancel = async () => {
    await purchasesService.cancel(cancelTarget.id).catch(() => null);
    persist(prev => prev.map(p => p.id === cancelTarget.id ? { ...p, status: 'CANCELLED' } : p));
    toast(`Reserva ${cancelTarget.id} cancelada.`, 'warning');
    setCancelTarget(null);
  };

  /* ── Refund ──────────────────────────────────────── */
  const handleRefund = async () => {
    setRefunding(true);
    try {
      await purchasesService.update(refundTarget.id, { ...refundTarget, status: 'REFUNDED' }).catch(() => null);
      persist(prev => prev.map(p => p.id === refundTarget.id ? { ...p, status: 'REFUNDED' } : p));
      toast('Reembolso procesado correctamente.', 'warning');
      setRefundTarget(null); setModal(null);
    } catch { toast('Error al procesar el reembolso.', 'error'); }
    setRefunding(false);
  };

  /* ── Print ticket ────────────────────────────────── */
  const printTicket = () => {
    if (!paidTickets) return;
    const seats = getSeats(paidTickets.purchase);
    const scr   = paidTickets.scr;
    const svgs  = qrContainerRef.current
      ? Array.from(qrContainerRef.current.querySelectorAll('svg')).map(s => s.outerHTML)
      : [];
    const win = window.open('', '_blank', 'width=380,height=700');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ticket</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:13px;padding:16px;max-width:300px}.center{text-align:center}.bold{font-weight:700}.small{font-size:10px;color:#666}.divider{border-top:1px dashed #000;margin:10px 0}.row{display:flex;justify-content:space-between;margin:4px 0}.lbl{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:2px}.qr{text-align:center;margin:12px 0}.qr svg{width:150px;height:150px}.seatbadge{font-size:9px;color:#666;margin-top:3px}@media print{body{padding:4px}}</style>
</head><body>
<div class="center bold" style="font-size:16px">LUMEN CINEMA</div>
<div class="center small">Ticket de reserva</div>
<div class="divider"></div>
<div class="lbl">Cliente</div><div class="bold">${getClientName(paidTickets.purchase)}</div>
<div style="margin-top:8px" class="lbl">Película</div><div class="bold">${scr?.movie?.title ?? '-'}</div>
<div style="margin-top:8px" class="lbl">Sala</div><div>${scr?.theater?.name ?? '-'}</div>
<div style="margin-top:8px" class="lbl">Fecha y hora</div><div>${scr?.dateTime ? scr.dateTime.slice(0,16).replace('T',' ') : '-'}</div>
${seats.length ? `<div style="margin-top:8px" class="lbl">Butacas</div><div class="bold">${seats.join(', ')}</div>` : ''}
<div class="divider"></div>
<div class="row"><span class="bold">TOTAL</span><span class="bold">€${paidTickets.total.toFixed(2)}</span></div>
<div class="row"><span class="small">Método</span><span class="small">${PAYMENT_LABEL[paidTickets.purchase.paymentMethod] || '-'}</span></div>
${paidTickets.change && parseFloat(paidTickets.change) >= 0 ? `<div class="row"><span class="small">Cambio</span><span class="small">€${paidTickets.change}</span></div>` : ''}
<div class="divider"></div>
${svgs.map((svg, i) => `<div class="qr">${svg}${seats[i] ? `<div class="seatbadge">Butaca ${seats[i]}</div>` : ''}</div>`).join('')}
<div class="divider"></div>
<div class="center small">Ref: ${paidTickets.purchase.id}</div>
<div class="center small" style="margin-top:4px">Conserve este ticket. No se admiten cambios una vez comenzada la sesión.</div>
</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  /* ── Send email ──────────────────────────────────── */
  const handleSendEmail = async () => {
    if (!paidTickets) return;
    setSendingEmail(true);
    try {
      await purchasesService.sendEmail(paidTickets.purchase.id);
      toast('Email enviado al cliente.', 'success');
    } catch {
      const email = getClientEmail(paidTickets.purchase);
      if (email) {
        const subject = encodeURIComponent(`Tu entrada — ${paidTickets.scr?.movie?.title ?? 'Lumen Cinema'}`);
        const body = encodeURIComponent(
          `Hola ${getClientName(paidTickets.purchase)},\n\nTu reserva ha sido confirmada:\n` +
          `  Película : ${paidTickets.scr?.movie?.title ?? '-'}\n` +
          `  Sala     : ${paidTickets.scr?.theater?.name ?? '-'}\n` +
          `  Fecha    : ${paidTickets.scr?.dateTime ? paidTickets.scr.dateTime.slice(0,16).replace('T',' ') : '-'}\n` +
          `  Total    : €${paidTickets.total.toFixed(2)}\n  Ref.     : ${paidTickets.purchase.id}\n\nLumen Cinema`
        );
        window.open(`mailto:${email}?subject=${subject}&body=${body}`);
        toast('Se ha abierto el cliente de correo.', 'info');
      } else { toast('El cliente no tiene email registrado.', 'error'); }
    }
    setSendingEmail(false);
  };

  /* ── KPIs ────────────────────────────────────────── */
  const confirmed    = purchases.filter(p => getStatus(p) === 'CONFIRMED');
  const pending      = purchases.filter(p => getStatus(p) === 'PENDING');
  const totalRevenue = confirmed.reduce((s, p) => s + getAmount(p), 0);

  /* ── Columns ─────────────────────────────────────── */
  const columns = [
    { key: 'id', label: 'Ref.', width: 120, render: v =>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{v}</span> },
    { key: 'client', label: 'Cliente', render: (_, row) => (
      <div>
        <div style={{ fontWeight: 500 }}>
          {getClientName(row)}
          {row._local && <span style={{ marginLeft: 5, fontSize: 9, color: 'var(--yellow)', fontWeight: 600 }}>LOCAL</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{getClientEmail(row)}</div>
      </div>
    )},
    { key: 'screening', label: 'Proyección', render: (_, row) =>
      <span style={{ fontSize: 11 }}>{getScreeningLabel(getScreening(row, screenings))}</span> },
    { key: 'seats', label: 'Asientos', width: 110, render: (_, row) =>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{getSeats(row).join(', ') || '-'}</span> },
    { key: 'amount', label: 'Importe', width: 90, render: (_, row) =>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>€{getAmount(row).toFixed(2)}</span> },
    { key: 'paymentMethod', label: 'Pago', width: 90, render: v =>
      <Badge variant={PAYMENT_COLOR[v] || 'default'}>{PAYMENT_LABEL[v] || v || '-'}</Badge> },
    { key: 'status', label: 'Estado', width: 130, render: (_, row) => {
      const raw = row.status ?? row.purchaseStatus ?? 'PENDING';
      const cfg = STATUS_BADGE[raw] ?? { label: raw, v: 'default' };
      return <Badge variant={cfg.v} dot>{cfg.label}</Badge>;
    }},
  ];

  /* ── Render ──────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <PageHeader
        title="Reservas"
        subtitle={`${confirmed.length} confirmadas · €${totalRevenue.toFixed(2)} en ingresos · ${pending.length} pendientes de cobro`}
        actions={<Button icon={Plus} onClick={openCreate}>Nueva reserva</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label="Total reservas"      value={purchases.length}              icon={Ticket} color="accent" />
        <KPICard label="Confirmadas"          value={confirmed.length}              icon={Ticket} color="green" />
        <KPICard label="Pendientes de cobro"  value={pending.length}                icon={Search} color="yellow" />
        <KPICard label="Ingresos confirmados" value={`€${totalRevenue.toFixed(0)}`} icon={Euro}   color="green" />
      </div>

      <div className={styles.filterRow}>
        <select className={styles.filterBtn} value={filterScreening} onChange={e => setFilterScreening(e.target.value)}>
          <option value="all">Todas las proyecciones</option>
          {screenings.map(s => <option key={s.id} value={s.id}>{getScreeningLabel(s)}</option>)}
        </select>
        {[['all', 'Todas'], ...Object.entries(STATUS_MAP).map(([k, { label }]) => [k, label])].map(([k, label]) => (
          <button key={k}
            className={`${styles.filterBtn} ${filterStatus === k ? styles.filterActive : ''}`}
            onClick={() => setFilterStatus(k)}>
            {label}
            <span className={styles.filterCount}>
              {k === 'all' ? purchases.length : purchases.filter(p => getStatus(p) === k).length}
            </span>
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['id', 'clientName', 'clientEmail']}
        onRowClick={setDetail}
        rowKey="id"
        rowActions={(row) => {
          const s = getStatus(row);
          return (
            <div style={{ display: 'flex', gap: 2 }}>
              <Button variant="ghost" size="sm" icon={Eye}   onClick={() => setDetail(row)}  title="Ver detalle" />
              <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)}   title="Editar" />
              {s === 'PENDING' && (
                <Button variant="primary" size="sm" icon={CreditCard}
                  onClick={() => { setPayTarget(row); setPayMethod('CARD'); setCashGiven(''); setModal('pay'); }}>
                  Cobrar
                </Button>
              )}
              {s === 'CONFIRMED' && (
                <Button variant="ghost" size="sm" icon={RotateCcw}
                  style={{ color: 'var(--yellow)' }}
                  onClick={() => setRefundTarget(row)} title="Reembolsar" />
              )}
              {['CONFIRMED', 'PENDING'].includes(s) && (
                <Button variant="ghost" size="sm" icon={XCircle}
                  onClick={() => setCancelTarget(row)} title="Cancelar" />
              )}
            </div>
          );
        }}
      />

      {/* ── Create / Edit form ── */}
      <Modal
        open={modal === 'form'}
        onClose={() => { if (!saving) { setModal(null); resetClientSearch(); } }}
        title={editing ? `Editar reserva ${editing.id}` : 'Nueva reserva'}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => { setModal(null); resetClientSearch(); }} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader size={14} /> : null}
              {editing ? 'Guardar cambios' : 'Crear reserva'}
            </Button>
          </div>
        }
      >
        {/* ── Client search ── */}
        {!editing && (
          <div style={{ marginBottom: 16 }}>
            <label className={styles.label}>Buscar cliente existente</label>
            {selectedClient ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-1)' }}>
                    {selectedClient.name ?? selectedClient.username}
                    {selectedClient.fidelityDiscountEligible && (
                      <span style={{ marginLeft: 6, color: 'var(--accent)', fontSize: 10 }}><Star size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> Socio</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{selectedClient.email ?? ''}</div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}
                  onClick={() => { resetClientSearch(); setForm(prev => ({ ...prev, clientName: '', clientEmail: '' })); }}>
                  <UserX size={14} />
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input
                    className={styles.input}
                    style={{ paddingLeft: 30 }}
                    placeholder="Buscar por nombre o email…"
                    value={clientQuery}
                    onChange={e => setClientQuery(e.target.value)}
                  />
                  {clientSearching && <Loader size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />}
                </div>
                {clientResults.length > 0 && (
                  <div style={{ position: 'absolute', zIndex: 50, width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', marginTop: 2, boxShadow: '0 4px 16px rgba(0,0,0,.3)', overflow: 'hidden' }}>
                    {clientResults.slice(0, 6).map(c => (
                      <button key={c.id ?? c.email}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        onClick={() => selectClient(c)}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--text-1)' }}>{c.name ?? c.username ?? '-'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.email ?? ''}</div>
                        </div>
                        {c.fidelityDiscountEligible && <Star size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                        {c._local && <span style={{ fontSize: 9, color: 'var(--yellow)', fontWeight: 600 }}>LOCAL</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles.formGrid}>
          <div>
            <label className={styles.label}>Nombre cliente *</label>
            <input className={styles.input} value={form.clientName}
              onChange={e => setField('clientName', e.target.value)} placeholder="Nombre completo" />
          </div>
          <div>
            <label className={styles.label}>Email cliente</label>
            <input className={styles.input} type="email" value={form.clientEmail}
              onChange={e => setField('clientEmail', e.target.value)} placeholder="email@ejemplo.com" />
          </div>
          <div>
            <label className={styles.label}>Proyección</label>
            <select className={styles.input} value={form.screeningId}
              onChange={e => setField('screeningId', e.target.value)}>
              <option value="">Sin proyección asignada</option>
              {screenings.map(s => <option key={s.id} value={s.id}>{getScreeningLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Importe (€)</label>
            <input className={styles.input} type="number" step="0.01" min="0" value={form.totalAmount}
              onChange={e => setField('totalAmount', e.target.value)} placeholder="0.00" />
          </div>
        </div>
        {!editing && (
          <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-3)' }}>
            La reserva quedará pendiente. Usa <strong>Cobrar</strong> en la fila para procesar el pago.
          </p>
        )}
      </Modal>

      {/* ── Payment modal ── */}
      <Modal
        open={modal === 'pay'}
        onClose={() => { if (!paying) { setModal(null); setPayTarget(null); } }}
        title="Cobro de reserva"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => { setModal(null); setPayTarget(null); }} disabled={paying}>Aplazar cobro</Button>
            <Button variant="primary" onClick={handlePay} disabled={paying || !canPay} style={{ minWidth: 160 }}>
              {paying
                ? <><Loader size={14} /> Procesando…</>
                : <><CheckCircle size={14} /> Confirmar cobro · €{payTotal.toFixed(2)}</>}
            </Button>
          </div>
        }
      >
        {payTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Reserva</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{getClientName(payTarget)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{getScreeningLabel(getScreening(payTarget, screenings))}</div>
              <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>
                €{payTotal.toFixed(2)}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Método de pago</p>
              <div className={styles.payMethodGrid}>
                {PAY_METHODS.map(({ id, label, Icon }) => (
                  <button key={id} className={`${styles.payMethodBtn} ${payMethod === id ? styles.payMethodActive : ''}`}
                    onClick={() => { setPayMethod(id); setCashGiven(''); }}>
                    <Icon size={20} /><span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            {payMethod === 'CASH' && (
              <div className={styles.cashSection}>
                <label className={styles.cashLabel}>Importe entregado (€)</label>
                <input className={styles.cashInput} type="number" step="0.50" min={payTotal}
                  placeholder={`Mínimo €${payTotal.toFixed(2)}`}
                  value={cashGiven} onChange={e => setCashGiven(e.target.value)} autoFocus />
                <div className={styles.quickAmounts}>
                  {[10, 20, 50, 100].map(v => (
                    <button key={v} className={styles.quickAmt} onClick={() => setCashGiven(String(v))}>€{v}</button>
                  ))}
                </div>
                {change !== null && parseFloat(change) >= 0 && (
                  <div className={styles.changeBanner}><span>Cambio a devolver</span><span className={styles.changeAmt}>€{change}</span></div>
                )}
                {change !== null && parseFloat(change) < 0 && (
                  <div className={styles.changeError}>Importe insuficiente (faltan €{Math.abs(parseFloat(change)).toFixed(2)})</div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Ticket success modal ── */}
      <Modal
        open={modal === 'ticket'}
        onClose={() => { setModal(null); setPaidTickets(null); }}
        title="¡Cobro completado!"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="sm" icon={Mail} onClick={handleSendEmail} disabled={sendingEmail}>
                {sendingEmail ? 'Enviando…' : 'Email'}
              </Button>
              <Button variant="secondary" size="sm" icon={Printer} onClick={printTicket}>Imprimir</Button>
            </div>
            <Button variant="primary" onClick={() => { setModal(null); setPaidTickets(null); }}>Cerrar</Button>
          </div>
        }
      >
        {paidTickets && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--green)' }}>
              <CheckCircle size={40} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>Reserva confirmada</span>
            </div>
            <div style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)', fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{getClientName(paidTickets.purchase)}</div>
              <div style={{ color: 'var(--text-3)', marginTop: 2 }}>{getScreeningLabel(paidTickets.scr)}</div>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 16, color: 'var(--green)' }}>
                  €{paidTickets.total.toFixed(2)}
                </span>
                <Badge variant={PAYMENT_COLOR[paidTickets.purchase.paymentMethod] || 'default'}>
                  {PAYMENT_LABEL[paidTickets.purchase.paymentMethod] || '-'}
                </Badge>
              </div>
              {paidTickets.change && parseFloat(paidTickets.change) >= 0 && (
                <div style={{ marginTop: 6, padding: '6px 8px', background: 'var(--bg-4)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-3)' }}>Cambio devuelto</span>
                  <span style={{ color: 'var(--yellow)' }}>€{paidTickets.change}</span>
                </div>
              )}
            </div>
            <div ref={qrContainerRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
              {paidTickets.qrs.map((qr, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <QRCodeSVG value={qr} size={120} bgColor="transparent" fgColor="var(--text-1)" level="M" />
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                    Butaca {getSeats(paidTickets.purchase)[i] ?? i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Detail modal ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Reserva ${detail?.id}`} size="sm">
        {detail && (() => {
          const scr    = getScreening(detail, screenings);
          const status = getStatus(detail);
          const pay    = detail.paymentMethod ?? detail.payment;
          return (
            <div className={styles.detail}>
              <div className={styles.detailSection}>
                <p className={styles.detailLbl}>Cliente</p>
                <p className={styles.detailVal}>{getClientName(detail)}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{getClientEmail(detail)}</p>
              </div>
              <div className={styles.detailSection}>
                <p className={styles.detailLbl}>Proyección</p>
                <p className={styles.detailVal}>{getScreeningLabel(scr)}</p>
              </div>
              <div className={styles.detailRow}>
                <div><p className={styles.detailLbl}>Asientos</p>
                  <p className={styles.detailVal} style={{ fontFamily: 'var(--mono)' }}>{getSeats(detail).join(', ') || '-'}</p></div>
                <div><p className={styles.detailLbl}>Pago</p>
                  <Badge variant={PAYMENT_COLOR[pay] || 'default'}>{PAYMENT_LABEL[pay] || pay || '-'}</Badge></div>
                <div><p className={styles.detailLbl}>Importe</p>
                  <p className={styles.detailVal}>€{getAmount(detail).toFixed(2)}</p></div>
                <div><p className={styles.detailLbl}>Estado</p>
                  <Badge variant={STATUS_BADGE[status]?.v || 'default'} dot>{STATUS_BADGE[status]?.label || status}</Badge></div>
              </div>
              <div><p className={styles.detailLbl}>Fecha creación</p>
                <p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: 3 }}>{detail.createdAt ?? '-'}</p></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                <Button variant="secondary" size="sm" icon={Edit2} onClick={() => { setDetail(null); openEdit(detail); }}>Editar</Button>
                {status === 'PENDING' && (
                  <Button variant="primary" size="sm" icon={CreditCard}
                    onClick={() => { setDetail(null); setPayTarget(detail); setPayMethod('CARD'); setCashGiven(''); setModal('pay'); }}>Cobrar</Button>
                )}
                {status === 'CONFIRMED' && (
                  <Button variant="secondary" size="sm" icon={RotateCcw}
                    onClick={() => { setDetail(null); setRefundTarget(detail); }}>Reembolsar</Button>
                )}
                {['CONFIRMED', 'PENDING'].includes(status) && (
                  <Button variant="danger" size="sm" icon={XCircle}
                    onClick={() => { setDetail(null); setCancelTarget(detail); }}>Cancelar</Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmModal open={!!refundTarget} onClose={() => setRefundTarget(null)} onConfirm={handleRefund}
        title="Procesar reembolso" danger
        message={`¿Reembolsar €${getAmount(refundTarget ?? {}).toFixed(2)} a ${getClientName(refundTarget ?? {})}? El estado cambiará a Reembolsada.`}
        confirmLabel={refunding ? 'Procesando…' : 'Confirmar reembolso'} />

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Cancelar reserva" danger
        message={`¿Cancelar la reserva ${cancelTarget?.id} de ${getClientName(cancelTarget ?? {})}?`}
        confirmLabel="Cancelar reserva" />
    </div>
  );
}
