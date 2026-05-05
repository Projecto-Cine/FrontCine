import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import logoSrc from '../assets/logoLumen.png';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email.trim(), password);
    if (ok) navigate('/', { replace: true });
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <img src={logoSrc} alt="Lumen Cinema" className={styles.brandLogo} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>LUMEN</span>
            <span className={styles.brandSub}>Sistema de Gestión Interna</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              type="email" autoComplete="email" autoFocus
              placeholder="usuario@lumen.com"
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Contraseña</label>
            <div className={styles.pwWrap}>
              <input
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              />
              <button type="button" className={styles.pwToggle} onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <Button type="submit" variant="primary" size="lg" loading={loading} className={styles.submitBtn}>
            Acceder al sistema
          </Button>
        </form>

        <div className={styles.hint}>
          <ShieldCheck size={12} />
          <span>Acceso restringido a personal autorizado. Demo: <strong>admin@lumen.com</strong> / <strong>lumen2024</strong></span>
        </div>

        <div className={styles.demoAccounts}>
          <p className={styles.demoTitle}>Cuentas de demo</p>
          <div className={styles.demoGrid}>
            {[
              { e: 'admin@lumen.com',   r: 'Administrador' },
              { e: 'cliente@lumen.com', r: 'Cliente' },
            ].map(({ e, r }) => (
              <button key={e} className={styles.demoBtn} type="button"
                onClick={() => { setEmail(e); setPassword('lumen2024'); setError(''); }}>
                <span className={styles.demoUser}>{e}</span>
                <span className={styles.demoRole}>{r}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bg}>
        <div className={styles.bgGrid} />
        <div className={styles.bgGlow} />
      </div>
    </div>
  );
}
