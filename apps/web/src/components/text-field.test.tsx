import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from './text-field';

describe('TextField', () => {
  it('is labelled by its visible label', () => {
    render(<TextField label="Título da tarefa" />);

    expect(screen.getByRole('textbox', { name: 'Título da tarefa' })).toBeInTheDocument();
  });

  it('describes the field with its hint', () => {
    render(<TextField label="Limite" hint="Só pode mudar com a coluna vazia." />);

    expect(screen.getByRole('textbox', { name: 'Limite' })).toHaveAccessibleDescription(
      'Só pode mudar com a coluna vazia.',
    );
  });

  it('marks the field as invalid and describes it with the error', () => {
    render(<TextField label="Título da tarefa" error="O título não pode ficar vazio." />);

    const input = screen.getByRole('textbox', { name: 'Título da tarefa' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('O título não pode ficar vazio.');
  });

  it('is not marked invalid without an error', () => {
    render(<TextField label="Título da tarefa" />);

    expect(screen.getByRole('textbox', { name: 'Título da tarefa' })).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  });

  it('reports typed text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextField label="Título da tarefa" onChange={onChange} />);

    await user.type(screen.getByRole('textbox', { name: 'Título da tarefa' }), 'a');

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
