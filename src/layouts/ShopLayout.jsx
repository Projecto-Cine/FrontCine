import { Outlet } from 'react-router-dom';
import { Film, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './ShopLayout.module.css';

const SHOP_USER_KEY = 'lumen_shop_user';

export default function ShopLayout() {
  const [shopUser, setShopUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SHOP_USER_KEY) ?? 'null'); } catch { return null; }
  });

  useEffect(() => {
    const sync = () => {
      try { setShopUser(JSON.parse(localStorage.getItem(SHOP_USER_KEY) ?? 'null')); } catch { setShopUser(null); }
    };
    window.addEventListener('shop:auth', sync);
    return () => window.removeEventListener('shop:auth', sync);
  }, []);

  const logout = () => {
    localStorage.removeItem(SHOP_USER_KEY);
    localStorage.removeItem('lumen_shop_token');
    setShopUser(null);
    window.dispatchEvent(new CustomEvent('shop:auth'));
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Film size={20} aria-hidden="true" />
          <span>Lumen Cinema</span>
        </div>
        <div className={styles.headerRight}>
          {shopUser ? (
            <div className={styles.userChip}>
              <User size={14} aria-hidden="true" />
              <span>{shopUser.name?.split(' ')[0] ?? 'Socio'}</span>
              <button className={styles.logoutBtn} onClick={logout} aria-label="Cerrar sesión">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <span className={styles.guestHint}>Regístrate para descuentos de socio</span>
          )}
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
