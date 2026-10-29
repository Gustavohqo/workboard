import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

describe('Board flows (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  async function createTask(title: string) {
    const response = await request(server).post('/api/tasks').send({ title });
    return response.body.taskId as string;
  }

  async function moveTask(id: string, column: string) {
    return request(server)
      .patch(`/api/tasks/${id}/column`)
      .send({ column });
  }

  async function getBoard() {
    const response = await request(server).get('/api/board');
    return response.body;
  }

  it('creates tasks in todo, ordered by creation, with the last one as undo target', async () => {
    await createTask('Primeira');
    await createTask('Segunda');

    const board = await getBoard();

    expect(board.columns.todo).toEqual([
      { id: '1', title: 'Primeira' },
      { id: '2', title: 'Segunda' },
    ]);
    expect(board.undoTaskId).toBe('2');
  });

  it('fills in_progress up to the limit and rejects the next move without changing the board', async () => {
    const first = await createTask('A');
    const second = await createTask('B');
    const third = await createTask('C');
    await moveTask(first, 'in_progress');
    await moveTask(second, 'in_progress');
    const before = await getBoard();

    const response = await moveTask(third, 'in_progress');

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      outcome: 'failed',
      error: { code: 'WIP_LIMIT_REACHED' },
    });
    expect(response.body.board).toEqual(before);
    expect(before.columns.in_progress).toHaveLength(2);
    expect(before.columns.todo).toEqual([{ id: '3', title: 'C' }]);
  });

  it('refuses to change the limit while a task is in progress, and accepts it once the column is empty', async () => {
    const id = await createTask('A');
    await moveTask(id, 'in_progress');

    const locked = await request(server)
      .put('/api/board/settings')
      .send({ wipLimit: 3 });

    expect(locked.status).toBe(409);
    expect(locked.body).toMatchObject({
      outcome: 'failed',
      error: { code: 'WIP_LIMIT_LOCKED' },
      board: { wipLimit: 2 },
    });

    await request(server).post('/api/board/undo');
    const changed = await request(server)
      .put('/api/board/settings')
      .send({ wipLimit: 3 });

    expect(changed.status).toBe(200);
    expect(changed.body.board.wipLimit).toBe(3);
  });

  it('applies a new limit to later moves once the in_progress column is empty again', async () => {
    await request(server).put('/api/board/settings').send({ wipLimit: 1 });
    const first = await createTask('A');
    const second = await createTask('B');
    await moveTask(first, 'in_progress');
    const blocked = await moveTask(second, 'in_progress');

    await request(server).post('/api/board/undo');
    await request(server).put('/api/board/settings').send({ wipLimit: 2 });
    const allowed = await moveTask(second, 'in_progress');

    expect(blocked.status).toBe(409);
    expect(allowed.status).toBe(200);
    expect(allowed.body.outcome).toBe('changed');
    expect(allowed.body.board.wipLimit).toBe(2);
  });

  it('undoes every change in reverse order until there is nothing left to undo', async () => {
    const first = await createTask('A');
    await createTask('B');
    await moveTask(first, 'done');

    const undoMove = await request(server).post('/api/board/undo');
    expect(undoMove.body.board.columns.done).toEqual([]);
    expect(undoMove.body.board.columns.todo).toEqual([
      { id: '1', title: 'A' },
      { id: '2', title: 'B' },
    ]);
    expect(undoMove.body.board.undoTaskId).toBe('2');

    const undoSecond = await request(server).post('/api/board/undo');
    expect(undoSecond.body.board.columns.todo).toEqual([
      { id: '1', title: 'A' },
    ]);

    const undoFirst = await request(server).post('/api/board/undo');
    expect(undoFirst.body.board.columns.todo).toEqual([]);
    expect(undoFirst.body.board.undoTaskId).toBeNull();

    const nothing = await request(server).post('/api/board/undo');
    expect(nothing.status).toBe(200);
    expect(nothing.body).toMatchObject({
      outcome: 'unchanged',
      reason: 'nothing_to_undo',
    });
  });

  it('does not reuse the id of a task removed by undo', async () => {
    await createTask('A');
    await request(server).post('/api/board/undo');

    const id = await createTask('B');

    expect(id).toBe('2');
  });
});
