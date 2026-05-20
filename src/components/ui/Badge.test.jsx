import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

// describe = groups related tests (usually one per component).
describe('Badge', () => {
  // it / test = a single concrete case. Read it as an assertion.
  it('shows the text passed as children', () => {
    render(<Badge>Nuevo</Badge>);

    // screen.getByText looks for a node containing the given text.
    // If it is not found, the test fails with a clear message.
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
  });

  it('does NOT show the "dot" by default', () => {
    // "container" pattern: useful for asserting on class/structure
    // when there is no visible text to look up.
    const { container } = render(<Badge>Hola</Badge>);

    // The dot is a nested <span>. Confirm it is not present.
    expect(container.querySelector('span > span')).toBeNull();
  });

  it('shows the "dot" when dot={true}', () => {
    const { container } = render(<Badge dot>Hola</Badge>);

    // Now the inner span (the dot) must be there.
    expect(container.querySelector('span > span')).not.toBeNull();
  });
});
