import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('renders the text passed as children', () => {
    render(<Button>Guardar</Button>);

    // getByRole('button', { name: '...' }) is the RECOMMENDED query:
    // it validates accessibility (a button with an accessible name)
    // and finds the element at the same time.
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('calls onClick when the user clicks', async () => {
    // vi.fn() creates a "spy": a fake function that records its calls.
    const onClick = vi.fn();
    // userEvent simulates real user interactions (preferred over fireEvent).
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole('button', { name: 'Click me' }));

    // Verify the callback was called exactly once.
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClick when disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button disabled onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole('button', { name: 'Click me' }));

    // A disabled button must not dispatch events.
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled when loading={true}', () => {
    // Prevents the classic double-submit bug on forms.
    render(<Button loading>Enviando…</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
