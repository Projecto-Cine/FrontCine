import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShortcutsModal from './ShortcutsModal';

describe('ShortcutsModal', () => {
  it('does NOT render anything when open=false', () => {
    const { container } = render(<ShortcutsModal open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the panel with role=dialog when open=true', () => {
    render(<ShortcutsModal open onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: /Atajos/i })).toBeInTheDocument();
  });

  it('calls onClose when the X button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ShortcutsModal open onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /Cerrar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal open onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows several known shortcuts (sanity check)', () => {
    render(<ShortcutsModal open onClose={() => {}} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Abrir paleta de comandos/i)).toBeInTheDocument();
  });
});
