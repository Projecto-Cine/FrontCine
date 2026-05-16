import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

// describe = agrupa tests relacionados (suele coincidir con un componente)
describe('Badge', () => {
  // it / test = un caso concreto. La frase debe leerse como una afirmación.
  it('muestra el texto que recibe como children', () => {
    render(<Badge>Nuevo</Badge>);

    // screen.getByText busca un nodo que contenga ese texto.
    // Si no lo encuentra, el test falla con un error claro.
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
  });

  it('NO muestra el "dot" por defecto', () => {
    // Patrón "container": útil para asserts sobre clases o estructura
    // cuando no hay texto visible que buscar.
    const { container } = render(<Badge>Hola</Badge>);

    // El dot es un <span> con la clase styles.dot. Comprobamos que no exista.
    expect(container.querySelector('span > span')).toBeNull();
  });

  it('muestra el "dot" cuando dot={true}', () => {
    const { container } = render(<Badge dot>Hola</Badge>);

    // Ahora sí debe existir el span interno (el puntito).
    expect(container.querySelector('span > span')).not.toBeNull();
  });
});
