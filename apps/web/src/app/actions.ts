'use server';

import { createTask, moveTask, setLimit, undoLastAction } from '@/lib/board/api';
import type { ColumnId } from '@/lib/board/types';

// Server Actions: the browser calls these, and only the server talks to the API (API_URL stays on the server).

export async function createTaskAction(title: string) {
  return createTask(title);
}

export async function moveTaskAction(taskId: string, column: ColumnId) {
  return moveTask(taskId, column);
}

export async function setLimitAction(wipLimit: number) {
  return setLimit(wipLimit);
}

export async function undoAction() {
  return undoLastAction();
}
