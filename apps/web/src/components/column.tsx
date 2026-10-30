import { useId, type ReactNode } from 'react';
import { TaskCard } from '@/components/task-card';
import { COLUMN_LABELS } from '@/lib/board/labels';
import type { ColumnId, Task } from '@/lib/board/types';

export type ColumnProps = {
  column: ColumnId;
  tasks: Task[];
  wipLimit: number;
  undoTaskId: string | null;
  onMove: (taskId: string, column: ColumnId) => void;
  onUndo: () => void;
  /** Id of the task that should take the focus when it mounts (after a move). */
  focusTaskId?: string | null;
  /** Rendered as the first item of the column, before the tasks (used by "A fazer"). */
  newTask?: ReactNode;
};

/** Board column from the design system. Only "Em andamento" has a limit. */
export function Column({
  column,
  tasks,
  wipLimit,
  undoTaskId,
  onMove,
  onUndo,
  focusTaskId = null,
  newTask,
}: ColumnProps) {
  const headingId = useId();
  const hasLimit = column === 'in_progress';
  const atLimit = hasLimit && tasks.length >= wipLimit;
  const counter = hasLimit
    ? `${tasks.length}/${wipLimit}${atLimit ? ' · limite' : ''}`
    : `${tasks.length}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2 rounded-lg bg-surface-sunken p-3">
      <header className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-title text-ink">
          {COLUMN_LABELS[column]}
        </h2>
        <span
          className={`font-mono text-id ${
            atLimit ? 'rounded-sm bg-warning-soft px-1.5 text-warning' : 'text-ink-muted'
          }`}
        >
          {counter}
        </span>
      </header>
      <ul className="flex flex-col gap-2">
        {newTask && <li>{newTask}</li>}
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskCard
              task={task}
              column={column}
              undoable={task.id === undoTaskId}
              onMove={(target) => onMove(task.id, target)}
              onUndo={onUndo}
              autoFocus={task.id === focusTaskId}
            />
          </li>
        ))}
      </ul>
      {tasks.length === 0 && <p className="text-caption text-ink-muted">Nenhuma tarefa</p>}
    </section>
  );
}
