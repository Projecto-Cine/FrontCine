import { LEGAL_LINKS } from "../constants/footerData";

export default function FooterBottom() {
  return (
    <div className="footer-bottom">
      <nav className="footer-bottom__legal" aria-label="Legal">
        {LEGAL_LINKS.map(({ label, href }) => (
          <a key={label} href={href} className="footer-bottom__legal-link">
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
