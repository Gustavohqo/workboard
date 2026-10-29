import { BoardSettings, isValidLimit } from './domain/board-settings.js';
import { isColumn, type Column } from './domain/column.js';
import { History, type HistoryEntry } from './domain/history.js';
import { compareTaskIds, IdGenerator } from './domain/id-generator.js';
import { Task, isValidTitle } from './domain/task.js';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_COLUMN'
  | 'TASK_NOT_FOUND'
  | 'WIP_LIMIT_REACHED'
  | 'WIP_LIMIT_LOCKED';

export interface BoardTask {
  id: string;
  title: string;
}

/** The board as the client sees it (ADR 0007). */
export interface BoardView {
  columns: Record<Column, BoardTask[]>;
  wipLimit: number;
  undoTaskId: string | null;
}

/** Result of an action. Every outcome carries the current board. */
export type ActionResult =
  | { outcome: 'changed'; board: BoardView; taskId?: string }
  | {
      outcome: 'unchanged';
      reason: 'same_column' | 'nothing_to_undo';
      board: BoardView;
    }
  | {
      outcome: 'failed';
      error: { code: ErrorCode; message: string };
      board: BoardView;
    };

/**
 * Board actions as transactions (ADR 0005): each one validates first and then
 * changes the tasks and the history together, or neither.
 * Failures caused by validation return `failed`; failures of the storage
 * layer are thrown after restoring the previous state.
 */
export class BoardService {
  private readonly tasks = new Map<string, Task>();

  constructor(
    private readonly settings = new BoardSettings(),
    private readonly history = new History(),
    private readonly ids = new IdGenerator(),
  ) {}

  createTask(title: string): ActionResult {
    if (!isValidTitle(title)) {
      return this.failed('VALIDATION_ERROR', 'Task title must not be blank.');
    }

    const id = this.ids.next();
    this.tasks.set(id, new Task(id, title, 'todo'));
    try {
      this.history.push({ kind: 'create', taskId: id });
    } catch (error) {
      this.tasks.delete(id);
      throw error;
    }

    return { outcome: 'changed', taskId: id, board: this.getBoard() };
  }

  moveTask(taskId: string, column: unknown): ActionResult {
    const task = this.tasks.get(taskId);
    if (!task) {
      return this.failed('TASK_NOT_FOUND', 'Task not found.');
    }
    if (!isColumn(column)) {
      return this.failed('UNKNOWN_COLUMN', 'Unknown column.');
    }
    if (task.column === column) {
      return this.unchanged('same_column');
    }
    if (
      column === 'in_progress' &&
      this.countIn('in_progress') >= this.settings.limit
    ) {
      return this.failed(
        'WIP_LIMIT_REACHED',
        'The in_progress column is full.',
      );
    }

    const from = task.column;
    task.column = column;
    try {
      this.history.push({ kind: 'move', taskId, from, to: column });
    } catch (error) {
      task.column = from;
      throw error;
    }

    return { outcome: 'changed', board: this.getBoard() };
  }

  undo(): ActionResult {
    const entry = this.history.peek();
    if (!entry) {
      return this.unchanged('nothing_to_undo');
    }

    this.revert(entry);
    this.history.pop();

    return { outcome: 'changed', board: this.getBoard() };
  }

  setLimit(limit: unknown): ActionResult {
    if (!isValidLimit(limit)) {
      return this.failed(
        'VALIDATION_ERROR',
        'Limit must be an integer of at least 1.',
      );
    }
    const inProgress = this.countIn('in_progress');
    if (inProgress > 0) {
      return this.failed(
        'WIP_LIMIT_LOCKED',
        'The limit cannot change while tasks are in progress.',
      );
    }

    this.settings.setLimit(limit, inProgress);

    return { outcome: 'changed', board: this.getBoard() };
  }

  getBoard(): BoardView {
    return {
      columns: {
        todo: this.tasksIn('todo'),
        in_progress: this.tasksIn('in_progress'),
        done: this.tasksIn('done'),
      },
      wipLimit: this.settings.limit,
      undoTaskId: this.undoTaskId(),
    };
  }

  /** Reverts one history entry; never records anything (RN11). */
  private revert(entry: HistoryEntry): void {
    if (entry.kind === 'create') {
      this.tasks.delete(entry.taskId);
      return;
    }

    const task = this.tasks.get(entry.taskId);
    if (!task) {
      throw new Error(`Task ${entry.taskId} is missing while reverting`);
    }
    task.column = entry.from;
  }

  private undoTaskId(): string | null {
    const entry = this.history.peek();
    return entry ? entry.taskId : null;
  }

  private tasksIn(column: Column): BoardTask[] {
    return this.tasksWhere(column)
      .sort((a, b) => compareTaskIds(a.id, b.id))
      .map(({ id, title }) => ({ id, title }));
  }

  private countIn(column: Column): number {
    return this.tasksWhere(column).length;
  }

  private tasksWhere(column: Column): Task[] {
    return [...this.tasks.values()].filter((task) => task.column === column);
  }

  private failed(code: ErrorCode, message: string): ActionResult {
    return {
      outcome: 'failed',
      error: { code, message },
      board: this.getBoard(),
    };
  }

  private unchanged(
    reason: 'same_column' | 'nothing_to_undo',
  ): ActionResult {
    return { outcome: 'unchanged', reason, board: this.getBoard() };
  }
}
