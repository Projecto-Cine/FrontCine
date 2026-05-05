import { useState, useEffect } from 'react';
import { XCircle, Eye } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable  from '../../components/shared/DataTable';
import Badge      from '../../components/ui/Badge';
import Button     from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard    from '../../components/shared/KPICard';
import { Ticket, Euro } from 'lucide-react';
import { useApp }  from '../../contexts/AppContext';
import { reservationsService } from '../../services/reservationsService';
import { sessionsService }     from '../../services/sessionsService';
import { moviesService }       from '../../services/moviesService';
import styles from './ReservationsPage.module.css';

// Status values from the backend
const STATUS_MAP = {
  PENDING:   { label: 'Pendiente',   v: 'yellow'  },
  CONFIRMED: { label: 'Confirmada',  v: 'green'   },
  CANCELLED: { label: 'Cancelada',   v: 'default' },
};

function isPastSession(fechaHora) {
  return fechaHora ? new Date(fechaHora) < new Date() : false;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [sessions, setSessions]         = useState([]);
  const [movies, setMovies]             = useState([]);
  const [selectedScreeningId, setSelectedScreeningId] = useState('');
  const [loading, setLoading]           = useState(false);
  const [detail, setDetail]             = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useApp();

  // Load sessions and movies on mount for lookups and the screening selector
  useEffect(() => {
    sessionsService.getAll().then(setSessions).catch(() => {});
    moviesService.getAll().then(setMovies).catch(() => {});
  }, []);

  // Load purchases for the selected screening
  useEffect(() => {
    if (!selectedScreeningId) { setReservations([]); return; }
    setLoading(true);
    reservationsService.getByScreening(selectedScreeningId)
      .then(data => setReservations(Array.isArray(data) ? data : []))
      .catch(() => { toast('Error al cargar reservas.', 'error'); setReservations([]); })
      .finally(() => setLoading(false));
  }, [selectedScreeningId]);

  const filtered = filterStatus === 'all'
    ? reservations
    : reservations.filter(r => r.status === filterStatus);

  const handleCancel = async () => {
    const target = cancelTarget;
    setCancelTarget(null);
    try {
      await reservationsService.cancel(target.id);
      setReservations(prev => prev.map(r =>
        r.id === target.id ? { ...r, status: 'CANCELLED' } : r
      ));
      toast(`Compra #${target.id} cancelada.`, 'warning');
    } catch (err) {
      toast(err.message ?? 'Error al cancelar la reserva.', 'error');
    }
  };

  const paidCount    = reservations.filter(r => r.status === 'CONFIRMED').length;
  const pendingCount = reservations.filter(r => r.status === 'PENDING').length;

  // Helper: find the screening for a purchase (uses screeningId field)
  const getScreening = (r) => sessions.find(s => s.id === (r.screeningId ?? r.sesionId ?? r.session_id));
  const getMovie     = (s) => s ? (s.movie ?? movies.find(m => m.id === (s.peliculaId ?? s.movieId ?? s.movie_id ?? s.movie?.id))) : null;

  const columns = [
    { key: 'id',     label: 'Ref.',    width: 80,
      render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>#{v}</span> },
    { key: 'userId', label: 'Usuario', width: 90,
      render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{v}</span> },
    { key: 'screeningId', label: 'Sesión', render: (v, row) => {
      const s = getScreening(row);
      const title = row.movieTitulo ?? getMovie(s)?.titulo ?? '—';
      const time  = s?.fechaHora?.slice(11, 16) ?? '';
      return <span style={{ fontSize: 11 }}>{title} <span style={{ color: 'var(--text-3)' }}>{time}</span></span>;
    }},
    { key: 'tickets', label: 'Entradas', width: 80,
      render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{Array.isArray(v) ? v.length : '—'}</span> },
    { key: 'totalAmount', label: 'Importe', width: 90,
      render: v => v != null ? <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>€{Number(v).toFixed(2)}</span> : '—' },
    { key: 'status', label: 'Estado', width: 130,
      render: v => <Badge variant={STATUS_MAP[v]?.v ?? 'default'} dot>{STATUS_MAP[v]?.label ?? v}</Badge> },
    { key: 'createdAt', label: 'Creada', width: 130, sortable: false,
      render: v => v ? <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{v.slice(0, 16).replace('T', ' ')}</span> : '—' },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Reservas"
        subtitle={`${paidCount} confirmadas · ${pendingCount} pendientes`}
      />

      <div className={styles.kpiRow}>
        <KPICard label="Total reservas"  value={reservations.length} icon={Ticket} color="accent" />
        <KPICard label="Confirmadas"     value={paidCount}           icon={Ticket} color="green"  />
        <KPICard label="Pendientes"      value={pendingCount}        icon={Ticket} color="yellow" />
        <KPICard label="Canceladas"      value={reservations.filter(r => r.status === 'CANCELLED').length} icon={Euro} color="default" />
      </div>

      {/* Screening selector — no GET /api/purchases general exists; filter by screening */}
      <div className={styles.filterRow} style={{ gap: 12, flexWrap: 'wrap' }}>
        <select
          style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', cursor: 'pointer' }}
          value={selectedScreeningId}
          onChange={e => { setSelectedScreeningId(e.target.value); setFilterStatus('all'); }}
        >
          <option value="">— Selecciona una sesión —</option>
          {sessions.map(s => {
            const title = s.movie?.titulo ?? getMovie(s)?.titulo ?? `Sesión #${s.id}`;
            const time  = s.fechaHora?.slice(0, 16).replace('T', ' ') ?? '';
            return <option key={s.id} value={s.id}>{title} · {time}</option>;
          })}
        </select>

        {selectedScreeningId && (
          <div style={{ display: 'flex', gap: 4 }}>
            {[['all', 'Todas'], ...Object.entries(STATUS_MAP).map(([k, { label }]) => [k, label])].map(([k, label]) => (
              <button key={k} className={`${styles.filterBtn} ${filterStatus === k ? styles.filterActive : ''}`}
                onClick={() => setFilterStatus(k)}>{label}
                <span className={styles.filterCount}>
                  {k === 'all' ? reservations.length : reservations.filter(r => r.status === k).length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedScreeningId && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)', fontSize: 13 }}>
          Selecciona una sesión arriba para ver sus reservas.
        </div>
      )}

      {selectedScreeningId && (
        <DataTable
          columns={columns}
          data={filtered}
          searchKeys={['id', 'userId']}
          onRowClick={setDetail}
          rowKey="id"
          rowActions={(row) => {
            const screening = getScreening(row);
            const past      = isPastSession(screening?.fechaHora);
            const canCancel = row.status === 'PENDING' && !past;
            return (
              <div style={{ display: 'flex', gap: 2 }}>
                <Button variant="ghost" size="sm" icon={Eye}     onClick={() => setDetail(row)} title="Ver detalle" />
                {canCancel && (
                  <Button variant="ghost" size="sm" icon={XCircle} onClick={() => setCancelTarget(row)} title="Cancelar" />
                )}
              </div>
            );
          }}
        />
      )}

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Compra #${detail?.id}`} size="sm">
        {detail && (() => {
          const s = getScreening(detail);
          const title = detail.movieTitulo ?? getMovie(s)?.titulo ?? '—';
          const time  = detail.fechaHora?.slice(11, 16) ?? s?.fechaHora?.slice(11, 16) ?? '';
          const date  = detail.fechaHora?.slice(0, 10)  ?? s?.fechaHora?.slice(0, 10)  ?? '';
          return (
            <div className={styles.detail}>
              <div className={styles.detailSection}>
                <p className={styles.detailLbl}>Usuario ID</p>
                <p className={styles.detailVal}>{detail.userId}</p>
              </div>
              <div className={styles.detailSection}>
                <p className={styles.detailLbl}>Sesión</p>
                <p className={styles.detailVal}>{title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{date} — {time} h</p>
              </div>
              <div className={styles.detailRow}>
                <div>
                  <p className={styles.detailLbl}>Entradas</p>
                  <p className={styles.detailVal} style={{ fontFamily: 'var(--mono)' }}>
                    {Array.isArray(detail.tickets) ? detail.tickets.length : '—'}
                  </p>
                </div>
                <div>
                  <p className={styles.detailLbl}>Importe</p>
                  <p className={styles.detailVal}>
                    {detail.totalAmount != null ? `€${Number(detail.totalAmount).toFixed(2)}` : '—'}
                  </p>
                </div>
                <div>
                  <p className={styles.detailLbl}>Estado</p>
                  <Badge variant={STATUS_MAP[detail.status]?.v ?? 'default'} dot>
                    {STATUS_MAP[detail.status]?.label ?? detail.status}
                  </Badge>
                </div>
              </div>
              {Array.isArray(detail.tickets) && detail.tickets.length > 0 && (
                <div>
                  <p className={styles.detailLbl}>Tickets</p>
                  {detail.tickets.map(t => (
                    <p key={t.id ?? t.seatId} style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-2)', marginTop: 2 }}>
                      Asiento #{t.seatId} · {t.ticketType}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancelar compra"
        danger
        message={`¿Cancelar la compra #${cancelTarget?.id}? Se liberarán los asientos reservados.`}
        confirmLabel="Cancelar compra"
      />
    </div>
  );
}
