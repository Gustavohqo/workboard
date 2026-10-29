import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Counter } from './counter';

describe('Counter', () => {
  it('starts at zero', () => {
    render(<Counter />);

    expect(screen.getByRole('button')).toHaveTextContent('Cliques: 0');
  });

  it('increments on click', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('Cliques: 1');
  });
});
