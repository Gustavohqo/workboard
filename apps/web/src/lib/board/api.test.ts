import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTask, getBoard, moveTask, setLimit, undoLastAction } from './api';
import type { Board } from './types';

const BASE = 'http://localhost:3333/api';

const board: Board = {
  columns: { todo: [{ id: '1', title: 'Comprar pão' }], in_progress: [], done: [] },
  wipLimit: 2,
  undoTaskId: '1',
};

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('board api', () => {
  it('loads the board without caching', async () => {
    const fetchMock = mockFetch(200, board);

    await expect(getBoard()).resolves.toEqual(board);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/board`,
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('rejects a response that is not a board', async () => {
    mockFetch(200, { unexpected: true });

    await expect(getBoard()).rejects.toThrow();
  });

  it('posts the title to create a task', async () => {
    const fetchMock = mockFetch(201, { outcome: 'changed', taskId: '2', board });

    const result = await createTask('Comprar leite');

    expect(result).toMatchObject({ outcome: 'changed', taskId: '2' });
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/tasks`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'Comprar leite' }) }),
    );
  });

  it('returns a failed result with its error code instead of throwing', async () => {
    mockFetch(409, {
      outcome: 'failed',
      error: { code: 'WIP_LIMIT_REACHED', message: 'The in_progress column is full.' },
      board,
    });

    const result = await moveTask('1', 'in_progress');

    expect(result.outcome).toBe('failed');
    expect(result.error?.code).toBe('WIP_LIMIT_REACHED');
  });

  it('patches the column of a task', async () => {
    const fetchMock = mockFetch(200, { outcome: 'changed', board });

    await moveTask('1', 'done');

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/tasks/1/column`,
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ column: 'done' }) }),
    );
  });

  it('puts the new limit in the settings', async () => {
    const fetchMock = mockFetch(200, { outcome: 'changed', board });

    await setLimit(3);

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/board/settings`,
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ wipLimit: 3 }) }),
    );
  });

  it('posts to undo the last action', async () => {
    const fetchMock = mockFetch(200, { outcome: 'unchanged', reason: 'nothing_to_undo', board });

    const result = await undoLastAction();

    expect(result).toMatchObject({ outcome: 'unchanged', reason: 'nothing_to_undo' });
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/board/undo`,
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
