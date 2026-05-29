import { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Film, User, LogOut, Star } from 'lucide-react';
import { useShopAuth } from '../contexts/ShopAuthContext';
import styles from './ShopLayout.module.css';

export default function ShopLayout() {
  const { shopUser, logout } = useShopAuth();

  // La intranet bloquea el scroll del body — la shop necesita scroll libre
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.body.style.height   = 'auto';
    document.documentElement.style.height = 'auto';
    return () => {
      document.body.style.overflow = '';
      document.body.style.height   = '';
      document.documentElement.style.height = '';
    };
  }, []);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/shop" className={styles.logo}>
          <Film size={20} aria-hidden="true" />
          <span>Lumen Cinema</span>
        </Link>
        <div className={styles.headerRight}>
          {shopUser ? (
            <div className={styles.userChip}>
              {shopUser.isFidelityMember && <Star size={12} className={styles.starIcon} aria-hidden="true" />}
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
