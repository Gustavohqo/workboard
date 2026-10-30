/** Column ids defined by the API contract (ADR 0007). */
export type ColumnId = 'todo' | 'in_progress' | 'done';

export type Task = {
  id: string;
  title: string;
};

export type Board = {
  columns: Record<ColumnId, Task[]>;
  wipLimit: number;
  undoTaskId: string | null;
};

export type ActionOutcome = 'changed' | 'unchanged' | 'failed';

export type ActionResult = {
  outcome: ActionOutcome;
  board: Board;
  taskId?: string;
  reason?: string;
  error?: { code: string; message: string };
};
