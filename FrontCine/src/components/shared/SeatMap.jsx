import { useMemo } from 'react';
import styles from './SeatMap.module.css';

// Fisher-Yates partial shuffle — O(n), deterministic per sessionId
function generateOccupied(sessionId, capacity, sold) {
  let seed = (sessionId * 1664525 + 1013904223) & 0x7fffffff;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const indices = Array.from({ length: capacity }, (_, i) => i);
  const toOccupy = Math.min(sold, capacity);
  for (let i = 0; i < toOccupy; i++) {
    const j = i + Math.floor(rand() * (capacity - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return new Set(indices.slice(0, toOccupy));
}

const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function SeatMap({ session, room, selectedSeats, onToggle, maxSelect = 20 }) {
  if (!session || !room) return null;

  const COLS = room.capacity <= 80 ? 8 : room.capacity <= 150 ? 12 : room.capacity <= 220 ? 16 : 20;
  const ROWS = Math.ceil(room.capacity / COLS);
  const AISLE = COLS > 10 ? Math.floor(COLS / 2) : -1;

  const occupied = useMemo(
    () => generateOccupied(session.id, room.capacity, session.sold),
    [session.id, room.capacity, session.sold]
  );

  const handleSeat = (id, isOcc) => {
    if (isOcc) return;
    if (selectedSeats.includes(id)) {
      onToggle(selectedSeats.filter(s => s !== id));
    } else {
      if (selectedSeats.length >= maxSelect) return;
      onToggle([...selectedSeats, id]);
    }
  };

  const available = room.capacity - session.sold;
  const occPct = Math.round((session.sold / room.capacity) * 100);

  return (
    <div className={styles.cinema}>
      {/* Screen */}
      <div className={styles.screenArea}>
        <div className={styles.screenArc} />
        <span className={styles.screenLabel}>Pantalla</span>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSeat} ${styles.lFree}`} />Libre
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSeat} ${styles.lOcc}`} />Ocupada
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSeat} ${styles.lSel}`} />Seleccionada
        </span>
        <span className={styles.legendSep} />
        <span className={styles.legendInfo}>{available} libres · {occPct}% ocupación</span>
      </div>

      {/* Seat grid */}
      <div className={styles.mapScroll}>
        <div className={styles.grid}>
          {Array.from({ length: ROWS }, (_, r) => {
            const letter = ROW_LETTERS[r] ?? String(r + 1);
            return (
              <div key={letter} className={styles.row}>
                <span className={styles.rowLbl}>{letter}</span>

                <div className={styles.seats}>
                  {Array.from({ length: COLS }, (_, c) => {
                    const idx = r * COLS + c;
                    if (idx >= room.capacity) return <span key={c} className={styles.ghost} />;

                    const id = `${letter}${String(c + 1).padStart(2, '0')}`;
                    const isOcc = occupied.has(idx);
                    const isSel = selectedSeats.includes(id);

                    return (
                      <div key={c} className={styles.seatWrap}>
                        {c === AISLE && <span className={styles.aisle} />}
                        <button
                          className={`${styles.seat} ${isOcc ? styles.occ : isSel ? styles.sel : styles.free}`}
                          onClick={() => handleSeat(id, isOcc)}
                          disabled={isOcc}
                          title={
                            isOcc ? `${id} — ocupada`
                            : isSel ? `${id} — seleccionada`
                            : `${id} — libre`
                          }
                          aria-label={`Butaca ${id}${isOcc ? ' ocupada' : isSel ? ' seleccionada' : ' libre'}`}
                        />
                      </div>
                    );
                  })}
                </div>

                <span className={styles.rowLbl}>{letter}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selection summary */}
      {selectedSeats.length > 0 && (
        <div className={styles.selSummary}>
          <span className={styles.selLabel}>
            {selectedSeats.length} butaca{selectedSeats.length !== 1 ? 's' : ''} seleccionada{selectedSeats.length !== 1 ? 's' : ''}:
          </span>
          <div className={styles.selBadges}>
            {selectedSeats.map(s => (
              <button
                key={s}
                className={styles.selBadge}
                onClick={() => onToggle(selectedSeats.filter(x => x !== s))}
                title={`Deseleccionar ${s}`}
              >
                {s} ×
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
