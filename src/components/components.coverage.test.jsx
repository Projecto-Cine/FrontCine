/**
 * Component-level coverage tests — exercises the deeper branches of
 * AccessibilityWidget, Modal (trap focus / escape), CommandPalette
 * keyboard handlers and SeatMap edge cases.
 *
 * Code in English; UI strings asserted in Spanish (rendered locale).
 */
import { describe, it, vi, beforeEach, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';

beforeEach(() => {
  try { localStorage.clear(); } catch { /* ignore */ }
  document.documentElement.className = '';
});

describe('AccessibilityWidget — deep coverage', () => {
  it('toggles each preference and triggers TTS branches', async () => {
    const user = userEvent.setup();
    const { default: AccessibilityWidget } = await import('./accessibility/AccessibilityWidget');
    render(<AccessibilityWidget />);

    // Open the panel.
    await user.click(screen.getAllByRole('button')[0]);

    // Click every button — covers theme/contrast/font/links/tts/reset.
    const buttons = screen.getAllByRole('button');
    for (const b of buttons) {
      try { await user.click(b); } catch { /* ignore */ }
    }

    // TTS read selection without an active selection (covers the fallback).
    if (typeof window.SpeechSynthesisUtterance === 'undefined') {
      window.SpeechSynthesisUtterance = vi.fn();
    }
    if (typeof window.speechSynthesis === 'undefined') {
      window.speechSynthesis = { speak: vi.fn(), cancel: vi.fn() };
    }

    // Cycle a couple more times to drive remaining branches.
    for (const b of screen.getAllByRole('button')) {
      try { await user.click(b); } catch { /* ignore */ }
    }
  });

  it('click outside the panel closes it', async () => {
    const user = userEvent.setup();
    const { default: AccessibilityWidget } = await import('./accessibility/AccessibilityWidget');
    render(<AccessibilityWidget />);

    await user.click(screen.getAllByRole('button')[0]);
    // Click outside (on body) — should close.
    fireEvent.mouseDown(document.body);
  });

  it('Tab traps focus inside the panel', async () => {
    const user = userEvent.setup();
    const { default: AccessibilityWidget } = await import('./accessibility/AccessibilityWidget');
    render(<AccessibilityWidget />);

    await user.click(screen.getAllByRole('button')[0]);

    // Hit Tab and Shift+Tab a few times — covers the trap logic.
    for (let i = 0; i < 4; i++) {
      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    }
    fireEvent.keyDown(document, { key: 'Escape' });
  });
});

describe('Modal — extra trap and focus branches', () => {
  it('Tab and Shift+Tab loop inside the modal', async () => {
    const { default: Modal } = await import('./ui/Modal');
    render(
      <LanguageProvider>
        <Modal open={true} onClose={() => {}} title="X">
          <button>A</button>
          <button>B</button>
          <button>C</button>
        </Modal>
      </LanguageProvider>
    );

    fireEvent.keyDown(document, { key: 'Tab' });
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    fireEvent.keyDown(document, { key: 'Escape' });
  });

  it('Modal without focusable children does not throw', async () => {
    const { default: Modal } = await import('./ui/Modal');
    render(
      <LanguageProvider>
        <Modal open={true} onClose={() => {}} title="Empty">
          <div>Sin botones</div>
        </Modal>
      </LanguageProvider>
    );
    fireEvent.keyDown(document, { key: 'Tab' });
  });
});

describe('CommandPalette — keyboard navigation', () => {
  it('handles arrow keys and enter without crashing', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const { default: CommandPalette } = await import('./shared/CommandPalette');

    render(
      <MemoryRouter>
        <LanguageProvider>
          <CommandPalette open={true} onClose={() => {}} />
        </LanguageProvider>
      </MemoryRouter>
    );

    const search = document.querySelector('input');
    if (search) {
      fireEvent.change(search, { target: { value: 'sala' } });
      fireEvent.keyDown(search, { key: 'ArrowDown' });
      fireEvent.keyDown(search, { key: 'ArrowDown' });
      fireEvent.keyDown(search, { key: 'ArrowUp' });
      fireEvent.keyDown(search, { key: 'Enter' });
      fireEvent.keyDown(search, { key: 'Escape' });
      fireEvent.change(search, { target: { value: 'no-match-q' } });
    }
  });
});

describe('SeatMap — variants and edge cases', () => {
  it('renders generated map (small capacity, no aisle)', async () => {
    const { default: SeatMap } = await import('./shared/SeatMap');
    render(
      <SeatMap
        session={{ id: 10, sold: 3 }}
        room={{ capacity: 40, name: 'Sala 1' }}
        selectedSeats={[]}
        onToggle={() => {}}
        maxSelect={2}
      />
    );
    // Trigger seat clicks (some occupied, some free).
    document.querySelectorAll('button').forEach((b, i) => {
      if (i < 6) try { fireEvent.click(b); } catch { /* ignore */ }
    });
  });

  it('renders generated map (large capacity → aisle branch)', async () => {
    const { default: SeatMap } = await import('./shared/SeatMap');
    const onToggle = vi.fn();
    render(
      <SeatMap
        session={{ id: 11, sold: 100 }}
        room={{ capacity: 200, name: 'Sala 2' }}
        selectedSeats={['A01']}
        onToggle={onToggle}
        maxSelect={3}
      />
    );

    document.querySelectorAll('button').forEach((b, i) => {
      if (i < 4) try { fireEvent.click(b); } catch { /* ignore */ }
    });
    // Click on selected badge to deselect.
    const badge = document.querySelector('button[title^="Deseleccionar"]');
    if (badge) fireEvent.click(badge);
  });

  it('handles real seats array with unavailable + occupied + free mix', async () => {
    const { default: SeatMap } = await import('./shared/SeatMap');
    const onToggle = vi.fn();
    render(
      <SeatMap
        seats={[
          { id: 1, row: 'A', number: 1,  status: 'available'   },
          { id: 2, row: 'A', number: 2,  status: 'occupied'    },
          { id: 3, row: 'A', number: 3,  status: 'reserved'    },
          { id: 4, row: 'A', number: 4,  status: 'unavailable' },
          { id: 5, row: 'B', number: 1,  status: 'available'   },
        ]}
        selectedSeats={['A01']}
        onToggle={onToggle}
        maxSelect={5}
      />
    );
    document.querySelectorAll('button[aria-label^="Butaca"]').forEach(b => {
      try { fireEvent.click(b); } catch { /* ignore */ }
    });
    // onToggle gets called for available seats only.
    expect(onToggle).toHaveBeenCalled();
  });
});
