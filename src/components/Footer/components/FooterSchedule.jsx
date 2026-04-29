// src/components/Footer/components/FooterSchedule.jsx
// ─────────────────────────────────────────────────────
// Columna 3: horarios de atención + tarjeta de teléfono

import { SCHEDULE, CONTACT } from "../constants/footerData";

export default function FooterSchedule() {
  return (
    <div>
      <p className="footer__col-title">Horarios de Atención</p>

      {/* Horarios */}
      {SCHEDULE.map(({ days, hours }) => (
        <div key={days} className="footer-schedule__row">
          <div className="footer-schedule__day">{days}</div>
          <div className="footer-schedule__hours">{hours}</div>
        </div>
      ))}

      {/* Tarjeta de teléfono */}
      <div className="footer-schedule__phone-card">
        <div className="footer-schedule__phone-label">{CONTACT.phoneLabel}</div>
        <div className="footer-schedule__phone-num">{CONTACT.phone}</div>
      </div>
    </div>
  );
}
