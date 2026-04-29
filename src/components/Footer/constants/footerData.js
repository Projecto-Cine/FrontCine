// src/components/Footer/constants/footerData.js
// ─────────────────────────────────────────────
// Todos los datos del footer en un solo lugar.
// Si cambia un texto, link o horario → editás solo aquí.

export const NAV_LINKS = [
  { label: "Cartelera",         href: "/cartelera" },
  { label: "Próximos Estrenos", href: "/estrenos" },
  { label: "Salas & Formatos",  href: "/salas" },
  { label: "Promociones",       href: "/promociones" },
  { label: "Tarjeta Lumen",     href: "/tarjeta" },
  { label: "Corporativo",       href: "/corporativo" },
];

export const SCHEDULE = [
  { days: "Lun – Jue",      hours: "11:00 – 23:30" },
  { days: "Vie – Sáb",      hours: "10:00 – 01:00" },
  { days: "Dom y Feriados", hours: "10:00 – 23:00" },
];

export const SOCIAL_LINKS = [
  { label: "Facebook",  href: "https://facebook.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Twitter",   href: "https://twitter.com" },
  { label: "YouTube",   href: "https://youtube.com" },
];

export const LEGAL_LINKS = [
  { label: "Términos y Condiciones", href: "/terminos" },
  { label: "Política de Privacidad", href: "/privacidad" },
  { label: "Cookies",                href: "/cookies" },
];

export const CONTACT = {
  phone: "0800-LUMEN-247",
  phoneLabel: "Atención al cliente",
};

export const BRAND = {
  name: "Lumen Cinema",
  tagline: "La mejor experiencia cinematográfica de la ciudad. Vive el cine como nunca antes.",
  year: new Date().getFullYear(),
};
