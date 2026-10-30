'use client';

import { useState } from 'react';
import { createTaskAction, moveTaskAction, setLimitAction, undoAction } from '@/app/actions';
import { Column } from '@/components/column';
import { NewTask } from '@/components/new-task';
import { ResultMessage } from '@/components/result-message';
import { SettingsPanel } from '@/components/settings-panel';
import { COLUMN_ORDER } from '@/lib/board/labels';
import { describeResult, type BoardAction, type Feedback } from '@/lib/board/messages';
import type { ActionResult, Board, ColumnId } from '@/lib/board/types';

export type BoardViewProps = {
  initialBoard: Board;
};

const CONNECTION_FAILED: Feedback = {
  outcome: 'failed',
  text: 'Não foi possível falar com a API. Tente de novo.',
};

/** Interactive board. Every change goes through a Server Action and the board returned by the API replaces the local one. */
export function BoardView({ initialBoard }: BoardViewProps) {
  const [board, setBoard] = useState(initialBoard);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  async function run(action: BoardAction, request: () => Promise<ActionResult>) {
    try {
      const result = await request();
      setBoard(result.board);
      setFeedback(describeResult(action, result));
      return result;
    } catch {
      setFeedback(CONNECTION_FAILED);
      return null;
    }
  }

  async function handleCreate(title: string) {
    const result = await run({ type: 'create', title }, () => createTaskAction(title));
    if (result?.outcome === 'changed') setFocusTaskId(result.taskId ?? null);
    return result?.outcome === 'changed';
  }

  function handleMove(taskId: string, column: ColumnId) {
    setFocusTaskId(taskId);
    void run({ type: 'move', taskId, column }, () => moveTaskAction(taskId, column));
  }

  async function handleLimit(wipLimit: number) {
    const result = await run({ type: 'limit', wipLimit }, () => setLimitAction(wipLimit));
    return result?.outcome === 'changed';
  }

  function handleUndo() {
    setFocusTaskId(null);
    void run({ type: 'undo' }, () => undoAction());
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-center gap-2">
        <h1 className="text-display text-ink">Workboard</h1>
        <SettingsPanel wipLimit={board.wipLimit} onSave={handleLimit} />
      </header>

      {feedback && <ResultMessage outcome={feedback.outcome} text={feedback.text} />}

      <div className="flex flex-col gap-1">
        <div className="grid gap-4 min-[720px]:grid-cols-3">
          {COLUMN_ORDER.map((column) => (
            <Column
              key={column}
              column={column}
              tasks={board.columns[column]}
              wipLimit={board.wipLimit}
              undoTaskId={board.undoTaskId}
              onMove={handleMove}
              onUndo={handleUndo}
              focusTaskId={focusTaskId}
              newTask={column === 'todo' ? <NewTask onCreate={handleCreate} /> : undefined}
            />
          ))}
        </div>
        <p className="text-center font-mono text-caption text-ink-muted">
          Card focado: use <kbd className="px-1 text-[20px] leading-none text-ink">←</kbd> e{' '}
          <kbd className="px-1 text-[20px] leading-none text-ink">→</kbd> para mover entre colunas.
        </p>
      </div>
    </div>
  );
}
