export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        {/* Column 1 — Brand */}
        <div style={styles.col}>
          <div style={styles.brand}>
            <img
              src="/claroOscuro.png"
              alt="Claroscuro Cine"
              style={styles.logoImg}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          <p style={styles.brandDesc}>
            Experiencia cinematográfica premium en el corazón de la ciudad.
            El arte del claroscuro hecho cine.
          </p>
        </div>

        {/* Column 2 — Contacto */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Contacto</h4>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <span style={styles.icon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.89a16 16 0 0 0 6 6l.89-.89a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              +34 91 234 56 78
            </li>
            <li style={styles.listItem}>
              <span style={styles.icon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              info@claroscurocine.es
            </li>
            <li style={styles.listItem}>
              <span style={styles.icon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              Calle Gran Vía 28, Madrid
            </li>
          </ul>
        </div>

        {/* Column 3 — Legal */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Legal</h4>
          <ul style={styles.list}>
            {['Política de privacidad', 'Términos de uso', 'Cookies', 'Accesibilidad', 'Aviso legal'].map((item) => (
              <li key={item}>
                <a href="#" style={styles.link}>{item}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4 — Síguenos */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Síguenos</h4>
          <div style={styles.socials}>
            {[
              { name: 'Instagram', href: '#' },
              { name: 'Twitter / X', href: '#' },
              { name: 'Facebook', href: '#' },
              { name: 'YouTube', href: '#' },
            ].map(({ name, href }) => (
              <a key={name} href={href} style={styles.socialLink}>
                {name}
              </a>
            ))}
          </div>
          <div style={styles.hours}>
            <p style={styles.hoursTitle}>Horario de taquilla</p>
            <p style={styles.hoursText}>Lun–Vie: 11:00 – 23:30</p>
            <p style={styles.hoursText}>Sáb–Dom: 10:00 – 00:30</p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={styles.copyright}>
        <hr style={styles.divider} />
        <p style={styles.copyrightText}>
          © {year} Claroscuro Cine. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}

const styles = {
  footer: {
    background: '#0d0d0d',
    borderTop: '1px solid #2a2a2a',
    padding: '3rem 2rem 1.5rem',
    marginTop: 'auto',
  },
  inner: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2.5rem',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  logoImg: {
    height: '90px',
    width: 'auto',
    objectFit: 'contain',
    display: 'block',
  },
  brandName: {
    fontSize: '0.875rem',
    fontWeight: '800',
    color: '#c9a84c',
    letterSpacing: '0.1em',
  },
  brandDesc: {
    fontSize: '0.8125rem',
    color: '#666',
    lineHeight: '1.6',
  },
  colTitle: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#c9a84c',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '0.25rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8125rem',
    color: '#9a9a9a',
  },
  icon: {
    color: '#c9a84c',
    flexShrink: 0,
    display: 'flex',
  },
  link: {
    fontSize: '0.8125rem',
    color: '#9a9a9a',
    textDecoration: 'none',
    transition: 'color 200ms ease',
    display: 'block',
    paddingBottom: '0.125rem',
  },
  socials: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  socialLink: {
    fontSize: '0.8125rem',
    color: '#9a9a9a',
    textDecoration: 'none',
    transition: 'color 200ms ease',
  },
  hours: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
  },
  hoursTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#c9a84c',
    marginBottom: '0.375rem',
  },
  hoursText: {
    fontSize: '0.75rem',
    color: '#9a9a9a',
  },
  copyright: {
    maxWidth: '1400px',
    margin: '0 auto',
    marginTop: '2rem',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #2a2a2a',
    marginBottom: '1rem',
  },
  copyrightText: {
    fontSize: '0.75rem',
    color: '#666',
    textAlign: 'center',
  },
}
