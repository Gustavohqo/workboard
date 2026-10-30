import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NewTask } from './new-task';

describe('NewTask', () => {
  it('starts as a single button and no input', () => {
    render(<NewTask onCreate={vi.fn()} />);

    expect(screen.getByRole('button', { name: '+ Nova tarefa' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('opens the title input focused, with create disabled', async () => {
    const user = userEvent.setup();
    render(<NewTask onCreate={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '+ Nova tarefa' }));

    expect(screen.getByRole('textbox', { name: 'Título da tarefa' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Criar tarefa' })).toBeDisabled();
  });

  it('enables create as soon as a character is typed', async () => {
    const user = userEvent.setup();
    render(<NewTask onCreate={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '+ Nova tarefa' }));

    await user.type(screen.getByRole('textbox', { name: 'Título da tarefa' }), 'a');

    expect(screen.getByRole('button', { name: 'Criar tarefa' })).toBeEnabled();
  });

  it('explains that Enter creates the task', async () => {
    const user = userEvent.setup();
    render(<NewTask onCreate={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '+ Nova tarefa' }));

    expect(screen.getByRole('textbox', { name: 'Título da tarefa' })).toHaveAccessibleDescription(
      'Enter para criar.',
    );
  });

  it('creates on Enter and returns to the button', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(true);
    render(<NewTask onCreate={onCreate} />);
    await user.click(screen.getByRole('button', { name: '+ Nova tarefa' }));

    await user.type(screen.getByRole('textbox', { name: 'Título da tarefa' }), 'Comprar leite{Enter}');

    expect(onCreate).toHaveBeenCalledWith('Comprar leite');
    expect(await screen.findByRole('button', { name: '+ Nova tarefa' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('creates on the button and returns to the button', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(true);
    render(<NewTask onCreate={onCreate} />);
    await user.click(screen.getByRole('button', { name: '+ Nova tarefa' }));

    await user.type(screen.getByRole('textbox', { name: 'Título da tarefa' }), 'Pagar conta');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    expect(onCreate).toHaveBeenCalledWith('Pagar conta');
    expect(await screen.findByRole('button', { name: '+ Nova tarefa' })).toBeInTheDocument();
  });

  it('keeps the input open with the typed title when creation fails', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(false);
    render(<NewTask onCreate={onCreate} />);
    await user.click(screen.getByRole('button', { name: '+ Nova tarefa' }));
    const input = screen.getByRole('textbox', { name: 'Título da tarefa' });

    await user.type(input, '   {Enter}');

    expect(onCreate).toHaveBeenCalledWith('   ');
    expect(input).toHaveValue('   ');
  });

  it('closes on Escape and returns to the button', async () => {
    const user = userEvent.setup();
    render(<NewTask onCreate={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '+ Nova tarefa' }));

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Nova tarefa' })).toBeInTheDocument();
  });
});
