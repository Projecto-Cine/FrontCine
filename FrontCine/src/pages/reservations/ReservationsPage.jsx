import { useEffect, useMemo, useState } from 'react';
import { Euro, Eye, Search, Ticket, XCircle } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { useApp } from '../../contexts/AppContext';
import { purchasesService } from '../../services/reservationsService';
import { screeningsService } from '../../services/sessionsService';
import styles from './ReservationsPage.module.css';

const STATUS_MAP = {
  CONFIRMED: { label: 'Confirmada', v: 'green' },
  PENDING: { label: 'Pendiente', v: 'yellow' },
  CANCELLED: { label: 'Cancelada', v: 'default' },
  REFUNDED: { label: 'Reembolsada', v: 'red' },
};

const PAYMENT_LABEL = { CARD: 'Tarjeta', CASH: 'Efectivo', ONLINE: 'Online', card: 'Tarjeta', cash: 'Efectivo', online: 'Online' };
const PAYMENT_COLOR = { CARD: 'accent', CASH: 'green', ONLINE: 'purple', card: 'accent', cash: 'green', online: 'purple' };

const getStatus = (purchase) => purchase.status ?? purchase.purchaseStatus ?? 'CONFIRMED';
const getAmount = (purchase) => Number(purchase.total ?? purchase.amount ?? purchase.totalAmount ?? 0);
const getSeats = (purchase) => purchase.seats ?? purchase.seatCodes ?? purchase.tickets?.map(ticket => ticket.seat?.code ?? ticket.seatCode) ?? [];
const getClientName = (purchase) => purchase.clientName ?? purchase.client?.name ?? purchase.user?.name ?? purchase.user?.email ?? '-';
const getClientEmail = (purchase) => purchase.clientEmail ?? purchase.client?.email ?? purchase.user?.email ?? '';
const getScreening = (purchase, screenings) => purchase.screening ?? screenings.find(screening => screening.id === (purchase.screeningId ?? purchase.screening_id));
const getScreeningLabel = (screening) => {
  if (!screening) return 'Sin proyección';
  const title = screening.movie?.title ?? 'Película';
  const theater = screening.theater?.name ? ` · ${screening.theater.name}` : '';
  const date = screening.dateTime ? ` · ${screening.dateTime.slice(0, 16).replace('T', ' ')}` : '';
  return `${title}${theater}${date}`;
};

export default function ReservationsPage() {
  const [purchases, setPurchases] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [detail, setDetail] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterScreening, setFilterScreening] = useState('all');
  const { toast } = useApp();

  useEffect(() => {
    Promise.all([purchasesService.getAll(), screeningsService.getAll()])
      .then(([purchasesData, screeningsData]) => {
        setPurchases(purchasesData ?? []);
        setScreenings(screeningsData ?? []);
      })
      .catch(() => toast('No se pudieron cargar las compras del backend.', 'error'));
  }, [toast]);

  const filtered = useMemo(() => purchases.filter((purchase) => {
    const statusOk = filterStatus === 'all' || getStatus(purchase) === filterStatus;
    const screening = getScreening(purchase, screenings);
    const screeningOk = filterScreening === 'all' || String(screening?.id ?? purchase.screeningId ?? purchase.screening_id) === filterScreening;
    return statusOk && screeningOk;
  }), [filterScreening, filterStatus, purchases, screenings]);

  const handleCancel = async () => {
    const saved = await purchasesService.update(cancelTarget.id, { ...cancelTarget, status: 'CANCELLED' });
    setPurchases(prev => prev.map(purchase => purchase.id === cancelTarget.id ? saved : purchase));
    toast(`Compra ${cancelTarget.id} cancelada.`, 'warning');
    setCancelTarget(null);
  };

  const confirmed = purchases.filter(purchase => getStatus(purchase) === 'CONFIRMED');
  const totalRevenue = confirmed.reduce((sum, purchase) => sum + getAmount(purchase), 0);

  const columns = [
    { key: 'id', label: 'Ref.', width: 120, render: value => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{value}</span> },
    { key: 'client', label: 'Cliente', render: (_, row) => (
      <div><div style={{ fontWeight: 500 }}>{getClientName(row)}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{getClientEmail(row)}</div></div>
    )},
    { key: 'screening', label: 'Proyección', render: (_, row) => <span style={{ fontSize: 11 }}>{getScreeningLabel(getScreening(row, screenings))}</span> },
    { key: 'seats', label: 'Asientos', width: 120, render: (_, row) => <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{getSeats(row).join(', ') || '-'}</span> },
    { key: 'amount', label: 'Importe', width: 90, render: (_, row) => <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>€{getAmount(row).toFixed(2)}</span> },
    { key: 'paymentMethod', label: 'Pago', width: 100, render: value => <Badge variant={PAYMENT_COLOR[value] || 'default'}>{PAYMENT_LABEL[value] || value || '-'}</Badge> },
    { key: 'status', label: 'Estado', width: 130, render: (_, row) => {
      const status = getStatus(row);
      return <Badge variant={STATUS_MAP[status]?.v || 'default'} dot>{STATUS_MAP[status]?.label || status}</Badge>;
    }},
    { key: 'createdAt', label: 'Creada', width: 140, sortable: false, render: value => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{value ?? '-'}</span> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Reservas"
        subtitle={`${confirmed.length} confirmadas · €${totalRevenue.toFixed(2)} en ingresos`}
      />

      <div className={styles.kpiRow}>
        <KPICard label="Total compras" value={purchases.length} icon={Ticket} color="accent" />
        <KPICard label="Confirmadas" value={confirmed.length} icon={Ticket} color="green" />
        <KPICard label="Filtradas" value={filtered.length} icon={Search} color="cyan" />
        <KPICard label="Ingresos confirmados" value={`€${totalRevenue.toFixed(0)}`} icon={Euro} color="green" />
      </div>

      <div className={styles.filterRow}>
        <select className={styles.filterBtn} value={filterScreening} onChange={e => setFilterScreening(e.target.value)}>
          <option value="all">Todas las proyecciones</option>
          {screenings.map(screening => <option key={screening.id} value={screening.id}>{getScreeningLabel(screening)}</option>)}
        </select>
        {[['all', 'Todas'], ...Object.entries(STATUS_MAP).map(([key, { label }]) => [key, label])].map(([key, label]) => (
          <button key={key} className={`${styles.filterBtn} ${filterStatus === key ? styles.filterActive : ''}`}
            onClick={() => setFilterStatus(key)}>{label}
            <span className={styles.filterCount}>{key === 'all' ? purchases.length : purchases.filter(p => getStatus(p) === key).length}</span>
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['id', 'clientName', 'clientEmail']}
        onRowClick={setDetail}
        rowKey="id"
        rowActions={(row) => (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Eye} onClick={() => setDetail(row)} title="Ver detalle" />
            {['CONFIRMED', 'PENDING'].includes(getStatus(row)) && (
              <Button variant="ghost" size="sm" icon={XCircle} onClick={() => setCancelTarget(row)} title="Cancelar" />
            )}
          </div>
        )}
      />

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Compra ${detail?.id}`} size="sm">
        {detail && (() => {
          const screening = getScreening(detail, screenings);
          const status = getStatus(detail);
          const payment = detail.paymentMethod ?? detail.payment;
          return (
            <div className={styles.detail}>
              <div className={styles.detailSection}>
                <p className={styles.detailLbl}>Cliente</p>
                <p className={styles.detailVal}>{getClientName(detail)}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{getClientEmail(detail)}</p>
              </div>
              <div className={styles.detailSection}>
                <p className={styles.detailLbl}>Proyección</p>
                <p className={styles.detailVal}>{getScreeningLabel(screening)}</p>
              </div>
              <div className={styles.detailRow}>
                <div><p className={styles.detailLbl}>Asientos</p><p className={styles.detailVal} style={{ fontFamily: 'var(--mono)' }}>{getSeats(detail).join(', ') || '-'}</p></div>
                <div><p className={styles.detailLbl}>Pago</p><Badge variant={PAYMENT_COLOR[payment] || 'default'}>{PAYMENT_LABEL[payment] || payment || '-'}</Badge></div>
                <div><p className={styles.detailLbl}>Importe</p><p className={styles.detailVal}>€{getAmount(detail).toFixed(2)}</p></div>
                <div><p className={styles.detailLbl}>Estado</p><Badge variant={STATUS_MAP[status]?.v || 'default'} dot>{STATUS_MAP[status]?.label || status}</Badge></div>
              </div>
              <div><p className={styles.detailLbl}>Fecha creacion</p><p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: 3 }}>{detail.createdAt ?? '-'}</p></div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Cancelar compra" danger
        message={`¿Cancelar la compra ${cancelTarget?.id} de ${getClientName(cancelTarget ?? {})}?`}
        confirmLabel="Cancelar compra" />
    </div>
  );
}
