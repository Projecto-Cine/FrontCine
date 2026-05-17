import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renders the title as an h1 (correct hierarchy)', () => {
    render(<PageHeader title="Películas" />);
    // getByRole('heading', { level: 1 }) verifies it is an <h1>.
    expect(screen.getByRole('heading', { level: 1, name: 'Películas' })).toBeInTheDocument();
  });

  it('does NOT render the subtitle when omitted', () => {
    render(<PageHeader title="X" />);
    expect(screen.queryByText('Subtítulo')).toBeNull();
  });

  it('renders the subtitle when provided', () => {
    render(<PageHeader title="X" subtitle="Subtítulo" />);
    expect(screen.getByText('Subtítulo')).toBeInTheDocument();
  });

  it('renders the actions slot (arbitrary children)', () => {
    render(<PageHeader title="X" actions={<button>Crear</button>} />);
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });

  it('renders the breadcrumb slot', () => {
    render(<PageHeader title="X" breadcrumb={<span>Inicio › X</span>} />);
    expect(screen.getByText('Inicio › X')).toBeInTheDocument();
  });
});
