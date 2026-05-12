import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Euro, Search, Ticket, XCircle, Plus, Edit2,
  CreditCard, Banknote, Smartphone, Globe,
  CheckCircle, Loader, RotateCcw, Eye,
} from 'lucide-react';
import PageHeader   from '../../components/shared/PageHeader';
import DataTable    from '../../components/shared/DataTable';
import Badge        from '../../components/ui/Badge';
import Button       from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard      from '../../components/shared/KPICard';
import { useApp }   from '../../contexts/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { purchasesService } from '../../services/reservationsService';
import { screeningsService } from '../../services/sessionsService';
import { usersService }      from '../../services/usersService';
import styles from './ReservationsPage.module.css';

/* ── Constants ───────────────────────────────────────── */
const STATUS_BADGE_COLOR = {
  CONFIRMED: 'green',
  PENDING:   'yellow',
  CANCELLED: 'default',
  REFUNDED:  'red',
  PAID:      'green',
};
const PAYMENT_COLOR = { CARD: 'accent', CASH: 'green', ONLINE: 'purple', QR: 'cyan' };

/* ── Helpers ─────────────────────────────────────────── */
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
const getScreeningLabel = (s, noScreeningText) => {
  if (!s) return noScreeningText;
  const title   = s.movie?.title ?? 'Película';
  const theater = s.theater?.name ? ` · ${s.theater.name}` : '';
  const date    = s.dateTime ? ` · ${s.dateTime.slice(0, 16).replace('T', ' ')}` : '';
  return `${title}${theater}${date}`;
};

const EMPTY_FORM = { userId: '', screeningId: '', totalAmount: '' };

/* ── Component ───────────────────────────────────────── */
export default function ReservationsPage() {
  const [purchases,  setPurchases]  = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [users,      setUsers]      = useState([]);
  const [modal,      setModal]      = useState(null);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [filterStatus,    setFilterStatus]    = useState('all');
  const [filterScreening, setFilterScreening] = useState('all');
  const [detail,     setDetail]     = useState(null);

  // Payment flow
  const [payTarget,    setPayTarget]    = useState(null);
  const [payMethod,    setPayMethod]    = useState('CARD');
  const [cashGiven,    setCashGiven]    = useState('');
  const [paying,       setPaying]       = useState(false);
  const [paidTickets,  setPaidTickets]  = useState(null);

  // Refund flow
  const [refundTarget, setRefundTarget] = useState(null);
  const [refunding,    setRefunding]    = useState(false);

  // Cancel flow
  const [cancelTarget, setCancelTarget] = useState(null);

  const { toast } = useApp();
  const { t } = useLanguage();

  const STATUS_MAP = {
    CONFIRMED: { label: t('reservations.status.CONFIRMED'), v: 'green'   },
    PENDING:   { label: t('reservations.status.PENDING'),   v: 'yellow'  },
    CANCELLED: { label: t('reservations.status.CANCELLED'), v: 'default' },
    REFUNDED:  { label: t('reservations.status.REFUNDED'),  v: 'red'     },
  };
  const PAYMENT_LABEL = {
    CARD:   t('reservations.pay.card'),
    CASH:   t('reservations.pay.cash'),
    ONLINE: t('reservations.pay.online'),
    QR:     t('reservations.pay.qr'),
  };
  const PAY_METHODS = [
    { id: 'CARD',   label: t('reservations.pay.card'),   Icon: CreditCard },
    { id: 'CASH',   label: t('reservations.pay.cash'),   Icon: Banknote   },
    { id: 'QR',     label: t('reservations.pay.qr'),     Icon: Smartphone },
    { id: 'ONLINE', label: t('reservations.pay.online'), Icon: Globe      },
  ];

  const noScreeningText = t('reservations.detail.noScreening');

  useEffect(() => {
    Promise.all([purchasesService.getAll(), screeningsService.getAll(), usersService.getAll()])
      .then(([pd, sd, ud]) => {
        setPurchases(pd ?? []);
        setScreenings(sd ?? []);
        setUsers(ud ?? []);
      })
      .catch(() => toast('No se pudieron cargar las reservas.', 'error'));
  }, [toast]);

  /* ── Filters ─────────────────────────────────────── */
  const filtered = useMemo(() => purchases.filter(p => {
    const statusOk    = filterStatus === 'all' || getStatus(p) === filterStatus;
    const scr         = getScreening(p, screenings);
    const screeningOk = filterScreening === 'all' || String(scr?.id ?? p.screeningId) === filterScreening;
    return statusOk && screeningOk;
  }), [filterStatus, filterScreening, purchases, screenings]);

  /* ── Form helpers ────────────────────────────────── */
  const setField   = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal('form'); };
  const openEdit   = (row) => {
    setEditing(row);
    setForm({
      userId:      String(row.user?.id ?? row.userId ?? ''),
      screeningId: String(getScreening(row, screenings)?.id ?? row.screeningId ?? ''),
      totalAmount: String(getAmount(row)),
    });
    setModal('form');
  };

  /* ── Save reservation ────────────────────────────── */
  const handleSave = async () => {
    if (!form.userId) { toast('Selecciona un cliente.', 'error'); return; }
    setSaving(true);
    const payload = {
      userId:      Number(form.userId),
      screeningId: form.screeningId ? Number(form.screeningId) : undefined,
      total:       form.totalAmount  ? Number(form.totalAmount) : undefined,
      status:      editing ? getStatus(editing) : 'PENDING',
    };
    try {
      if (editing) {
        const updated = await purchasesService.update(editing.id, payload).catch(() => null);
        setPurchases(prev => prev.map(p => p.id === editing.id ? (updated ?? { ...p, ...payload }) : p));
        toast('Reserva actualizada.', 'success');
        setModal(null);
      } else {
        const created = await purchasesService.create(payload);
        setPurchases(prev => [...prev, created]);
        setPayTarget(created);
        setPayMethod('CARD');
        setCashGiven('');
        setModal('pay');
        toast('Reserva creada. Procede al cobro.', 'success');
      }
    } catch (err) {
      if (err?.status === 401) toast('Sesión expirada. Vuelve a iniciar sesión.', 'error');
      else toast(`Error al guardar la reserva: ${err?.message ?? 'Inténtalo de nuevo.'}`, 'error');
    }
    setSaving(false);
  };

  /* ── Pay reservation ─────────────────────────────── */
  const payTotal  = getAmount(payTarget ?? {});
  const change    = payMethod === 'CASH' && cashGiven ? (parseFloat(cashGiven) - payTotal).toFixed(2) : null;
  const canPay    = payMethod !== 'CASH' || (cashGiven && parseFloat(cashGiven) >= payTotal);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await purchasesService.pay(payTarget.id, { paymentMethod: payMethod });
      setPurchases(prev => prev.map(p =>
        p.id === payTarget.id ? { ...p, status: 'CONFIRMED', paymentMethod: payMethod } : p
      ));
      const qrs = res?.tickets?.map(t => t.qrCode ?? t.qr).filter(Boolean)
        ?? res?.qrCodes?.filter(Boolean) ?? [];
      const scr = getScreening(payTarget, screenings);
      setPaidTickets({ purchase: { ...payTarget, status: 'CONFIRMED', paymentMethod: payMethod }, scr, qrs, total: payTotal, change });
      setModal('ticket');
      toast('¡Cobro realizado! Entradas generadas.', 'success');
    } catch (err) {
      if (err?.status === 401) toast('Sesión expirada. Vuelve a iniciar sesión.', 'error');
      else toast('Error al procesar el cobro. Inténtalo de nuevo.', 'error');
    }
    setPaying(false);
  };

  /* ── Cancel ──────────────────────────────────────── */
  const handleCancel = async () => {
    await purchasesService.cancel(cancelTarget.id).catch(() => null);
    setPurchases(prev => prev.map(p =>
      p.id === cancelTarget.id ? { ...p, status: 'CANCELLED' } : p
    ));
    toast(`Reserva ${cancelTarget.id} cancelada.`, 'warning');
    setCancelTarget(null);
  };

  /* ── Refund ──────────────────────────────────────── */
  const handleRefund = async () => {
    setRefunding(true);
    try {
      await purchasesService.update(refundTarget.id, { ...refundTarget, status: 'REFUNDED' }).catch(() => null);
      setPurchases(prev => prev.map(p =>
        p.id === refundTarget.id ? { ...p, status: 'REFUNDED' } : p
      ));
      toast('Reembolso procesado correctamente.', 'warning');
      setRefundTarget(null);
      setModal(null);
    } catch {
      toast('Error al procesar el reembolso.', 'error');
    }
    setRefunding(false);
  };

  /* ── KPIs ────────────────────────────────────────── */
  const confirmed    = purchases.filter(p => getStatus(p) === 'CONFIRMED');
  const pending      = purchases.filter(p => getStatus(p) === 'PENDING');
  const totalRevenue = confirmed.reduce((s, p) => s + getAmount(p), 0);

  /* ── Columns ─────────────────────────────────────── */
  const columns = [
    { key: 'id', label: t('reservations.col.ref'), width: 120, render: v =>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}>{v}</span> },
    { key: 'client', label: t('reservations.col.client'), render: (_, row) => (
      <div>
        <div style={{ fontWeight: 500 }}>{getClientName(row)}</div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>{getClientEmail(row)}</div>
      </div>
    )},
    { key: 'screening', label: t('reservations.col.screening'), render: (_, row) =>
      <span style={{ fontSize: 'var(--fs-sm)' }}>{getScreeningLabel(getScreening(row, screenings), noScreeningText)}</span> },
    { key: 'seats', label: t('reservations.col.seats'), width: 110, render: (_, row) =>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--fs-sm)' }}>{getSeats(row).join(', ') || '-'}</span> },
    { key: 'amount', label: t('reservations.col.amount'), width: 90, render: (_, row) =>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--fs-md)', fontWeight: 600 }}>€{getAmount(row).toFixed(2)}</span> },
    { key: 'paymentMethod', label: t('reservations.col.payment'), width: 90, render: v =>
      <Badge variant={PAYMENT_COLOR[v] || 'default'}>{PAYMENT_LABEL[v] || v || '-'}</Badge> },
    { key: 'status', label: t('reservations.col.status'), width: 130, render: (_, row) => {
      const raw = row.status ?? row.purchaseStatus ?? 'PENDING';
      const norm = raw === 'PAID' ? 'CONFIRMED' : raw;
      const cfg = STATUS_MAP[norm] ?? { label: raw, v: 'default' };
      return <Badge variant={cfg.v} dot>{cfg.label}</Badge>;
    }},
  ];

  /* ── Render ──────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <PageHeader
        title={t('reservations.title')}
        subtitle={t('reservations.subtitle', { confirmed: confirmed.length, revenue: totalRevenue.toFixed(2), pending: pending.length })}
        actions={<Button icon={Plus} onClick={openCreate}>{t('reservations.createBtn')}</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label={t('reservations.kpi.total')}     value={purchases.length}              icon={Ticket} color="accent" />
        <KPICard label={t('reservations.kpi.confirmed')} value={confirmed.length}              icon={Ticket} color="green" />
        <KPICard label={t('reservations.kpi.pending')}   value={pending.length}                icon={Search} color="yellow" />
        <KPICard label={t('reservations.kpi.revenue')}   value={`€${totalRevenue.toFixed(0)}`} icon={Euro}   color="green" />
      </div>

      <div className={styles.filterRow}>
        <select className={styles.filterBtn} value={filterScreening} onChange={e => setFilterScreening(e.target.value)}>
          <option value="all">{t('reservations.filter.allScreenings')}</option>
          {screenings.map(s => <option key={s.id} value={s.id}>{getScreeningLabel(s, noScreeningText)}</option>)}
        </select>
        {[['all', t('reservations.filter.all')], ...Object.entries(STATUS_MAP).map(([k, { label }]) => [k, label])].map(([k, label]) => (
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
              <Button variant="ghost" size="sm" icon={Eye}   onClick={() => setDetail(row)}  title={t('common.edit')} />
              <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)}   title={t('common.edit')} />
              {s === 'PENDING' && (
                <Button variant="ghost" size="sm" icon={CreditCard}
                  style={{ color: 'var(--accent)' }}
                  onClick={() => { setPayTarget(row); setPayMethod('CARD'); setCashGiven(''); setModal('pay'); }}
                  title={t('reservations.col.payment')} />
              )}
              {s === 'CONFIRMED' && (
                <Button variant="ghost" size="sm" icon={RotateCcw}
                  style={{ color: 'var(--yellow)' }}
                  onClick={() => setRefundTarget(row)}
                  title={t('reservations.refund.title')} />
              )}
              {['CONFIRMED', 'PENDING'].includes(s) && (
                <Button variant="ghost" size="sm" icon={XCircle}
                  onClick={() => setCancelTarget(row)} title={t('reservations.cancel.title')} />
              )}
            </div>
          );
        }}
      />

      {/* ── Create / Edit form ── */}
      <Modal
        open={modal === 'form'}
        onClose={() => { if (!saving) setModal(null); }}
        title={editing ? t('reservations.modalEditTitle', { id: editing.id }) : t('reservations.modalCreate')}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader size={14} /> : null}
              {editing ? t('common.saveChanges') : t('reservations.createAndPay')}
            </Button>
          </div>
        }
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label}>{t('reservations.form.client')}</label>
            <select className={styles.input} value={form.userId}
              onChange={e => setField('userId', e.target.value)}>
              <option value="">{t('reservations.form.selectClient')}</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email} — {u.role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.label}>{t('reservations.form.screening')}</label>
            <select className={styles.input} value={form.screeningId}
              onChange={e => setField('screeningId', e.target.value)}>
              <option value="">{t('reservations.detail.noScreeningAssigned')}</option>
              {screenings.map(s => <option key={s.id} value={s.id}>{getScreeningLabel(s, noScreeningText)}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>{t('reservations.form.amount')}</label>
            <input className={styles.input} type="number" step="0.01" min="0" value={form.totalAmount}
              onChange={e => setField('totalAmount', e.target.value)} placeholder="0.00" />
          </div>
        </div>
        {!editing && (
          <p style={{ marginTop: 12, fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>
            {t('reservations.form.saveHint')}
          </p>
        )}
      </Modal>

      {/* ── Payment modal ── */}
      <Modal
        open={modal === 'pay'}
        onClose={() => { if (!paying) { setModal(null); setPayTarget(null); } }}
        title={t('reservations.modalPay')}
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => { setModal(null); setPayTarget(null); }} disabled={paying}>
              {t('reservations.defer')}
            </Button>
            <Button variant="primary" onClick={handlePay}
              disabled={paying || !canPay}
              style={{ minWidth: 160 }}>
              {paying
                ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> {t('reservations.processing')}</>
                : <><CheckCircle size={14} /> {t('reservations.confirmPay', { amount: payTotal.toFixed(2) })}</>}
            </Button>
          </div>
        }
      >
        {payTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('reservations.detail.reservation')}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{getClientName(payTarget)}</div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)', marginTop: 2 }}>{getScreeningLabel(getScreening(payTarget, screenings), noScreeningText)}</div>
              <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>
                €{payTotal.toFixed(2)}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {t('reservations.pay.method')}
              </p>
              <div className={styles.payMethodGrid}>
                {PAY_METHODS.map(({ id, label, Icon }) => (
                  <button key={id} className={`${styles.payMethodBtn} ${payMethod === id ? styles.payMethodActive : ''}`}
                    onClick={() => { setPayMethod(id); setCashGiven(''); }}>
                    <Icon size={20} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {payMethod === 'CASH' && (
              <div className={styles.cashSection}>
                <label className={styles.cashLabel}>{t('reservations.pay.cashGiven')}</label>
                <input
                  className={styles.cashInput}
                  type="number" step="0.50" min={payTotal}
                  placeholder={t('reservations.pay.minimum', { amount: payTotal.toFixed(2) })}
                  value={cashGiven}
                  onChange={e => setCashGiven(e.target.value)}
                  autoFocus
                />
                <div className={styles.quickAmounts}>
                  {[10, 20, 50, 100].map(v => (
                    <button key={v} className={styles.quickAmt} onClick={() => setCashGiven(String(v))}>€{v}</button>
                  ))}
                </div>
                {change !== null && parseFloat(change) >= 0 && (
                  <div className={styles.changeBanner}>
                    <span>{t('reservations.pay.change')}</span>
                    <span className={styles.changeAmt}>€{change}</span>
                  </div>
                )}
                {change !== null && parseFloat(change) < 0 && (
                  <div className={styles.changeError}>{t('reservations.pay.insufficient', { amount: Math.abs(parseFloat(change)).toFixed(2) })}</div>
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
        title={t('reservations.modalTicket')}
        size="sm"
      >
        {paidTickets && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--green)' }}>
              <CheckCircle size={40} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>{t('reservations.success.confirmed')}</span>
            </div>

            <div style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)', fontSize: 'var(--fs-md)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{getClientName(paidTickets.purchase)}</div>
              <div style={{ color: 'var(--text-3)', marginTop: 2 }}>{getScreeningLabel(paidTickets.scr, noScreeningText)}</div>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 16, color: 'var(--green)' }}>
                  €{paidTickets.total.toFixed(2)}
                </span>
                <Badge variant={PAYMENT_COLOR[paidTickets.purchase.paymentMethod] || 'default'}>
                  {PAYMENT_LABEL[paidTickets.purchase.paymentMethod] || '-'}
                </Badge>
              </div>
              {paidTickets.change && parseFloat(paidTickets.change) >= 0 && (
                <div style={{ marginTop: 6, padding: '6px 8px', background: 'var(--bg-4)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-md)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-3)' }}>{t('reservations.detail.changeReturned')}</span>
                  <span style={{ color: 'var(--yellow)' }}>€{paidTickets.change}</span>
                </div>
              )}
            </div>

            {paidTickets.qrs.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                {paidTickets.qrs.map((qr, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <QRCodeSVG value={qr} size={120} bgColor="transparent" fgColor="var(--text-1)" level="M" />
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                      {t('reservations.detail.seatLabel', { seat: getSeats(paidTickets.purchase)[i] ?? i + 1 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)', textAlign: 'center' }}>
                {t('reservations.detail.emailTickets')}
              </p>
            )}

            <Button variant="primary" style={{ width: '100%' }}
              onClick={() => { setModal(null); setPaidTickets(null); }}>
              {t('common.close')}
            </Button>
          </div>
        )}
      </Modal>

      {/* ── Detail modal ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`${t('reservations.detail.reservation')} ${detail?.id}`} size="sm">
        {detail && (() => {
          const scr    = getScreening(detail, screenings);
          const status = getStatus(detail);
          const pay    = detail.paymentMethod ?? detail.payment;
          return (
            <div className={styles.detail}>
              <div className={styles.detailSection}>
                <p className={styles.detailLbl}>{t('reservations.detail.client')}</p>
                <p className={styles.detailVal}>{getClientName(detail)}</p>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>{getClientEmail(detail)}</p>
              </div>
              <div className={styles.detailSection}>
                <p className={styles.detailLbl}>{t('reservations.detail.screening')}</p>
                <p className={styles.detailVal}>{getScreeningLabel(scr, noScreeningText)}</p>
              </div>
              <div className={styles.detailRow}>
                <div>
                  <p className={styles.detailLbl}>{t('reservations.detail.seats')}</p>
                  <p className={styles.detailVal} style={{ fontFamily: 'var(--mono)' }}>{getSeats(detail).join(', ') || '-'}</p>
                </div>
                <div>
                  <p className={styles.detailLbl}>{t('reservations.detail.payment')}</p>
                  <Badge variant={PAYMENT_COLOR[pay] || 'default'}>{PAYMENT_LABEL[pay] || pay || '-'}</Badge>
                </div>
                <div>
                  <p className={styles.detailLbl}>{t('reservations.detail.amount')}</p>
                  <p className={styles.detailVal}>€{getAmount(detail).toFixed(2)}</p>
                </div>
                <div>
                  <p className={styles.detailLbl}>{t('reservations.detail.status')}</p>
                  <Badge variant={STATUS_MAP[status]?.v || 'default'} dot>{STATUS_MAP[status]?.label || status}</Badge>
                </div>
              </div>
              <div>
                <p className={styles.detailLbl}>{t('reservations.detail.created')}</p>
                <p style={{ fontSize: 'var(--fs-sm)', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: 3 }}>{detail.createdAt ?? '-'}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                <Button variant="secondary" size="sm" icon={Edit2}
                  onClick={() => { setDetail(null); openEdit(detail); }}>
                  {t('common.edit')}
                </Button>
                {status === 'PENDING' && (
                  <Button variant="primary" size="sm" icon={CreditCard}
                    onClick={() => { setDetail(null); setPayTarget(detail); setPayMethod('CARD'); setCashGiven(''); setModal('pay'); }}>
                    {t('reservations.pay.card')}
                  </Button>
                )}
                {status === 'CONFIRMED' && (
                  <Button variant="secondary" size="sm" icon={RotateCcw}
                    onClick={() => { setDetail(null); setRefundTarget(detail); }}>
                    {t('reservations.refund.title')}
                  </Button>
                )}
                {['CONFIRMED', 'PENDING'].includes(status) && (
                  <Button variant="danger" size="sm" icon={XCircle}
                    onClick={() => { setDetail(null); setCancelTarget(detail); }}>
                    {t('reservations.cancel.title')}
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Refund confirm ── */}
      <ConfirmModal
        open={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={handleRefund}
        title={t('reservations.refund.title')}
        danger
        message={t('reservations.refund.msg', { amount: getAmount(refundTarget ?? {}).toFixed(2), name: getClientName(refundTarget ?? {}) })}
        confirmLabel={refunding ? t('reservations.processing') : t('reservations.refund.confirm')}
      />

      {/* ── Cancel confirm ── */}
      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title={t('reservations.cancel.title')}
        danger
        message={t('reservations.cancel.msg', { id: cancelTarget?.id, name: getClientName(cancelTarget ?? {}) })}
        confirmLabel={t('reservations.cancel.confirm')}
      />
    </div>
  );
}
