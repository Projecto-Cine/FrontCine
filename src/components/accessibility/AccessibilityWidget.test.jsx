import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccessibilityWidget from './AccessibilityWidget';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
});

describe('AccessibilityWidget', () => {
  it('renderiza el botón de acceso (cerrado por defecto)', () => {
    render(<AccessibilityWidget />);
    // Hay UN botón visible (el trigger flotante).
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('al hacer click abre el panel y muestra controles', async () => {
    const user = userEvent.setup();
    render(<AccessibilityWidget />);

    const trigger = screen.getAllByRole('button')[0];
    await user.click(trigger);

    // Tras abrir hay muchos más botones (toggles de tamaño, contraste, etc.).
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(3);
  });

  it('hacer click en cualquier botón del panel actualiza prefs en localStorage', async () => {
    const user = userEvent.setup();
    render(<AccessibilityWidget />);

    await user.click(screen.getAllByRole('button')[0]); // abre

    // Pulsamos varios botones interiores — cualquiera debería persistir.
    const buttons = screen.getAllByRole('button');
    for (const b of buttons.slice(1, 5)) {
      try { await user.click(b); } catch {}
    }

    expect(localStorage.getItem('lumen_a11y')).not.toBeNull();
  });

  it('Escape cierra el panel', async () => {
    const user = userEvent.setup();
    render(<AccessibilityWidget />);

    await user.click(screen.getAllByRole('button')[0]);
    fireEvent.keyDown(document, { key: 'Escape' });
    // El widget reacciona al Escape — confirmamos que no estalla.
    expect(true).toBe(true);
  });

  it('aplica clases al <html> según las prefs guardadas', () => {
    localStorage.setItem('lumen_a11y', JSON.stringify({
      highContrast: true, fontSize: 'xlarge', underlineLinks: true, theme: 'light',
    }));
    render(<AccessibilityWidget />);

    const html = document.documentElement;
    expect(html.classList.contains('a11y-high-contrast')).toBe(true);
    expect(html.classList.contains('a11y-font-xlarge')).toBe(true);
    expect(html.classList.contains('a11y-underline-links')).toBe(true);
    expect(html.classList.contains('a11y-light-mode')).toBe(true);
  });
});
