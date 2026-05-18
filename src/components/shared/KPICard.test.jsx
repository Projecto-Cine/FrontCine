import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

  it('renders value', () => {
    render(<KPICard label="Ingresos" value="100" />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('is not interactive when no onClick is provided', () => {
    render(<KPICard label="X" value="1" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is interactive when onClick is provided', () => {
    render(<KPICard label="X" value="1" onClick={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('tabindex', '0');
  });

  it('renders the subtitle when provided', () => {
    render(<KPICard label="X" value="1" sub="vs ayer" />);
    expect(screen.getByText('vs ayer')).toBeInTheDocument();
  });
});