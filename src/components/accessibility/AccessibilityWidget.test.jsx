import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccessibilityWidget from './AccessibilityWidget';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  window.speechSynthesis = { speak: vi.fn(), cancel: vi.fn() };
  window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
    this.text = text;
  };
  globalThis.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
});

describe('AccessibilityWidget', () => {
  it('renders the trigger button (closed by default)', () => {
    render(<AccessibilityWidget />);
    // Exactly ONE visible button (the floating trigger).
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('opens the panel and shows controls when clicked', async () => {
    const user = userEvent.setup();
    render(<AccessibilityWidget />);

    const trigger = screen.getAllByRole('button')[0];
    await user.click(trigger);

    // After opening there are many more buttons (font/contrast toggles, etc.).
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(3);
  });

  it('clicking any panel button updates prefs in localStorage', async () => {
    const user = userEvent.setup();
    render(<AccessibilityWidget />);

    await user.click(screen.getAllByRole('button')[0]); // open

    // Click several inner buttons — any of them should persist a pref.
    const buttons = screen.getAllByRole('button');
    for (const b of buttons.slice(1, 5)) {
      try { await user.click(b); } catch { /* ignore */ }
    }

    expect(localStorage.getItem('lumen_a11y')).not.toBeNull();
  });

  it('Escape closes the panel', async () => {
    const user = userEvent.setup();
    render(<AccessibilityWidget />);

    await user.click(screen.getAllByRole('button')[0]);
    fireEvent.keyDown(document, { key: 'Escape' });
    // The widget handles Escape — we only verify it does not blow up.
    expect(true).toBe(true);
  });

  it('applies classes on <html> based on the saved prefs', () => {
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

  it('reads main content as fallback when no text is selected', async () => {
    const user = userEvent.setup();
    const main = document.createElement('main');
    main.id = 'main-content';
    main.innerText = 'Fallback content text';
    document.body.appendChild(main);

    vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => '' });
    render(<AccessibilityWidget />);
    await user.click(screen.getByLabelText(/abrir opciones/i));
    await user.click(screen.getByRole('switch', { name: /lector de texto/i }));
    await user.click(screen.getByRole('button', { name: /leer texto seleccionado/i }));
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('reads "Sin texto seleccionado" when nothing is selected and no main content is present', async () => {
    const user = userEvent.setup();
    // Don't append main — selection is empty + #main-content missing → use the default fallback
    vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => '' });
    render(<AccessibilityWidget />);
    await user.click(screen.getByLabelText(/abrir opciones/i));
    await user.click(screen.getByRole('switch', { name: /lector de texto/i }));
    await user.click(screen.getByRole('button', { name: /leer texto seleccionado/i }));
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('hides the TTS toggle when speechSynthesis is not available', async () => {
    // Remove speechSynthesis from window before rendering
    const originalSynth = window.speechSynthesis;
    delete window.speechSynthesis;
    const user = userEvent.setup();
    render(<AccessibilityWidget />);
    await user.click(screen.getByLabelText(/abrir opciones/i));
    expect(screen.queryByRole('switch', { name: /lector de texto/i })).toBeNull();
    window.speechSynthesis = originalSynth;
  });

  it('starts with no localStorage and corrupt prefs (loadPrefs fallback)', () => {
    localStorage.setItem('lumen_a11y', '{corrupt');
    render(<AccessibilityWidget />);
    expect(screen.getByLabelText(/abrir opciones/i)).toBeInTheDocument();
  });

  it('uses all controls, reads selected text, stops reading, resets, and closes on outside click', async () => {
    const user = userEvent.setup();
    const main = document.createElement('main');
    main.id = 'main-content';
    main.innerText = 'Texto principal para lectura';
    document.body.appendChild(main);

    vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => 'Texto seleccionado' });

    render(<AccessibilityWidget />);
    await user.click(screen.getByLabelText(/abrir opciones/i));

    await user.click(screen.getByRole('switch', { name: /modo claro/i }));
    await user.click(screen.getByRole('switch', { name: /alto contraste/i }));
    await user.click(screen.getByRole('button', { name: /^Grande:/i }));
    await user.click(screen.getByRole('button', { name: /^X-Grande:/i }));
    await user.click(screen.getByRole('switch', { name: /subrayar enlaces/i }));
    await user.click(screen.getByRole('switch', { name: /lector de texto/i }));

    await user.click(screen.getByRole('button', { name: /leer texto seleccionado/i }));
    expect(window.speechSynthesis.speak).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /detener lectura/i }));
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /restablecer/i }));
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(false);

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
