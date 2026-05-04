import { useState, useEffect } from 'react';
import { Search, XCircle, RefreshCw, Eye } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { Ticket, Euro, CreditCard } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { reservationsService } from '../../services/reservationsService';
import { sessionsService } from '../../services/sessionsService';
import { moviesService } from '../../services/moviesService';
import styles from './ReservationsPage.module.css';

const STATUS_MAP = {
  confirmed: { label: 'Confirmada', v: 'green' },
  pending: { label: 'Pendiente', v: 'yellow' },
  cancelled: { label: 'Cancelada', v: 'default' },
  refunded: { label: 'Reembolsada', v: 'red' },
};
const PAYMENT_LABEL = { card: 'Tarjeta', cash: 'Efectivo', online: 'Online' };
const PAYMENT_COLOR = { card: 'accent', cash: 'green', online: 'purple' };

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [movies, setMovies] = useState([]);
  const [detail, setDetail] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useApp();

  useEffect(() => {
    reservationsService.getAll().then(setReservations).catch(() => {});
    sessionsService.getAll().then(setSessions).catch(() => {});
    moviesService.getAll().then(setMovies).catch(() => {});
  }, []);

  const filtered = filterStatus === 'all' ? reservations : reservations.filter(r => r.status === filterStatus);

  const handleCancel = () => {
    setReservations(p => p.map(r => r.id === cancelTarget.id ? { ...r, status: 'cancelled' } : r));
    toast(`Reserva ${cancelTarget.id} cancelada.`, 'warning');
    reservationsService.update(cancelTarget.id, { ...cancelTarget, status: 'cancelled' }).catch(() => {});
    setCancelTarget(null);
  };

  const totalRevenue = reservations.filter(r => r.status === 'confirmed').reduce((s, r) => s + r.amount, 0);

  const columns = [
    { key: 'id', label: 'Ref.', width: 140, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{v}</span> },
    { key: 'client', label: 'Cliente', render: (v, row) => (
      <div><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{row.email}</div></div>
    )},
    { key: 'session_id', label: 'Sesión', render: v => {
      const s = sessions.find(s => s.id === v);
      const m = s ? movies.find(m => m.id === s.movie_id) : null;
      return <span style={{ fontSize: 11 }}>{m?.title || '—'} <span style={{ color: 'var(--text-3)' }}>{s?.date} {s?.time}</span></span>;
    }},
    { key: 'seats', label: 'Asientos', width: 120, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{v.join(', ')}</span> },
    { key: 'amount', label: 'Importe', width: 90, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>€{v.toFixed(2)}</span> },
    { key: 'payment', label: 'Pago', width: 100, render: v => <Badge variant={PAYMENT_COLOR[v]}>{PAYMENT_LABEL[v]}</Badge> },
    { key: 'status', label: 'Estado', width: 130, render: v => <Badge variant={STATUS_MAP[v]?.v} dot>{STATUS_MAP[v]?.label}</Badge> },
    { key: 'created_at', label: 'Creada', width: 130, sortable: false, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{v}</span> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Reservas"
        subtitle={`${reservations.filter(r => r.status === 'confirmed').length} confirmadas · €${totalRevenue.toFixed(2)} en ingresos`}
      />

      <div className={styles.kpiRow}>
        <KPICard label="Total reservas" value={reservations.length} icon={Ticket} color="accent" />
        <KPICard label="Confirmadas" value={reservations.filter(r => r.status === 'confirmed').length} icon={Ticket} color="green" />
        <KPICard label="Pendientes" value={reservations.filter(r => r.status === 'pending').length} icon={Ticket} color="yellow" />
        <KPICard label="Ingresos confirmados" value={`€${totalRevenue.toFixed(0)}`} icon={Euro} color="green" />
      </div>

      <div className={styles.filterRow}>
        {[['all', 'Todas'], ...Object.entries(STATUS_MAP).map(([k, { label }]) => [k, label])].map(([k, label]) => (
          <button key={k} className={`${styles.filterBtn} ${filterStatus === k ? styles.filterActive : ''}`}
            onClick={() => setFilterStatus(k)}>{label}
            <span className={styles.filterCount}>{k === 'all' ? reservations.length : reservations.filter(r => r.status === k).length}</span>
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['id', 'client', 'email']}
        onRowClick={setDetail}
        rowKey="id"
        rowActions={(row) => (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Eye} onClick={() => setDetail(row)} title="Ver detalle" />
            {(row.status === 'confirmed' || row.status === 'pending') && (
              <Button variant="ghost" size="sm" icon={XCircle} onClick={() => setCancelTarget(row)} title="Cancelar" />
            )}
          </div>
        )}
      />

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Reserva ${detail?.id}`} size="sm">
        {detail && (() => {
          const s = sessions.find(s => s.id === detail.session_id);
          const m = s ? movies.find(m => m.id === s.movie_id) : null;
          return (
            <div className={styles.detail}>
              <div className={styles.detailSection}>
                <p className={styles.detailLbl}>Cliente</p>
                <p className={styles.detailVal}>{detail.client}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{detail.email}</p>
              </div>
              <div className={styles.detailSection}>
                <p className={styles.detailLbl}>Sesión</p>
                <p className={styles.detailVal}>{m?.title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{s?.date} — {s?.time} h</p>
              </div>
              <div className={styles.detailRow}>
                <div><p className={styles.detailLbl}>Asientos</p><p className={styles.detailVal} style={{ fontFamily: 'var(--mono)' }}>{detail.seats.join(', ')}</p></div>
                <div><p className={styles.detailLbl}>Pago</p><Badge variant={PAYMENT_COLOR[detail.payment]}>{PAYMENT_LABEL[detail.payment]}</Badge></div>
                <div><p className={styles.detailLbl}>Importe</p><p className={styles.detailVal}>€{detail.amount.toFixed(2)}</p></div>
                <div><p className={styles.detailLbl}>Estado</p><Badge variant={STATUS_MAP[detail.status]?.v} dot>{STATUS_MAP[detail.status]?.label}</Badge></div>
              </div>
              <div><p className={styles.detailLbl}>Fecha creación</p><p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: 3 }}>{detail.created_at}</p></div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Cancelar reserva" danger
        message={`¿Cancelar la reserva ${cancelTarget?.id} de ${cancelTarget?.client}?`}
        confirmLabel="Cancelar reserva" />
    </div>
  );
}
