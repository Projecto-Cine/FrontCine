import { useState } from 'react'
import MovieCard from '../components/molecules/MovieCard'
import Button from '../components/atoms/Button'

const FEATURED_MOVIES = [
  {
    id: 1,
    title: 'El Legado del Tiempo',
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop',
    genre: 'Sci-Fi',
    rating: '8.5',
    duration: 148,
  },
  {
    id: 2,
    title: 'Noche en la Ciudad',
    poster: 'https://images.unsplash.com/photo-1533613220915-609f21a91335?w=400&h=600&fit=crop',
    genre: 'Drama',
    rating: '7.8',
    duration: 125,
  },
  {
    id: 3,
    title: 'Aventura Extrema',
    poster: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    genre: 'Acción',
    rating: '8.2',
    duration: 142,
  },
  {
    id: 4,
    title: 'Historias Cruzadas',
    poster: 'https://images.unsplash.com/photo-1489749798305-4fea3ba63d60?w=400&h=600&fit=crop',
    genre: 'Romance',
    rating: '7.9',
    duration: 135,
  },
  {
    id: 5,
    title: 'Misterio sin Resolver',
    poster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop',
    genre: 'Thriller',
    rating: '8.3',
    duration: 130,
  },
  {
    id: 6,
    title: 'Risa Garantizada',
    poster: 'https://images.unsplash.com/photo-1499627136200-c474db8a13d8?w=400&h=600&fit=crop',
    genre: 'Comedia',
    rating: '7.5',
    duration: 110,
  },
]

export default function HomePage() {
  const [selectedMovie, setSelectedMovie] = useState(null)

  return (
    <div className="page-wrapper">
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Experiencia Premium</h1>
          <p style={styles.heroSubtitle}>
            Vive el cine como nunca antes. Tecnología 4K láser, sonido Dolby Atmos y butacas reclinables premium.
          </p>
          <div style={styles.heroButtons}>
            <Button variant="gold" size="lg">Comprar entradas</Button>
            <Button variant="outline" size="lg">Ver cartelera</Button>
          </div>
        </div>
      </section>

      <div className="main-content">
        {/* En cartelera ahora Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">En cartelera ahora</h2>
          </div>
          <div className="grid-auto">
            {FEATURED_MOVIES.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onSelect={setSelectedMovie} />
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="section" style={{ marginTop: '4rem' }}>
          <h2 className="section-title" style={{ marginBottom: '2rem', textAlign: 'center' }}>¿Por qué elegirnos?</h2>
          <div className="grid-3">
            {[
              { icon: '🎬', title: 'Experiencia IMAX', desc: 'Pantallas de gran formato para una inmersión total' },
              { icon: '🔊', title: 'Sonido Dolby Atmos', desc: 'Sonido envolvente de última generación' },
              { icon: '💺', title: 'Butacas Premium', desc: 'Reclinables con máxima comodidad' },
            ].map((feature, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '700', marginBottom: '0.5rem' }}>{feature.title}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

const styles = {
  hero: {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    minHeight: '500px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    marginTop: 'var(--navbar-height)',
  },
  heroContent: {
    maxWidth: '600px',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 'var(--text-4xl)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '1rem',
  },
  heroSubtitle: {
    fontSize: 'var(--text-lg)',
    color: 'var(--text-secondary)',
    marginBottom: '2rem',
  },
  heroButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
}
