import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import logoSrc from '../assets/logoLumen.png';
import styles from './Login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(username.trim(), password);
    setLoading(false);
    if (ok) navigate('/', { replace: true });
  };

  const fillDemo = (u) => {
    setUsername(u);
    setPassword('lumen2026');
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
            <label htmlFor="login-username" className={styles.label}>Usuario</label>
            <input
              id="login-username"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              type="text"
              autoComplete="username"
              placeholder="nombre.usuario"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
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
          <span>Acceso restringido a personal autorizado. Demo: <strong>admin1</strong> / <strong>lumen2026</strong></span>
        </div>

        <div className={styles.demoAccounts}>
          <p className={styles.demoTitle} id="demo-accounts-label">Cuentas de demo</p>
          <div className={styles.demoGrid} role="group" aria-labelledby="demo-accounts-label">
            {[
              { u: 'admin1',      r: 'Administrador' },
              { u: 'supervisor1', r: 'Supervisor' },
              { u: 'operador1',   r: 'Operador' },
              { u: 'taquilla1',   r: 'Taquilla' },
            ].map(({ u, r }) => (
              <button
                key={u}
                className={styles.demoBtn}
                type="button"
                onClick={() => fillDemo(u)}
                aria-label={`Usar cuenta ${r}: ${u}`}
              >
                <span className={styles.demoUser}>{u}</span>
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
