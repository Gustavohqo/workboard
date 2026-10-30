import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Button } from '@/components/button';
import { COLUMN_LABELS, COLUMN_ORDER } from '@/lib/board/labels';
import type { ColumnId, Task } from '@/lib/board/types';

export type TaskCardProps = {
  task: Task;
  column: ColumnId;
  undoable: boolean;
  onMove: (column: ColumnId) => void;
  onUndo: () => void;
  /** Focus the card on mount, so it keeps the focus after a keyboard move. */
  autoFocus?: boolean;
};

/** Task card from the design system. Only the card of the last change offers undo (RN22). */
export function TaskCard({ task, column, undoable, onMove, onUndo, autoFocus = false }: TaskCardProps) {
  const targets = COLUMN_ORDER.filter((target) => target !== column);
  const index = COLUMN_ORDER.indexOf(column);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (autoFocus) cardRef.current?.focus();
  }, [autoFocus]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowRight' && index < COLUMN_ORDER.length - 1) onMove(COLUMN_ORDER[index + 1]);
    if (event.key === 'ArrowLeft' && index > 0) onMove(COLUMN_ORDER[index - 1]);
  }

  return (
    <article
      ref={cardRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer flex-col gap-2 rounded-md border border-line bg-surface-raised p-3 shadow-card outline-none focus:border-focus focus:ring-3 focus:ring-accent-soft"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-id text-ink-muted">{`#${task.id}`}</span>
        {undoable && (
          <div className="flex items-center gap-1">
            <span className="rounded-sm bg-new-task-soft px-1.5 text-label text-new-task">Pode desfazer</span>
            <Button variant="ghost" size="sm" aria-label={`Desfazer #${task.id}`} onClick={onUndo}>
              <span className="text-[20px] leading-none">↶</span>
            </Button>
          </div>
        )}
      </div>
      <p className="text-body text-ink">{task.title}</p>
      <div className="flex flex-wrap gap-1">
        {targets.map((target) => (
          <Button
            key={target}
            variant="ghost"
            size="sm"
            aria-label={`Mover #${task.id} para ${COLUMN_LABELS[target]}`}
            onClick={() => onMove(target)}
          >
            <span className="-translate-y-0.5 text-[20px] leading-none">
              {COLUMN_ORDER.indexOf(target) < index ? '←' : '→'}
            </span>
            {COLUMN_LABELS[target]}
          </Button>
        ))}
      </div>
    </article>
  );
}
