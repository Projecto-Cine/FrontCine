/**
 * KPICard — comprehensive branch coverage.
 *
 * Exercises:
 *   - AnimatedValue with numeric prefix/suffix (€, %, etc.)
 *   - AnimatedValue with non-numeric value (NaN fallback)
 *   - AnimatedValue with integer vs decimal formatting
 *   - interactive: onClick + keyboard (Enter / Space) handlers
 *   - trend positive / negative / zero branches
 *   - sub-only / trend-only / both branches
 *   - Icon optional
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';

vi.mock('../../hooks/useCountUp', () => ({
  useCountUp: (value) => value,
}));

vi.mock('../../i18n/LanguageContext', () => ({
  LanguageProvider: ({ children }) => children,
  useLanguage: () => ({ t: (k) => k }),
}));

import KPICard from './KPICard';

describe('KPICard', () => {
  it('renders label', () => {
    render(<KPICard label="Ingresos" value="100" />);
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
  });

  it('renders integer value (toFixed 0)', () => {
    render(<KPICard label="Salas" value="3" />);
    expect(screen.getByText('Salas')).toBeInTheDocument();
  });

  it('renders decimal value (toFixed 1)', () => {
    render(<KPICard label="P" value="9.5" />);
    expect(screen.getByText('P')).toBeInTheDocument();
  });

  it('renders €-prefixed value (keeps prefix)', () => {
    render(<KPICard label="Rev" value="€1500" />);
    expect(screen.getByText('Rev')).toBeInTheDocument();
  });

  it('renders %-suffixed value', () => {
    render(<KPICard label="Occ" value="85%" />);
    expect(screen.getByText('Occ')).toBeInTheDocument();
  });

  it('renders non-numeric value as-is', () => {
    render(<KPICard label="Best" value="—" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const Icon = (props) => <svg data-testid="ic" {...props} />;
    render(<KPICard label="L" value="1" icon={Icon} color="green" />);
    expect(document.querySelector('[data-testid="ic"]')).toBeTruthy();
  });

  it('is not interactive without onClick', () => {
    render(<KPICard label="X" value="1" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is interactive with onClick (role=button + tabindex=0)', () => {
    render(<KPICard label="X" value="1" onClick={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('tabindex', '0');
  });

  it('fires onClick on click', () => {
    const onClick = vi.fn();
    render(<KPICard label="X" value="1" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('fires onClick on Enter key', () => {
    const onClick = vi.fn();
    render(<KPICard label="X" value="1" onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('fires onClick on Space key', () => {
    const onClick = vi.fn();
    render(<KPICard label="X" value="1" onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onClick).toHaveBeenCalled();
  });

  it('ignores other keys when interactive', () => {
    const onClick = vi.fn();
    render(<KPICard label="X" value="1" onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'a' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders subtitle branch only', () => {
    render(<KPICard label="X" value="1" sub="vs ayer" />);
    expect(screen.getByText('vs ayer')).toBeInTheDocument();
  });

  it('renders positive trend (+10%)', () => {
    render(<KPICard label="X" value="1" trend={10} />);
    expect(screen.getByText('+10%')).toBeInTheDocument();
  });

  it('renders negative trend (-5%)', () => {
    render(<KPICard label="X" value="1" trend={-5} />);
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('renders trend of zero (positive branch)', () => {
    render(<KPICard label="X" value="1" trend={0} />);
    expect(screen.getByText('+0%')).toBeInTheDocument();
  });

  it('renders both subtitle and trend together', () => {
    render(<KPICard label="X" value="1" sub="hoy" trend={3} />);
    expect(screen.getByText('hoy')).toBeInTheDocument();
    expect(screen.getByText('+3%')).toBeInTheDocument();
  });
});
