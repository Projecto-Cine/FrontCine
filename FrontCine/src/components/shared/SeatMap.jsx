import { useMemo } from 'react';
import styles from './SeatMap.module.css';

// seats: ScreeningSeatResponseDTO[] — { id, fila, numero, ocupado }
// fila = row letter (A, B, …), numero = 1-based seat number within the row
export default function SeatMap({ seats = [], selectedIds = [], onToggle, maxSelect = 20 }) {
  const rows = useMemo(() => {
    const map = {};
    for (const seat of seats) {
      if (!map[seat.fila]) map[seat.fila] = [];
      map[seat.fila].push(seat);
    }
    for (const f of Object.keys(map)) {
      map[f].sort((a, b) => a.numero - b.numero);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [seats]);

  const maxCols   = useMemo(() => Math.max(...rows.map(([, r]) => r.length), 1), [rows]);
  const AISLE     = maxCols > 10 ? Math.floor(maxCols / 2) : -1;

  const occupied  = useMemo(() => seats.filter(s => s.ocupado).length, [seats]);
  const available = seats.length - occupied;
  const occPct    = seats.length ? Math.round((occupied / seats.length) * 100) : 0;

  const label = (s) => `${s.fila}${String(s.numero).padStart(2, '0')}`;

  const selectedSeats = useMemo(
    () => seats.filter(s => selectedIds.includes(s.id)),
    [seats, selectedIds]
  );

  const handleSeat = (seat) => {
    if (seat.ocupado) return;
    if (selectedIds.includes(seat.id)) {
      onToggle(selectedIds.filter(id => id !== seat.id));
    } else {
      if (selectedIds.length >= maxSelect) return;
      onToggle([...selectedIds, seat.id]);
    }
  };

  if (!seats.length) {
    return (
      <div className={styles.cinema}>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-3)', fontSize: 13 }}>
          Cargando mapa de asientos…
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cinema}>
      <div className={styles.screenArea}>
        <div className={styles.screenArc} />
        <span className={styles.screenLabel}>Pantalla</span>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={`${styles.legendSeat} ${styles.lFree}`} />Libre</span>
        <span className={styles.legendItem}><span className={`${styles.legendSeat} ${styles.lOcc}`} />Ocupada</span>
        <span className={styles.legendItem}><span className={`${styles.legendSeat} ${styles.lSel}`} />Seleccionada</span>
        <span className={styles.legendSep} />
        <span className={styles.legendInfo}>{available} libres · {occPct}% ocupación</span>
      </div>

      <div className={styles.mapScroll}>
        <div className={styles.grid}>
          {rows.map(([fila, rowSeats]) => (
            <div key={fila} className={styles.row}>
              <span className={styles.rowLbl}>{fila}</span>
              <div className={styles.seats}>
                {rowSeats.map((seat, c) => {
                  const isOcc = seat.ocupado;
                  const isSel = selectedIds.includes(seat.id);
                  const lbl   = label(seat);
                  return (
                    <div key={seat.id} className={styles.seatWrap}>
                      {c === AISLE && <span className={styles.aisle} />}
                      <button
                        className={`${styles.seat} ${isOcc ? styles.occ : isSel ? styles.sel : styles.free}`}
                        onClick={() => handleSeat(seat)}
                        disabled={isOcc}
                        title={isOcc ? `${lbl} — ocupada` : isSel ? `${lbl} — seleccionada` : `${lbl} — libre`}
                        aria-label={`Butaca ${lbl}${isOcc ? ' ocupada' : isSel ? ' seleccionada' : ' libre'}`}
                      />
                    </div>
                  );
                })}
              </div>
              <span className={styles.rowLbl}>{fila}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.selSummary}>
          <span className={styles.selLabel}>
            {selectedIds.length} butaca{selectedIds.length !== 1 ? 's' : ''} seleccionada{selectedIds.length !== 1 ? 's' : ''}:
          </span>
          <div className={styles.selBadges}>
            {selectedSeats.map(seat => (
              <button key={seat.id} className={styles.selBadge}
                onClick={() => onToggle(selectedIds.filter(id => id !== seat.id))}
                title={`Deseleccionar ${label(seat)}`}>
                {label(seat)} ×
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
