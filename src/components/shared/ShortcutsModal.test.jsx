import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShortcutsModal from './ShortcutsModal';

describe('ShortcutsModal', () => {
  it('NO renderiza nada si open=false', () => {
    const { container } = render(<ShortcutsModal open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza el panel con role=dialog cuando open=true', () => {
    render(<ShortcutsModal open onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: /Atajos/i })).toBeInTheDocument();
  });

  it('llama a onClose al hacer click en el botón X', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ShortcutsModal open onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /Cerrar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('llama a onClose al pulsar Escape', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal open onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('muestra varios atajos conocidos (sanity check)', () => {
    render(<ShortcutsModal open onClose={() => {}} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Abrir paleta de comandos/i)).toBeInTheDocument();
  });
});
