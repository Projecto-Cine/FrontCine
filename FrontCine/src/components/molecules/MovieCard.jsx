import Badge from '../atoms/Badge'

export default function MovieCard({ movie, onSelect }) {
  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={() => onSelect?.(movie)}>
      {movie.poster && (
        <img
          src={movie.poster}
          alt={movie.title}
          style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
        />
      )}
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '700', marginBottom: '0.5rem' }}>{movie.title}</h3>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {movie.genre && <Badge color="gold">{movie.genre}</Badge>}
        {movie.rating && <Badge color="green">{movie.rating}</Badge>}
      </div>
      {movie.duration && <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{movie.duration} min</p>}
    </div>
  )
}
