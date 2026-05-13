import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import Button from '../components/ui/Button';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import logoSrc from '../assets/logoLumen.png';
import logoWebp from '../assets/logoLumen.webp';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login, error, setError } = useAuth();
  const { t } = useLanguage();
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
    <main className={styles.page} aria-label={t('login.pageTitle')}>
      <div className={styles.langFloat}>
        <LanguageSwitcher variant="login" />
      </div>

      <div className={styles.panel}>
        <div className={styles.brand}>
          <picture>
            <source srcSet={logoWebp} type="image/webp" />
            <img src={logoSrc} alt="Lumen Cinema" className={styles.brandLogo} width={48} height={48} />
          </picture>
          <div className={styles.brandText}>
            <span className={styles.brandName}>LUMEN</span>
            <span className={styles.brandSub}>{t('login.subtitle')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>{t('login.emailLabel')}</label>
            <input
              id="login-email"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              type="email"
              autoComplete="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              aria-describedby={error ? 'login-error' : undefined}
              aria-invalid={error ? 'true' : undefined}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>{t('login.passwordLabel')}</label>
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
                aria-label={showPw ? t('login.hidePassword') : t('login.showPassword')}
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
            {t('login.submit')}
          </Button>
        </form>

        <div className={styles.hint}>
          <ShieldCheck size={12} aria-hidden="true" />
          <span>{t('login.hint')} <strong>admin@lumen.com</strong> / <strong>lumen2024</strong></span>
        </div>

        <div className={styles.demoAccounts}>
          <p className={styles.demoTitle} id="demo-accounts-label">{t('login.demoTitle')}</p>
          <div className={styles.demoGrid} role="group" aria-labelledby="demo-accounts-label">
            {[
              { e: 'admin@lumen.com',   rKey: 'login.roleAdmin' },
              { e: 'cliente@lumen.com', rKey: 'login.roleClient' },
            ].map(({ e, rKey }) => (
              <button
                key={e}
                className={styles.demoBtn}
                type="button"
                onClick={() => fillDemo(e)}
              >
                <span className={styles.demoUser}>{e}</span>
                <span className={styles.demoRole}>{t(rKey)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgGrid} />
        <div className={styles.bgGlow} />
      </div>
    </main>
  );
}
