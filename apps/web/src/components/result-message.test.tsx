import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResultMessage } from './result-message';

describe('ResultMessage', () => {
  it('announces a success with the word Feito', () => {
    render(<ResultMessage outcome="changed" text="Tarefa #4 criada em A fazer." />);

    expect(screen.getByRole('status')).toHaveTextContent('Feito');
    expect(screen.getByRole('status')).toHaveTextContent('Tarefa #4 criada em A fazer.');
  });

  it('announces a no-op with the words Nada mudou', () => {
    render(<ResultMessage outcome="unchanged" text="Não há nada para desfazer." />);

    expect(screen.getByRole('status')).toHaveTextContent('Nada mudou');
  });

  it('announces a failure as an alert with the word Falhou', () => {
    render(
      <ResultMessage outcome="failed" text="Em andamento já tem 2 de 2 tarefas. Nada foi alterado." />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
    expect(screen.getByRole('alert')).toHaveTextContent('Nada foi alterado.');
  });
});
