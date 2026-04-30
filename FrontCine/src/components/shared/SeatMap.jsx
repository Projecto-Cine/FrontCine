import { useMemo } from 'react';
import styles from './SeatMap.module.css';

// Genera una disposición de butacas determinista basada en el ID de sesión
function generateOccupied(sessionId, capacity, sold) {
  const rng = (seed) => {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0xffffffff; };
  };
  const rand = rng(sessionId * 31337);
  const total = capacity;
  const occupied = new Set();
  while (occupied.size < Math.min(sold, total)) {
    const idx = Math.floor(rand() * total);
    occupied.add(idx);
  }
  return occupied;
}

export default function SeatMap({ session, room, selectedSeats, onToggle, maxSelect = 10 }) {
  if (!session || !room) return null;

  const COLS = room.capacity <= 80 ? 8 : room.capacity <= 150 ? 12 : room.capacity <= 220 ? 16 : 20;
  const ROWS = Math.ceil(room.capacity / COLS);
  const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const occupied = useMemo(
    () => generateOccupied(session.id, room.capacity, session.sold),
    [session.id, room.capacity, session.sold]
  );

  const seats = useMemo(() => {
    const arr = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        if (idx >= room.capacity) { row.push(null); continue; }
        const id = `${ROW_LETTERS[r]}${String(c + 1).padStart(2, '0')}`;
        row.push({ id, idx, occupied: occupied.has(idx) });
      }
      arr.push({ letter: ROW_LETTERS[r], seats: row });
    }
    return arr;
  }, [ROWS, COLS, room.capacity, occupied]);

  const handleClick = (seat) => {
    if (!seat || seat.occupied) return;
    if (selectedSeats.includes(seat.id)) {
      onToggle(selectedSeats.filter(s => s !== seat.id));
    } else {
      if (selectedSeats.length >= maxSelect) return;
      onToggle([...selectedSeats, seat.id]);
    }
  };

  const available = room.capacity - session.sold;
  const occPct = Math.round((session.sold / room.capacity) * 100);

  return (
    <div className={styles.wrap}>
      {/* Screen */}
      <div className={styles.screenWrap}>
        <div className={styles.screen}>PANTALLA</div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <span className={styles.statItem}><span className={styles.dot} style={{ background: 'var(--text-3)' }} />Ocupada</span>
        <span className={styles.statItem}><span className={styles.dot} style={{ background: 'var(--bg-4)', border: '1px solid var(--border-l)' }} />Libre</span>
        <span className={styles.statItem}><span className={styles.dot} style={{ background: 'var(--accent)' }} />Seleccionada</span>
        <span className={styles.statSep} />
        <span className={styles.statInfo}>{available} libres · {occPct}% ocupación</span>
      </div>

      {/* Grid */}
      <div className={styles.grid} style={{ '--cols': COLS }}>
        {seats.map(({ letter, seats: row }) => (
          <div key={letter} className={styles.row}>
            <span className={styles.rowLabel}>{letter}</span>
            <div className={styles.rowSeats}>
              {/* Gap central para pasillo */}
              {row.map((seat, ci) => {
                const isGap = COLS > 10 && ci === Math.floor(COLS / 2);
                return (
                  <div key={seat?.id ?? `gap-${letter}-${ci}`} style={{ display: 'flex', gap: isGap ? 12 : 0 }}>
                    {isGap && <span className={styles.aisle} />}
                    {seat ? (
                      <button
                        className={`${styles.seat}
                          ${seat.occupied ? styles.seatOcc : ''}
                          ${selectedSeats.includes(seat.id) ? styles.seatSel : ''}
                          ${!seat.occupied && !selectedSeats.includes(seat.id) ? styles.seatFree : ''}
                        `}
                        onClick={() => handleClick(seat)}
                        title={`Butaca ${seat.id}${seat.occupied ? ' — ocupada' : ''}`}
                        disabled={seat.occupied}
                        aria-label={`${seat.id}${seat.occupied ? ' ocupada' : selectedSeats.includes(seat.id) ? ' seleccionada' : ' libre'}`}
                      />
                    ) : (
                      <span className={styles.emptySeat} />
                    )}
                  </div>
                );
              })}
            </div>
            <span className={styles.rowLabel}>{letter}</span>
          </div>
        ))}
      </div>

      {/* Selected summary */}
      {selectedSeats.length > 0 && (
        <div className={styles.selection}>
          <span className={styles.selLabel}>Butacas seleccionadas:</span>
          <div className={styles.selSeats}>
            {selectedSeats.map(s => (
              <span key={s} className={styles.selBadge}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
