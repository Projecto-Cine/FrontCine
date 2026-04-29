import { BRAND } from "../constants/footerData";

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="3" stroke="#c9a84c" strokeWidth="1.5" />
    <line x1="7" y1="2" x2="7" y2="22" stroke="#c9a84c" strokeWidth="1.5" />
    <line x1="17" y1="2" x2="17" y2="22" stroke="#c9a84c" strokeWidth="1.5" />
    <line x1="2" y1="7" x2="7" y2="7" stroke="#c9a84c" strokeWidth="1.5" />
    <line x1="17" y1="7" x2="22" y2="7" stroke="#c9a84c" strokeWidth="1.5" />
    <line x1="2" y1="17" x2="7" y2="17" stroke="#c9a84c" strokeWidth="1.5" />
    <line x1="17" y1="17" x2="22" y2="17" stroke="#c9a84c" strokeWidth="1.5" />
  </svg>
);

export default function FooterBrand() {
  return (
    <div>
      <div className="footer-brand__logo-wrap">
        <div className="footer-brand__logo-icon">
          <LogoIcon />
        </div>
        <span className="footer-brand__name">{BRAND.name}</span>
      </div>

      <p className="footer-brand__tagline">{BRAND.tagline}</p>
    </div>
  );
}