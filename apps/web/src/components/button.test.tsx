import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders its label as a button', () => {
    render(<Button>Criar tarefa</Button>);

    expect(screen.getByRole('button', { name: 'Criar tarefa' })).toBeInTheDocument();
  });

  it('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salvar</Button>);

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Desfazer
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Desfazer' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('is not a submit button by default, so it does not submit forms', () => {
    render(
      <form>
        <Button>Mover</Button>
      </form>,
    );

    expect(screen.getByRole('button', { name: 'Mover' })).toHaveAttribute('type', 'button');
  });
});
