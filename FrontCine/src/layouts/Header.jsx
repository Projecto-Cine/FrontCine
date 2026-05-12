import { PanelLeftClose, PanelLeft, Bell, Clock, Keyboard, Search } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ShortcutsModal from '../components/shared/ShortcutsModal';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { useLanguage } from '../i18n/LanguageContext';
import styles from './Header.module.css';

function useLiveClock(fmt) {
  const [time, setTime] = useState(() => fmt.time(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTime(fmt.time(new Date())), 10000);
    return () => clearInterval(id);
  }, [fmt]);
  return time;
}

export default function Header({ onOpenPalette }) {
  const { sidebarCollapsed, toggleSidebar } = useApp();
  const { user } = useAuth();
  const { t, fmt } = useLanguage();
  const location = useLocation();
  const now = useLiveClock(fmt);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        setShowShortcuts(v => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const pageTitle = t(`header.routes.${location.pathname}`) || 'Lumen';
  const expandLabel   = t('header.expandSidebar');
  const collapseLabel = t('header.collapseSidebar');

  return (
    <>
      <header className={styles.header}>
        <div className={styles.left}>
          <button
            className={styles.toggleBtn}
            onClick={toggleSidebar}
            title={sidebarCollapsed ? expandLabel : collapseLabel}
            aria-label={sidebarCollapsed ? expandLabel : collapseLabel}
            aria-expanded={!sidebarCollapsed}
            aria-controls="app-sidebar"
          >
            {sidebarCollapsed
              ? <PanelLeft size={15} aria-hidden="true" />
              : <PanelLeftClose size={15} aria-hidden="true" />}
          </button>
          <div className={styles.pageDivider} aria-hidden="true" />
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        </div>

        <div className={styles.right}>
          {onOpenPalette && (
            <button
              className={styles.searchTrigger}
              onClick={onOpenPalette}
              title={t('header.quickSearchTitle')}
              aria-label={t('header.quickSearchLabel')}
            >
              <Search size={12} aria-hidden="true" />
              <span>{t('header.quickSearch')}</span>
              <kbd className={styles.searchKbd}>Ctrl K</kbd>
            </button>
          )}

          <div className={styles.clock} aria-hidden="true">
            <Clock size={11} />
            <span>{now}</span>
          </div>

          <LanguageSwitcher variant="header" />

          <button
            className={styles.iconBtn}
            onClick={() => setShowShortcuts(true)}
            title={t('header.shortcutsTitle')}
            aria-label={t('header.shortcuts')}
          >
            <Keyboard size={14} aria-hidden="true" />
          </button>

          <button
            className={styles.iconBtn}
            title={t('header.notifications')}
            aria-label={t('header.notifications')}
            aria-haspopup="true"
          >
            <Bell size={14} aria-hidden="true" />
            <span className={styles.notifDot} aria-hidden="true" />
          </button>

          {user && (
            <div className={styles.userChip} aria-label={`${user.name}, ${t(`header.roles.${user.role}`)}`}>
              <div className={styles.avatar} aria-hidden="true">{user.name.charAt(0)}</div>
              <div className={styles.meta}>
                <span className={styles.name}>{user.name.split(' ')[0]}</span>
                <span className={styles.role}>{t(`header.roles.${user.role}`)}</span>
              </div>
            </div>
          )}
        </div>
      </header>
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}
