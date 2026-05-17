import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal, { ConfirmModal } from './Modal';
import { LanguageProvider } from '../../i18n/LanguageContext';

const renderWith = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe('Modal', () => {
  it('does NOT render anything when open=false', () => {
    const { container } = renderWith(
      <Modal open={false} onClose={() => {}} title="X">contenido</Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the title and children when open=true', () => {
    renderWith(
      <Modal open onClose={() => {}} title="Mi diálogo">
        <p>Contenido</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Mi diálogo')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('calls onClose when the X button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWith(<Modal open onClose={onClose} title="X">body</Modal>);

    // The close button uses an i18n aria-label; just click the first button.
    const closeBtn = screen.getAllByRole('button')[0];
    await user.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWith(<Modal open onClose={onClose} title="X">body</Modal>);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking outside the modal (overlay)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = renderWith(<Modal open onClose={onClose} title="X">body</Modal>);

    // The overlay is the first child div. Click it (not the modal itself).
    const overlay = container.firstChild;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders the footer when provided', () => {
    renderWith(
      <Modal open onClose={() => {}} title="X" footer={<button>OK</button>}>
        body
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
  });
});

describe('ConfirmModal', () => {
  it('confirming invokes both onConfirm AND onClose', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWith(
      <ConfirmModal open onClose={onClose} onConfirm={onConfirm}
        title="¿Borrar?" message="Esta acción es definitiva" confirmLabel="Sí" />
    );

    await user.click(screen.getByRole('button', { name: 'Sí' }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the message', () => {
    renderWith(
      <ConfirmModal open onClose={() => {}} onConfirm={() => {}}
        title="X" message="¿Estás seguro?" />
    );
    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
  });
});
