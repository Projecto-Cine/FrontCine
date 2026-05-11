import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import logoSrc from '../assets/logoLumen.png';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);
    if (ok) navigate('/', { replace: true });
  };

  const fillDemo = (e) => {
    setEmail(e);
    setPassword('lumen2024');
    setError('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <img src={logoSrc} alt="Lumen Cinema" className={styles.brandLogo} width={48} height={48} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>LUMEN</span>
            <span className={styles.brandSub}>Sistema de Gestión Interna</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>Email</label>
            <input
              id="login-email"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              type="email"
              autoComplete="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              aria-describedby={error ? 'login-error' : undefined}
              aria-invalid={error ? 'true' : undefined}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>Contraseña</label>
            <div className={styles.pwWrap}>
              <input
                id="login-password"
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                aria-describedby={error ? 'login-error' : undefined}
                aria-invalid={error ? 'true' : undefined}
              />
              <button
                type="button"
                className={styles.pwToggle}
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPw}
              >
                {showPw ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && (
            <div id="login-error" className={styles.error} role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" loading={loading} className={styles.submitBtn}>
            Acceder al sistema
          </Button>
        </form>

        <div className={styles.hint}>
          <ShieldCheck size={12} aria-hidden="true" />
          <span>Acceso restringido a personal autorizado. Demo: <strong>admin@lumen.com</strong> / <strong>lumen2024</strong></span>
        </div>

        <div className={styles.demoAccounts}>
          <p className={styles.demoTitle} id="demo-accounts-label">Cuentas de demo</p>
          <div className={styles.demoGrid} role="group" aria-labelledby="demo-accounts-label">
            {[
              { e: 'admin@lumen.com',   r: 'Administrador' },
              { e: 'cliente@lumen.com', r: 'Cliente' },
            ].map(({ e, r }) => (
              <button
                key={e}
                className={styles.demoBtn}
                type="button"
                onClick={() => fillDemo(e)}
                aria-label={`Usar cuenta ${r}: ${e}`}
              >
                <span className={styles.demoUser}>{e}</span>
                <span className={styles.demoRole}>{r}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgGrid} />
        <div className={styles.bgGlow} />
      </div>
    </div>
  );
}
