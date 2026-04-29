// src/components/Footer/components/FooterNav.jsx
// ─────────────────────────────────────────────────
// Columna 2: lista de links de navegación

import { NAV_LINKS } from "../constants/footerData";

// 👉 Si usás React Router, reemplazá <a href> por <Link to={href}>
// import { Link } from "react-router-dom";

export default function FooterNav() {
  return (
    <div>
      <p className="footer__col-title">Navegación</p>

      <ul className="footer-nav__list">
        {NAV_LINKS.map(({ label, href }) => (
          <li key={label}>
            <a href={href} className="footer-nav__link">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
