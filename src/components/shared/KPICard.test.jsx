import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KPICard from './KPICard';
import { LanguageProvider } from '../../i18n/LanguageContext';

const renderWith = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe('KPICard', () => {
  it('muestra label y value', () => {
    renderWith(<KPICard label="Ingresos" value="1.234 €" />);
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('1.234 €')).toBeInTheDocument();
  });

  it('NO es interactivo si no se pasa onClick', () => {
    renderWith(<KPICard label="X" value="1" />);
    // Sin onClick, no debe haber role="button".
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('es interactivo cuando se pasa onClick (role=button + tabIndex)', () => {
    renderWith(<KPICard label="X" value="1" onClick={() => {}} />);
    const btn = screen.getByRole('button', { name: 'X' });
    expect(btn).toHaveAttribute('tabindex', '0');
  });

  it('llama a onClick al hacer click', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWith(<KPICard label="X" value="1" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'X' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('llama a onClick al pulsar Enter (accesibilidad teclado)', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWith(<KPICard label="X" value="1" onClick={onClick} />);

    const card = screen.getByRole('button', { name: 'X' });
    card.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalled();
  });

  it('llama a onClick al pulsar Space', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWith(<KPICard label="X" value="1" onClick={onClick} />);

    const card = screen.getByRole('button', { name: 'X' });
    card.focus();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalled();
  });

  it('muestra trend con + si es positivo', () => {
    renderWith(<KPICard label="X" value="1" trend={5} />);
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('muestra trend con - si es negativo', () => {
    renderWith(<KPICard label="X" value="1" trend={-3} />);
    expect(screen.getByText('-3%')).toBeInTheDocument();
  });

  it('muestra subtítulo si se pasa', () => {
    renderWith(<KPICard label="X" value="1" sub="vs ayer" />);
    expect(screen.getByText('vs ayer')).toBeInTheDocument();
  });
});
