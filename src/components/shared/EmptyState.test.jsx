import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('muestra el title y el subtitle cuando se pasan', () => {
    render(<EmptyState title="Sin resultados" subtitle="Prueba a cambiar el filtro" />);

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.getByText('Prueba a cambiar el filtro')).toBeInTheDocument();
  });

  it('NO renderiza title ni subtitle si no se pasan', () => {
    // Cubrimos la otra rama del renderizado condicional ({title && ...}).
    render(<EmptyState />);

    // queryByText devuelve null en vez de lanzar error si no encuentra nada.
    // Úsalo SIEMPRE que quieras afirmar que algo NO existe.
    expect(screen.queryByText('Sin resultados')).toBeNull();
  });
});
