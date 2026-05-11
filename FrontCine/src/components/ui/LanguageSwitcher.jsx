import { useLanguage } from '../../i18n/LanguageContext';
import styles from './LanguageSwitcher.module.css';

const LABELS = { es: 'ES', en: 'EN' };

export default function LanguageSwitcher({ variant = 'header' }) {
  const { lang, langs, setLang } = useLanguage();

  return (
    <div
      className={`${styles.pill} ${styles[variant]}`}
      role="group"
      aria-label="Language / Idioma"
    >
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          className={`${styles.btn} ${lang === l ? styles.active : ''}`}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          aria-label={l === 'es' ? 'Español' : 'English'}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
