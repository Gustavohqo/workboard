import type { ActionResult, Board, ColumnId } from './types';

/** Base URL of the API, including the /api prefix. Read on the server only. */
const API_URL = process.env.API_URL ?? 'http://localhost:3333/api';

function isBoard(value: unknown): value is Board {
  return (
    typeof value === 'object' &&
    value !== null &&
    'columns' in value &&
    'wipLimit' in value &&
    typeof value.wipLimit === 'number' &&
    'undoTaskId' in value
  );
}

function isActionResult(value: unknown): value is ActionResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'outcome' in value &&
    'board' in value &&
    isBoard(value.board)
  );
}

async function send(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: { 'content-type': 'application/json' },
  });
  return response.json();
}

async function sendAction(path: string, init: RequestInit): Promise<ActionResult> {
  const body = await send(path, init);
  if (!isActionResult(body)) {
    throw new Error(`Unexpected response from the API at ${path}`);
  }
  return body;
}

export async function getBoard(): Promise<Board> {
  const body = await send('/board');
  if (!isBoard(body)) {
    throw new Error('Unexpected board response from the API');
  }
  return body;
}

export function createTask(title: string): Promise<ActionResult> {
  return sendAction('/tasks', { method: 'POST', body: JSON.stringify({ title }) });
}

export function moveTask(taskId: string, column: ColumnId): Promise<ActionResult> {
  return sendAction(`/tasks/${encodeURIComponent(taskId)}/column`, {
    method: 'PATCH',
    body: JSON.stringify({ column }),
  });
}

export function setLimit(wipLimit: number): Promise<ActionResult> {
  return sendAction('/board/settings', { method: 'PUT', body: JSON.stringify({ wipLimit }) });
}

export function undoLastAction(): Promise<ActionResult> {
  return sendAction('/board/undo', { method: 'POST' });
}
