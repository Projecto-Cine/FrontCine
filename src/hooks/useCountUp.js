import { useState, useEffect, useRef } from 'react';

export function useCountUp(target, duration = 900) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const numeric = parseFloat(String(target).replace(/[^0-9.-]/g, ''));
    if (isNaN(numeric)) { setDisplay(target); return; }

    cancelAnimationFrame(raf.current);
    startRef.current = null;

    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(eased * numeric * 100) / 100);
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}
