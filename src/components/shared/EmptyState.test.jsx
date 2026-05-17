import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders the title and subtitle when provided', () => {
    render(<EmptyState title="Sin resultados" subtitle="Prueba a cambiar el filtro" />);

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.getByText('Prueba a cambiar el filtro')).toBeInTheDocument();
  });

  it('does NOT render title or subtitle when omitted', () => {
    // Covers the other branch of the conditional render ({title && ...}).
    render(<EmptyState />);

    // queryByText returns null instead of throwing when not found.
    // Always use it when asserting that something is NOT in the DOM.
    expect(screen.queryByText('Sin resultados')).toBeNull();
  });
});
