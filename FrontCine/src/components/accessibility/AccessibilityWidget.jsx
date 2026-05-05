import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Accessibility, X, SunMoon, ALargeSmall, Underline, Volume2, VolumeX,
  ChevronUp, ChevronDown, RotateCcw,
} from 'lucide-react';
import styles from './AccessibilityWidget.module.css';

const STORAGE_KEY = 'lumen_a11y';

const DEFAULTS = {
  highContrast:   false,
  fontSize:       'normal',   // 'normal' | 'large' | 'xlarge'
  underlineLinks: false,
  ttsEnabled:     false,
};

function loadPrefs() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return DEFAULTS; }
}

function savePrefs(prefs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
}

function applyToHtml(prefs) {
  const html = document.documentElement;
  html.classList.toggle('a11y-high-contrast',   prefs.highContrast);
  html.classList.toggle('a11y-underline-links',  prefs.underlineLinks);
  html.classList.remove('a11y-font-large', 'a11y-font-xlarge');
  if (prefs.fontSize === 'large')  html.classList.add('a11y-font-large');
  if (prefs.fontSize === 'xlarge') html.classList.add('a11y-font-xlarge');
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function AccessibilityWidget() {
  const [open, setOpen]   = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);
  const panelRef  = useRef(null);
  const triggerRef = useRef(null);
  const synthRef  = useRef(null);

  // Aplicar preferencias al DOM y guardar
  useEffect(() => {
    applyToHtml(prefs);
    savePrefs(prefs);
  }, [prefs]);

  // Focus trap + Escape en el panel
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const firstFocusable = panel?.querySelectorAll(FOCUSABLE)[0];
    (firstFocusable ?? panel)?.focus();

    const handleKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); return; }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(panel?.querySelectorAll(FOCUSABLE) ?? []);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    const handleClickOutside = (e) => {
      if (!panel?.contains(e.target) && e.target !== triggerRef.current) setOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Limpiar TTS al desmontar
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const update = useCallback((key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    window.speechSynthesis?.cancel();
    setPrefs(DEFAULTS);
  }, []);

  const toggleTts = useCallback(() => {
    const next = !prefs.ttsEnabled;
    if (!next) window.speechSynthesis?.cancel();
    update('ttsEnabled', next);
  }, [prefs.ttsEnabled, update]);

  const readSelection = useCallback(() => {
    const sel = window.getSelection()?.toString().trim();
    const text = sel || document.getElementById('main-content')?.innerText?.slice(0, 500) || 'Sin texto seleccionado';
    window.speechSynthesis?.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'es-ES';
    utt.rate = 0.95;
    synthRef.current = utt;
    window.speechSynthesis?.speak(utt);
  }, []);

  const stopReading = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  const fontSizeOptions = [
    { value: 'normal', label: 'Normal',  shortLabel: 'A',  desc: '14px — tamaño base' },
    { value: 'large',  label: 'Grande',  shortLabel: 'A+', desc: '17px — tamaño aumentado' },
    { value: 'xlarge', label: 'X-Grande',shortLabel: 'A++',desc: '20px — tamaño máximo' },
  ];

  const ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className={styles.widget}>
      {/* Panel desplegable */}
      {open && (
        <div
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label="Opciones de accesibilidad"
          tabIndex={-1}
        >
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>
              <Accessibility size={14} aria-hidden="true" />
              Accesibilidad
            </span>
            <button
              className={styles.closeBtn}
              onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
              aria-label="Cerrar opciones de accesibilidad"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.panelBody}>
            {/* 1 — Alto contraste */}
            <div className={styles.control}>
              <div className={styles.controlInfo}>
                <SunMoon size={15} aria-hidden="true" className={styles.controlIcon} />
                <div>
                  <span className={styles.controlLabel}>Alto contraste</span>
                  <span className={styles.controlDesc}>Mayor diferencia entre colores</span>
                </div>
              </div>
              <button
                className={`${styles.toggle} ${prefs.highContrast ? styles.toggleOn : ''}`}
                onClick={() => update('highContrast', !prefs.highContrast)}
                role="switch"
                aria-checked={prefs.highContrast}
                aria-label={`Alto contraste: ${prefs.highContrast ? 'activado' : 'desactivado'}`}
              >
                <span className={styles.toggleThumb} aria-hidden="true" />
                <span className="sr-only">{prefs.highContrast ? 'Activado' : 'Desactivado'}</span>
              </button>
            </div>

            {/* 2 — Tamaño de texto */}
            <div className={styles.control}>
              <div className={styles.controlInfo}>
                <ALargeSmall size={15} aria-hidden="true" className={styles.controlIcon} />
                <div>
                  <span className={styles.controlLabel}>Tamaño de texto</span>
                  <span className={styles.controlDesc}>Ajustar el tamaño de la letra</span>
                </div>
              </div>
              <div className={styles.fontBtns} role="group" aria-label="Tamaño de texto">
                {fontSizeOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`${styles.fontBtn} ${prefs.fontSize === opt.value ? styles.fontBtnActive : ''}`}
                    onClick={() => update('fontSize', opt.value)}
                    aria-pressed={prefs.fontSize === opt.value}
                    aria-label={`${opt.label}: ${opt.desc}`}
                    title={opt.desc}
                  >
                    {opt.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 — Subrayar enlaces */}
            <div className={styles.control}>
              <div className={styles.controlInfo}>
                <Underline size={15} aria-hidden="true" className={styles.controlIcon} />
                <div>
                  <span className={styles.controlLabel}>Subrayar enlaces</span>
                  <span className={styles.controlDesc}>Hacer los links más visibles</span>
                </div>
              </div>
              <button
                className={`${styles.toggle} ${prefs.underlineLinks ? styles.toggleOn : ''}`}
                onClick={() => update('underlineLinks', !prefs.underlineLinks)}
                role="switch"
                aria-checked={prefs.underlineLinks}
                aria-label={`Subrayar enlaces: ${prefs.underlineLinks ? 'activado' : 'desactivado'}`}
              >
                <span className={styles.toggleThumb} aria-hidden="true" />
                <span className="sr-only">{prefs.underlineLinks ? 'Activado' : 'Desactivado'}</span>
              </button>
            </div>

            {/* 4 — Lector de texto */}
            <div className={styles.control}>
              <div className={styles.controlInfo}>
                {prefs.ttsEnabled ? <Volume2 size={15} aria-hidden="true" className={styles.controlIcon} /> : <VolumeX size={15} aria-hidden="true" className={styles.controlIcon} />}
                <div>
                  <span className={styles.controlLabel}>Lector de texto</span>
                  <span className={styles.controlDesc}>
                    {ttsAvailable ? 'Sintetizador de voz integrado' : 'No disponible en este navegador'}
                  </span>
                </div>
              </div>
              {ttsAvailable && (
                <button
                  className={`${styles.toggle} ${prefs.ttsEnabled ? styles.toggleOn : ''}`}
                  onClick={toggleTts}
                  role="switch"
                  aria-checked={prefs.ttsEnabled}
                  aria-label={`Lector de texto: ${prefs.ttsEnabled ? 'activado' : 'desactivado'}`}
                  disabled={!ttsAvailable}
                >
                  <span className={styles.toggleThumb} aria-hidden="true" />
                  <span className="sr-only">{prefs.ttsEnabled ? 'Activado' : 'Desactivado'}</span>
                </button>
              )}
            </div>

            {/* Acciones de lectura — solo visible si TTS activo */}
            {prefs.ttsEnabled && ttsAvailable && (
              <div className={styles.ttsActions}>
                <button className={styles.ttsBtn} onClick={readSelection} aria-label="Leer texto seleccionado o contenido principal">
                  <Volume2 size={12} aria-hidden="true" />
                  Leer selección
                </button>
                <button className={styles.ttsBtn} onClick={stopReading} aria-label="Detener lectura">
                  <VolumeX size={12} aria-hidden="true" />
                  Detener
                </button>
              </div>
            )}

            {/* Reset */}
            <button className={styles.resetBtn} onClick={reset} aria-label="Restablecer todas las opciones de accesibilidad a sus valores predeterminados">
              <RotateCcw size={12} aria-hidden="true" />
              Restablecer todo
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        ref={triggerRef}
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Cerrar opciones de accesibilidad' : 'Abrir opciones de accesibilidad'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Accessibility size={18} aria-hidden="true" />
        {open
          ? <ChevronDown size={12} aria-hidden="true" />
          : <ChevronUp size={12} aria-hidden="true" />
        }
      </button>
    </div>
  );
}
