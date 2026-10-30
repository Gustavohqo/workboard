import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskCard } from './task-card';

const task = { id: '1', title: 'Comprar pão' };

describe('TaskCard', () => {
  it('shows the id and the title', () => {
    render(<TaskCard task={task} column="todo" undoable={false} onMove={vi.fn()} onUndo={vi.fn()} />);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Comprar pão')).toBeInTheDocument();
  });

  it('shows the undo button and the indicator only when the task can be undone', () => {
    const { rerender } = render(
      <TaskCard task={task} column="todo" undoable onMove={vi.fn()} onUndo={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Desfazer #1' })).toBeInTheDocument();
    expect(screen.getByText('Pode desfazer')).toBeInTheDocument();

    rerender(<TaskCard task={task} column="todo" undoable={false} onMove={vi.fn()} onUndo={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Desfazer #1' })).not.toBeInTheDocument();
    expect(screen.queryByText('Pode desfazer')).not.toBeInTheDocument();
  });

  it('calls onUndo when the undo button is pressed', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    render(<TaskCard task={task} column="todo" undoable onMove={vi.fn()} onUndo={onUndo} />);

    await user.click(screen.getByRole('button', { name: 'Desfazer #1' }));

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('offers moves only to the other columns', () => {
    render(<TaskCard task={task} column="todo" undoable={false} onMove={vi.fn()} onUndo={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Mover #1 para Em andamento' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mover #1 para Concluído' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mover #1 para A fazer' })).not.toBeInTheDocument();
  });

  it('reports the chosen column', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<TaskCard task={task} column="todo" undoable={false} onMove={onMove} onUndo={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Mover #1 para Concluído' }));

    expect(onMove).toHaveBeenCalledWith('done');
  });

  it('is focusable so the keyboard can act on it', () => {
    render(<TaskCard task={task} column="todo" undoable={false} onMove={vi.fn()} onUndo={vi.fn()} />);

    expect(screen.getByRole('article')).toHaveAttribute('tabindex', '0');
  });

  it('moves to the next column with ArrowRight', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<TaskCard task={task} column="in_progress" undoable={false} onMove={onMove} onUndo={vi.fn()} />);

    await user.click(screen.getByRole('article'));
    await user.keyboard('{ArrowRight}');

    expect(onMove).toHaveBeenCalledWith('done');
  });

  it('moves to the previous column with ArrowLeft', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<TaskCard task={task} column="in_progress" undoable={false} onMove={onMove} onUndo={vi.fn()} />);

    await user.click(screen.getByRole('article'));
    await user.keyboard('{ArrowLeft}');

    expect(onMove).toHaveBeenCalledWith('todo');
  });

  it('does nothing when the arrow points past the first or last column', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<TaskCard task={task} column="todo" undoable={false} onMove={onMove} onUndo={vi.fn()} />);

    await user.click(screen.getByRole('article'));
    await user.keyboard('{ArrowLeft}');

    expect(onMove).not.toHaveBeenCalled();
  });

  it('points the move arrow toward the target column', () => {
    render(<TaskCard task={task} column="in_progress" undoable={false} onMove={vi.fn()} onUndo={vi.fn()} />);

    const toTodo = screen.getByRole('button', { name: 'Mover #1 para A fazer' });
    const toDone = screen.getByRole('button', { name: 'Mover #1 para Concluído' });
    expect(toTodo).toHaveTextContent('←');
    expect(toDone).toHaveTextContent('→');
  });
});
