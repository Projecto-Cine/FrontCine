import { useMemo } from 'react';
import styles from './SeatMap.module.css';

const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Legacy: generate pseudo-random occupied seats when no real seat data is available
function generateOccupied(sessionId, capacity, sold) {
  let seed = (sessionId * 1664525 + 1013904223) & 0x7fffffff;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff; };
  const indices = Array.from({ length: capacity }, (_, i) => i);
  const toOccupy = Math.min(sold, capacity);
  for (let i = 0; i < toOccupy; i++) {
    const j = i + Math.floor(rand() * (capacity - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return new Set(indices.slice(0, toOccupy));
}

// Render from real seats returned by GET /screenings/:id/seats
function RealSeatMap({ seats, selectedSeats, onToggle, maxSelect }) {
  const rows = useMemo(() => {
    const map = {};
    seats.forEach(s => {
      if (!map[s.row]) map[s.row] = [];
      map[s.row].push(s);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([row, rowSeats]) => ({ row, seats: rowSeats.sort((a, b) => a.number - b.number) }));
  }, [seats]);

  const occupied = useMemo(
    () => new Set(seats.filter(s => s.status === 'occupied' || s.status === 'reserved').map(s => `${s.row}${String(s.number).padStart(2, '0')}`)),
    [seats]
  );

  const available = seats.filter(s => s.status === 'available').length;
  const total     = seats.length;
  const occPct    = total > 0 ? Math.round(((total - available) / total) * 100) : 0;
  const maxCols   = Math.max(...rows.map(r => r.seats.length), 1);
  const AISLE     = maxCols > 10 ? Math.floor(maxCols / 2) : -1;

  const handleSeat = (id, isOcc) => {
    if (isOcc) return;
    if (selectedSeats.includes(id)) {
      onToggle(selectedSeats.filter(s => s !== id));
    } else {
      if (selectedSeats.length >= maxSelect) return;
      onToggle([...selectedSeats, id]);
    }
  };

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
          {rows.map(({ row, seats: rowSeats }) => (
            <div key={row} className={styles.row}>
              <span className={styles.rowLbl}>{row}</span>
              <div className={styles.seats}>
                {rowSeats.map((seat, c) => {
                  const id    = `${seat.row}${String(seat.number).padStart(2, '0')}`;
                  const isOcc = occupied.has(id);
                  const isSel = selectedSeats.includes(id);
                  return (
                    <div key={seat.id} className={styles.seatWrap}>
                      {c === AISLE && <span className={styles.aisle} />}
                      <button
                        className={`${styles.seat} ${isOcc ? styles.occ : isSel ? styles.sel : styles.free}`}
                        onClick={() => handleSeat(id, isOcc)}
                        disabled={isOcc}
                        title={isOcc ? `${id} — ocupada` : isSel ? `${id} — seleccionada` : `${id} — libre`}
                        aria-label={`Butaca ${id}${isOcc ? ' ocupada' : isSel ? ' seleccionada' : ' libre'}`}
                      />
                    </div>
                  );
                })}
              </div>
              <span className={styles.rowLbl}>{row}</span>
            </div>
          ))}
        </div>
      </div>
      {selectedSeats.length > 0 && (
        <div className={styles.selSummary}>
          <span className={styles.selLabel}>{selectedSeats.length} butaca{selectedSeats.length !== 1 ? 's' : ''} seleccionada{selectedSeats.length !== 1 ? 's' : ''}:</span>
          <div className={styles.selBadges}>
            {selectedSeats.map(s => (
              <button key={s} className={styles.selBadge} onClick={() => onToggle(selectedSeats.filter(x => x !== s))} title={`Deseleccionar ${s}`}>{s} ×</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Legacy grid render when no real seats are available from the backend
function GeneratedSeatMap({ session, room, selectedSeats, onToggle, maxSelect }) {
  const COLS = room.capacity <= 80 ? 8 : room.capacity <= 150 ? 12 : room.capacity <= 220 ? 16 : 20;
  const ROWS = Math.ceil(room.capacity / COLS);
  const AISLE = COLS > 10 ? Math.floor(COLS / 2) : -1;

  const occupied = useMemo(
    () => generateOccupied(session.id, room.capacity, session.sold ?? 0),
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

  const available = room.capacity - (session.sold ?? 0);
  const occPct    = Math.round(((session.sold ?? 0) / room.capacity) * 100);

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
          {Array.from({ length: ROWS }, (_, r) => {
            const letter = ROW_LETTERS[r] ?? String(r + 1);
            return (
              <div key={letter} className={styles.row}>
                <span className={styles.rowLbl}>{letter}</span>
                <div className={styles.seats}>
                  {Array.from({ length: COLS }, (_, c) => {
                    const idx = r * COLS + c;
                    if (idx >= room.capacity) return <span key={c} className={styles.ghost} />;
                    const id    = `${letter}${String(c + 1).padStart(2, '0')}`;
                    const isOcc = occupied.has(idx);
                    const isSel = selectedSeats.includes(id);
                    return (
                      <div key={c} className={styles.seatWrap}>
                        {c === AISLE && <span className={styles.aisle} />}
                        <button
                          className={`${styles.seat} ${isOcc ? styles.occ : isSel ? styles.sel : styles.free}`}
                          onClick={() => handleSeat(id, isOcc)}
                          disabled={isOcc}
                          title={isOcc ? `${id} — ocupada` : isSel ? `${id} — seleccionada` : `${id} — libre`}
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
      {selectedSeats.length > 0 && (
        <div className={styles.selSummary}>
          <span className={styles.selLabel}>{selectedSeats.length} butaca{selectedSeats.length !== 1 ? 's' : ''} seleccionada{selectedSeats.length !== 1 ? 's' : ''}:</span>
          <div className={styles.selBadges}>
            {selectedSeats.map(s => (
              <button key={s} className={styles.selBadge} onClick={() => onToggle(selectedSeats.filter(x => x !== s))} title={`Deseleccionar ${s}`}>{s} ×</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SeatMap({ session, room, selectedSeats, onToggle, maxSelect = 20, seats = null }) {
  if (seats && seats.length > 0) {
    return <RealSeatMap seats={seats} selectedSeats={selectedSeats} onToggle={onToggle} maxSelect={maxSelect} />;
  }
  if (!session || !room) return null;
  return <GeneratedSeatMap session={session} room={room} selectedSeats={selectedSeats} onToggle={onToggle} maxSelect={maxSelect} />;
}
