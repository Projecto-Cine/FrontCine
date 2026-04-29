// src/components/Footer/components/FooterNewsletter.jsx
// ────────────────────────────────────────────────────────
// Columna 4: formulario de suscripción al newsletter

import { useState } from "react";

export default function FooterNewsletter() {
  const [email, setEmail]       = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError]       = useState("");

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubscribe = () => {
    if (!isValidEmail(email)) {
      setError("Ingresá un email válido.");
      return;
    }
    setError("");

    // 👉 Conectá aquí tu servicio de email (Mailchimp, Resend, etc.)
    // Ejemplo: await fetch("/api/subscribe", { method: "POST", body: JSON.stringify({ email }) })
    console.log("Suscripción:", email);

    setSubscribed(true);
    setEmail("");
  };

  return (
    <div>
      <p className="footer__col-title">Newsletter</p>

      <p className="footer-newsletter__desc">
        Recibí los estrenos y promociones exclusivas en tu email.
      </p>

      {subscribed ? (
        <p className="footer-newsletter__success">
          ¡Gracias! Ya estás suscrito.
        </p>
      ) : (
        <>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
            className="footer-newsletter__input"
          />
          {error && (
            <p style={{ fontSize: "12px", color: "#e8643a", margin: "-6px 0 8px" }}>
              {error}
            </p>
          )}
          <button className="footer-newsletter__btn" onClick={handleSubscribe}>
            Suscribirme
          </button>
        </>
      )}
    </div>
  );
}
