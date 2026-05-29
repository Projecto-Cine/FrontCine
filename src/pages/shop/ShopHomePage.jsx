import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, ChevronRight, Calendar, Star, Clock } from 'lucide-react';
import { sessionsService } from '../../services/sessionsService';
import styles from './ShopHomePage.module.css';

const MOV_IMG_KEY = 'lumen_movie_posters';
const getStoredPosters = () => { try { return JSON.parse(localStorage.getItem(MOV_IMG_KEY) ?? '{}'); } catch { return {}; } };

const FORMAT_COLOR = { IMAX: 'var(--purple)', '4DX': 'var(--red)', '3D': 'var(--cyan)', '2D': 'var(--text-3)', 'IMAX 3D': 'var(--purple)', '2D/3D': 'var(--cyan)' };
const AGE_COLOR    = { 'G': 'var(--green)', 'PG': 'var(--green)', 'PG-13': 'var(--yellow)', 'R': 'var(--red)', 'NC-17': 'var(--red)', '+18': 'var(--red)', '+16': 'var(--yellow)', '+12': 'var(--yellow)', '+7': 'var(--green)', 'TP': 'var(--green)' };

function buildDates() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    return { iso, label };
  });
}

function isSessionExpired(s) {
  const dt = s.startTime ?? s.dateTime ?? null;
  if (!dt) return false;
  const started = new Date(dt);
  const durationMin = s.movie?.durationMin ?? null;
  const endTime = durationMin
    ? new Date(started.getTime() + durationMin * 60 * 1000)
    : new Date(started.getTime() + 3 * 60 * 60 * 1000);
  return Date.now() > endTime.getTime();
}

export default function ShopHomePage() {
  const navigate = useNavigate();
  const dates = useMemo(buildDates, []);
  const [selectedDate, setSelectedDate] = useState(dates[0].iso);
  const [sessions, setSessions]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    sessionsService.getAll({ date: selectedDate })
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        const posters = getStoredPosters();
        setSessions(arr.map(s => {
          if (!s.movie) return s;
          const imgUrl = posters[String(s.movie.id)] || s.movie.imageUrl || s.movie.poster || '';
          return imgUrl ? { ...s, movie: { ...s.movie, imageUrl: imgUrl } } : s;
        }));
      })
      .catch(() => setError('No se pudieron cargar las sesiones. Comprueba tu conexión.'))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const todayIso = dates[0].iso;
  const activeSessions = sessions.filter(s => {
    if (selectedDate === todayIso) return !isSessionExpired(s);
    return true;
  });

  const movieGroups = useMemo(() => {
    const groups = {};
    activeSessions.forEach(s => {
      const mv  = s.movie ?? {};
      const mid = mv.id ?? s.movie_id;
      if (mid == null) return;
      if (!groups[mid]) groups[mid] = { movie: mv, sessions: [] };
      groups[mid].sessions.push(s);
    });
    return Object.values(groups).sort((a, b) => (a.movie.title ?? '').localeCompare(b.movie.title ?? ''));
  }, [activeSessions]);

  return (
    <div className={styles.page}>
      {/* Date selector */}
      <div className={styles.dateBar}>
        <div className={styles.dateScroll}>
          {dates.map(d => (
            <button
              key={d.iso}
              className={`${styles.dateBtn} ${selectedDate === d.iso ? styles.dateBtnActive : ''}`}
              onClick={() => setSelectedDate(d.iso)}
            >
              <Calendar size={12} aria-hidden="true" />
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className={styles.loadingState}>
          {[1,2,3].map(i => <div key={i} className={styles.skeletonCard} />)}
        </div>
      )}

      {!loading && error && (
        <div className={styles.emptyState}>
          <Film size={40} className={styles.emptyIcon} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && movieGroups.length === 0 && (
        <div className={styles.emptyState}>
          <Film size={40} className={styles.emptyIcon} />
          <p>No hay sesiones disponibles para este día.</p>
        </div>
      )}

      {!loading && !error && movieGroups.length > 0 && (
        <div className={styles.movieList}>
          {movieGroups.map(({ movie, sessions: movieSessions }) => (
            <div key={movie.id} className={styles.movieCard}>
              <div className={styles.cardTop}>
                <div className={styles.posterWrap}>
                  {movie.imageUrl
                    ? <img src={movie.imageUrl} alt={movie.title} className={styles.poster} />
                    : <div className={styles.posterPlaceholder}><Film size={28} /></div>
                  }
                </div>
                <div className={styles.movieInfo}>
                  <h2 className={styles.movieTitle}>{movie.title}</h2>
                  <div className={styles.movieMeta}>
                    {movie.genre && <span className={styles.genre}>{movie.genre}</span>}
                    {movie.ageRating && (
                      <span className={styles.ageTag} style={{ color: AGE_COLOR[movie.ageRating] ?? 'var(--text-2)' }}>
                        {movie.ageRating}
                      </span>
                    )}
                    {movie.durationMin && (
                      <span className={styles.duration}><Clock size={11} aria-hidden="true" />{movie.durationMin} min</span>
                    )}
                    {movie.language && <span className={styles.lang}>{movie.language}</span>}
                  </div>
                  {movie.director && <p className={styles.director}>{movie.director}</p>}
                </div>
              </div>

              <div className={styles.sessionsRow}>
                {movieSessions
                  .sort((a, b) => {
                    const ta = a.startTime ?? a.dateTime ?? '';
                    const tb = b.startTime ?? b.dateTime ?? '';
                    return ta.localeCompare(tb);
                  })
                  .map(s => {
                    const time = s.startTime?.split('T')[1]?.substring(0, 5) ?? s.dateTime?.split('T')[1]?.substring(0, 5) ?? s.time?.trim()?.substring(0, 5) ?? '--:--';
                    const fmt  = s.movie?.format ?? s.format ?? '';
                    const room = s.theater?.name ?? s.room?.name ?? '';
                    const avail = s.availableSeats ?? null;
                    return (
                      <button
                        key={s.id}
                        className={styles.sessionPill}
                        onClick={() => navigate(`/shop/session/${s.id}`, { state: { screening: s } })}
                      >
                        <span className={styles.pillTime}>{time}</span>
                        {fmt && <span className={styles.pillFormat} style={{ color: FORMAT_COLOR[fmt] ?? 'var(--text-3)' }}>{fmt}</span>}
                        {room && <span className={styles.pillRoom}>{room.split('—')[0].trim()}</span>}
                        {avail !== null && (
                          <span className={styles.pillAvail} style={{ color: avail < 10 ? 'var(--red)' : avail < 30 ? 'var(--yellow)' : 'var(--green)' }}>
                            {avail > 0 ? `${avail} libres` : 'Agotado'}
                          </span>
                        )}
                        <ChevronRight size={13} className={styles.pillArrow} aria-hidden="true" />
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
