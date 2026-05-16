import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal, { ConfirmModal } from './Modal';
import { LanguageProvider } from '../../i18n/LanguageContext';

const renderWith = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe('Modal', () => {
  it('NO renderiza nada si open=false', () => {
    const { container } = renderWith(
      <Modal open={false} onClose={() => {}} title="X">contenido</Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza title y children cuando open=true', () => {
    renderWith(
      <Modal open onClose={() => {}} title="Mi diálogo">
        <p>Contenido</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Mi diálogo')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('llama a onClose al pulsar el botón X', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWith(<Modal open onClose={onClose} title="X">body</Modal>);

    // El botón de cerrar tiene aria-label desde i18n; usamos el primero que no sea otro.
    const closeBtn = screen.getAllByRole('button')[0];
    await user.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('llama a onClose al pulsar Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWith(<Modal open onClose={onClose} title="X">body</Modal>);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('llama a onClose al hacer click fuera del modal (overlay)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = renderWith(<Modal open onClose={onClose} title="X">body</Modal>);

    // El overlay es el primer div hijo. Click sobre él (no sobre el modal).
    const overlay = container.firstChild;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('renderiza el footer si se pasa', () => {
    renderWith(
      <Modal open onClose={() => {}} title="X" footer={<button>OK</button>}>
        body
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
  });
});

describe('ConfirmModal', () => {
  it('al confirmar llama a onConfirm Y a onClose', async () => {
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

  it('muestra el mensaje', () => {
    renderWith(
      <ConfirmModal open onClose={() => {}} onConfirm={() => {}}
        title="X" message="¿Estás seguro?" />
    );
    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
  });
});
