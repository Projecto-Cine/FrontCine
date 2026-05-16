import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renderiza el title como un h1 (jerarquía correcta)', () => {
    render(<PageHeader title="Películas" />);
    // getByRole('heading', { level: 1 }) verifica que sea <h1>.
    expect(screen.getByRole('heading', { level: 1, name: 'Películas' })).toBeInTheDocument();
  });

  it('NO renderiza subtitle si no se pasa', () => {
    render(<PageHeader title="X" />);
    expect(screen.queryByText('Subtítulo')).toBeNull();
  });

  it('renderiza subtitle cuando se pasa', () => {
    render(<PageHeader title="X" subtitle="Subtítulo" />);
    expect(screen.getByText('Subtítulo')).toBeInTheDocument();
  });

  it('renderiza el slot de actions (children arbitrarios)', () => {
    render(<PageHeader title="X" actions={<button>Crear</button>} />);
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });

  it('renderiza el slot de breadcrumb', () => {
    render(<PageHeader title="X" breadcrumb={<span>Inicio › X</span>} />);
    expect(screen.getByText('Inicio › X')).toBeInTheDocument();
  });
});
