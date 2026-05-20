import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommandPalette from './CommandPalette';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function renderPalette(props = {}) {
  const onClose = vi.fn();
  const view = render(
    <MemoryRouter>
      <CommandPalette open onClose={onClose} {...props} />
    </MemoryRouter>
  );
  return { ...view, onClose };
}

describe('CommandPalette', () => {
  it('keeps the modal open when the panel is clicked, then closes on overlay click', () => {
    const { container, onClose } = renderPalette();

    fireEvent.click(screen.getByRole('dialog').firstElementChild);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(container.firstChild);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('filters results, moves the cursor on hover, and navigates on click', () => {
    const { onClose } = renderPalette();

    fireEvent.change(screen.getByRole('textbox', { name: /buscar sección/i }), {
      target: { value: 'clientes' },
    });

    const option = screen.getByRole('option', { name: /clientes/i });
    fireEvent.mouseEnter(option);
    expect(option).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(option);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes with Escape and shows the no-results state', () => {
    const { onClose } = renderPalette();

    fireEvent.change(screen.getByRole('textbox', { name: /buscar sección/i }), {
      target: { value: 'zzzz' },
    });
    expect(screen.getByText(/sin resultados/i)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
