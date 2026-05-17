import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KPICard from './KPICard';
import { LanguageProvider } from '../../i18n/LanguageContext';

const renderWith = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe('KPICard', () => {
  it('renders label and value', () => {
    renderWith(<KPICard label="Ingresos" value="1.234 €" />);
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('1.234 €')).toBeInTheDocument();
  });

  it('is NOT interactive when no onClick is provided', () => {
    renderWith(<KPICard label="X" value="1" />);
    // Without onClick there must be no role="button".
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is interactive when onClick is provided (role=button + tabIndex)', () => {
    renderWith(<KPICard label="X" value="1" onClick={() => {}} />);
    const btn = screen.getByRole('button', { name: 'X' });
    expect(btn).toHaveAttribute('tabindex', '0');
  });

  it('calls onClick on click', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWith(<KPICard label="X" value="1" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'X' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Enter key (keyboard accessibility)', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWith(<KPICard label="X" value="1" onClick={onClick} />);

    const card = screen.getByRole('button', { name: 'X' });
    card.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onClick on Space key', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWith(<KPICard label="X" value="1" onClick={onClick} />);

    const card = screen.getByRole('button', { name: 'X' });
    card.focus();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalled();
  });

  it('renders the trend with + when positive', () => {
    renderWith(<KPICard label="X" value="1" trend={5} />);
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('renders the trend with - when negative', () => {
    renderWith(<KPICard label="X" value="1" trend={-3} />);
    expect(screen.getByText('-3%')).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    renderWith(<KPICard label="X" value="1" sub="vs ayer" />);
    expect(screen.getByText('vs ayer')).toBeInTheDocument();
  });
});
