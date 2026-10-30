import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Column } from './column';

describe('Column', () => {
  it('is named by its heading and shows the task count', () => {
    render(
      <Column
        column="todo"
        tasks={[{ id: '1', title: 'Comprar pão' }]}
        wipLimit={2}
        undoTaskId={null}
        onMove={vi.fn()}
        onUndo={vi.fn()}
      />,
    );

    const region = screen.getByRole('region', { name: 'A fazer' });
    expect(within(region).getByText('1')).toBeInTheDocument();
    expect(within(region).getByText('Comprar pão')).toBeInTheDocument();
  });

  it('shows the in_progress counter against the limit', () => {
    render(
      <Column
        column="in_progress"
        tasks={[{ id: '1', title: 'Comprar pão' }]}
        wipLimit={2}
        undoTaskId={null}
        onMove={vi.fn()}
        onUndo={vi.fn()}
      />,
    );

    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('warns when in_progress is at its limit', () => {
    render(
      <Column
        column="in_progress"
        tasks={[
          { id: '1', title: 'Comprar pão' },
          { id: '2', title: 'Pagar conta' },
        ]}
        wipLimit={2}
        undoTaskId={null}
        onMove={vi.fn()}
        onUndo={vi.fn()}
      />,
    );

    expect(screen.getByText('2/2 · limite')).toBeInTheDocument();
  });

  it('says when there are no tasks', () => {
    render(
      <Column column="done" tasks={[]} wipLimit={2} undoTaskId={null} onMove={vi.fn()} onUndo={vi.fn()} />,
    );

    expect(screen.getByText('Nenhuma tarefa')).toBeInTheDocument();
  });

  it('shows the undo button only on the task that undoTaskId points to', () => {
    render(
      <Column
        column="todo"
        tasks={[
          { id: '1', title: 'Comprar pão' },
          { id: '2', title: 'Pagar conta' },
        ]}
        wipLimit={2}
        undoTaskId="2"
        onMove={vi.fn()}
        onUndo={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Pode desfazer')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Desfazer #2' })).toBeInTheDocument();
  });

  it('places the leading slot before the tasks', () => {
    render(
      <Column
        column="todo"
        tasks={[{ id: '1', title: 'Comprar pão' }]}
        wipLimit={2}
        undoTaskId={null}
        onMove={vi.fn()}
        onUndo={vi.fn()}
        newTask={<p>Nova tarefa slot</p>}
      />,
    );

    const items = within(screen.getByRole('region', { name: 'A fazer' })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Nova tarefa slot');
    expect(items[1]).toHaveTextContent('Comprar pão');
  });

  it('reports the task id and the target column when a task is moved', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <Column
        column="todo"
        tasks={[{ id: '1', title: 'Comprar pão' }]}
        wipLimit={2}
        undoTaskId={null}
        onMove={onMove}
        onUndo={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Mover #1 para Em andamento' }));

    expect(onMove).toHaveBeenCalledWith('1', 'in_progress');
  });
});
