import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionResult, Board } from '@/lib/board/types';
import { BoardView } from './board-view';

const actions = vi.hoisted(() => ({
  createTaskAction: vi.fn(),
  moveTaskAction: vi.fn(),
  setLimitAction: vi.fn(),
  undoAction: vi.fn(),
}));

vi.mock('@/app/actions', () => actions);

const initialBoard: Board = {
  columns: {
    todo: [{ id: '1', title: 'Comprar pão' }],
    in_progress: [{ id: '2', title: 'Pagar conta' }],
    done: [],
  },
  wipLimit: 2,
  undoTaskId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BoardView', () => {
  it('shows the title with the settings button next to it', () => {
    render(<BoardView initialBoard={initialBoard} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Workboard');
    expect(screen.getByRole('button', { name: 'Configurações do quadro' })).toBeInTheDocument();
  });

  it('shows the three columns with their tasks', () => {
    render(<BoardView initialBoard={initialBoard} />);

    expect(within(screen.getByRole('region', { name: 'A fazer' })).getByText('Comprar pão')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Em andamento' })).getByText('Pagar conta')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Concluído' })).getByText('Nenhuma tarefa')).toBeInTheDocument();
  });

  it('shows no undo button when there is nothing to undo', () => {
    render(<BoardView initialBoard={initialBoard} />);

    expect(screen.queryByRole('button', { name: /Desfazer/ })).not.toBeInTheDocument();
  });

  it('creates a task and shows the confirmation', async () => {
    const user = userEvent.setup();
    const result: ActionResult = {
      outcome: 'changed',
      taskId: '3',
      board: {
        ...initialBoard,
        columns: { ...initialBoard.columns, todo: [...initialBoard.columns.todo, { id: '3', title: 'Comprar leite' }] },
        undoTaskId: '3',
      },
    };
    actions.createTaskAction.mockResolvedValue(result);
    render(<BoardView initialBoard={initialBoard} />);

    await user.click(screen.getByRole('button', { name: '+ Nova tarefa' }));
    await user.type(screen.getByRole('textbox', { name: 'Título da tarefa' }), 'Comprar leite');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    expect(actions.createTaskAction).toHaveBeenCalledWith('Comprar leite');
    expect(await screen.findByRole('status')).toHaveTextContent('Tarefa #3 criada em A fazer.');
    expect(within(screen.getByRole('region', { name: 'A fazer' })).getByText('Comprar leite')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Comprar leite').closest('article')).toHaveFocus());
  });

  it('shows a failure and keeps the board as it was', async () => {
    const user = userEvent.setup();
    actions.moveTaskAction.mockResolvedValue({
      outcome: 'failed',
      board: initialBoard,
      error: { code: 'WIP_LIMIT_REACHED', message: 'The in_progress column is full.' },
    } satisfies ActionResult);
    render(<BoardView initialBoard={initialBoard} />);

    await user.click(screen.getByRole('button', { name: 'Mover #1 para Em andamento' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Em andamento já tem 2 de 2 tarefas. Nada foi alterado.',
    );
    expect(within(screen.getByRole('region', { name: 'A fazer' })).getByText('Comprar pão')).toBeInTheDocument();
  });

  it('moves a task to the chosen column', async () => {
    const user = userEvent.setup();
    actions.moveTaskAction.mockResolvedValue({
      outcome: 'changed',
      board: {
        columns: { todo: [], in_progress: [...initialBoard.columns.in_progress, { id: '1', title: 'Comprar pão' }], done: [] },
        wipLimit: 2,
        undoTaskId: '1',
      },
    } satisfies ActionResult);
    render(<BoardView initialBoard={initialBoard} />);

    await user.click(screen.getByRole('button', { name: 'Mover #1 para Em andamento' }));

    expect(actions.moveTaskAction).toHaveBeenCalledWith('1', 'in_progress');
    expect(await screen.findByRole('status')).toHaveTextContent('Tarefa #1 movida para Em andamento.');
    expect(within(screen.getByRole('region', { name: 'Em andamento' })).getByText('Comprar pão')).toBeInTheDocument();
  });

  it('changes the limit from the settings panel and confirms it', async () => {
    const user = userEvent.setup();
    actions.setLimitAction.mockResolvedValue({
      outcome: 'changed',
      board: { ...initialBoard, wipLimit: 3 },
    } satisfies ActionResult);
    render(<BoardView initialBoard={initialBoard} />);

    await user.click(screen.getByRole('button', { name: 'Configurações do quadro' }));
    const limit = screen.getByRole('spinbutton', { name: 'Limite de Em andamento' });
    await user.clear(limit);
    await user.type(limit, '3');
    await user.click(screen.getByRole('button', { name: 'Salvar limite' }));

    expect(actions.setLimitAction).toHaveBeenCalledWith(3);
    expect(await screen.findByRole('status')).toHaveTextContent('Limite de Em andamento definido como 3.');
  });

  it('undoes the last action and reports when there is nothing left', async () => {
    const user = userEvent.setup();
    actions.undoAction.mockResolvedValue({
      outcome: 'unchanged',
      reason: 'nothing_to_undo',
      board: initialBoard,
    } satisfies ActionResult);
    render(<BoardView initialBoard={{ ...initialBoard, undoTaskId: '2' }} />);

    await user.click(screen.getByRole('button', { name: 'Desfazer #2' }));

    expect(actions.undoAction).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('status')).toHaveTextContent('Não há nada para desfazer.');
  });

  it('shows the keyboard hint below the board', () => {
    render(<BoardView initialBoard={initialBoard} />);

    expect(screen.getByText(/mover entre colunas/)).toBeInTheDocument();
  });

  it('moves the focused card with the arrow keys', async () => {
    const user = userEvent.setup();
    actions.moveTaskAction.mockResolvedValue({
      outcome: 'changed',
      board: { ...initialBoard, columns: { todo: [], in_progress: [...initialBoard.columns.in_progress, initialBoard.columns.todo[0]], done: [] } },
    } satisfies ActionResult);
    render(<BoardView initialBoard={initialBoard} />);

    await user.click(screen.getByText('Comprar pão').closest('article')!);
    await user.keyboard('{ArrowRight}');

    expect(actions.moveTaskAction).toHaveBeenCalledWith('1', 'in_progress');
    await waitFor(() => expect(screen.getByText('Comprar pão').closest('article')).toHaveFocus());
  });

  it('tells the user when the API cannot be reached', async () => {
    const user = userEvent.setup();
    actions.createTaskAction.mockRejectedValue(new TypeError('fetch failed'));
    render(<BoardView initialBoard={initialBoard} />);

    await user.click(screen.getByRole('button', { name: '+ Nova tarefa' }));
    await user.type(screen.getByRole('textbox', { name: 'Título da tarefa' }), 'Nova');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível falar com a API. Tente de novo.');
  });
});
