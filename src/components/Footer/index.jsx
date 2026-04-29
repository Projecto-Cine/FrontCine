import "./styles/Footer.css";

import FooterBrand from "./components/FooterBrand";
import FooterNav from "./components/FooterNav";
import FooterBottom from "./components/FooterBottom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="footer__block footer__block--brand">
          <FooterBrand />
        </div>
        <div className="footer__block footer__block--nav">
          <FooterNav />
          <p className="footer__copy-inline">© 2026 Lumen Cinema. Todos los derechos reservados.</p>
        </div>
        <div className="footer__block footer__block--legal">
          <FooterBottom />
        </div>
      </div>
    </footer>
  );
}
