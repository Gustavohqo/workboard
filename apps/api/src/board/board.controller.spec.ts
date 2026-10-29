import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module.js';
import { configureApp } from '../configure-app.js';

const emptyBoard = {
  columns: { todo: [], in_progress: [], done: [] },
  wipLimit: 2,
  undoTaskId: null,
};

describe('Board HTTP contract (ADR 0007)', () => {
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
    return request(server).post('/api/tasks').send({ title });
  }

  describe('GET /api/board', () => {
    it('returns the empty board with the default limit and no undo target', async () => {
      const response = await request(server).get('/api/board');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(emptyBoard);
    });
  });

  describe('POST /api/tasks', () => {
    it('creates a task in todo and answers 201 with the board', async () => {
      const response = await createTask('Escrever testes');

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        outcome: 'changed',
        taskId: '1',
        board: {
          columns: {
            todo: [{ id: '1', title: 'Escrever testes' }],
          },
          undoTaskId: '1',
        },
      });
    });

    it.each([
      ['a blank title', { title: '   ' }],
      ['a missing title', {}],
      ['a title that is not a string', { title: 5 }],
    ])('answers 400 VALIDATION_ERROR for %s, with the board', async (_, body) => {
      const response = await request(server).post('/api/tasks').send(body);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        outcome: 'failed',
        error: { code: 'VALIDATION_ERROR' },
        board: emptyBoard,
      });
    });
  });

  describe('PATCH /api/tasks/:id/column', () => {
    it('moves the task and answers 200 changed', async () => {
      await createTask('Tarefa');

      const response = await request(server)
        .patch('/api/tasks/1/column')
        .send({ column: 'in_progress' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        outcome: 'changed',
        board: { columns: { in_progress: [{ id: '1', title: 'Tarefa' }] } },
      });
    });

    it('answers 200 unchanged when the task is already in that column', async () => {
      await createTask('Tarefa');

      const response = await request(server)
        .patch('/api/tasks/1/column')
        .send({ column: 'todo' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        outcome: 'unchanged',
        reason: 'same_column',
      });
    });

    it('answers 400 UNKNOWN_COLUMN for a column that does not exist', async () => {
      await createTask('Tarefa');

      const response = await request(server)
        .patch('/api/tasks/1/column')
        .send({ column: 'a_fazer' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        outcome: 'failed',
        error: { code: 'UNKNOWN_COLUMN' },
      });
    });

    it('answers 400 VALIDATION_ERROR when the column is missing', async () => {
      await createTask('Tarefa');

      const response = await request(server)
        .patch('/api/tasks/1/column')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        outcome: 'failed',
        error: { code: 'VALIDATION_ERROR' },
      });
    });

    it('answers 404 TASK_NOT_FOUND for an unknown task', async () => {
      const response = await request(server)
        .patch('/api/tasks/99/column')
        .send({ column: 'done' });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        outcome: 'failed',
        error: { code: 'TASK_NOT_FOUND' },
        board: emptyBoard,
      });
    });

    it('answers 409 WIP_LIMIT_REACHED when in_progress is full', async () => {
      await createTask('A');
      await createTask('B');
      await createTask('C');
      await request(server).patch('/api/tasks/1/column').send({ column: 'in_progress' });
      await request(server).patch('/api/tasks/2/column').send({ column: 'in_progress' });

      const response = await request(server)
        .patch('/api/tasks/3/column')
        .send({ column: 'in_progress' });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        outcome: 'failed',
        error: { code: 'WIP_LIMIT_REACHED' },
      });
    });
  });

  describe('PUT /api/board/settings', () => {
    it('sets the limit and answers 200 changed with the new board', async () => {
      const response = await request(server)
        .put('/api/board/settings')
        .send({ wipLimit: 3 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        outcome: 'changed',
        board: { wipLimit: 3 },
      });
    });

    it.each([
      ['zero', { wipLimit: 0 }],
      ['a fraction', { wipLimit: 1.5 }],
      ['a string', { wipLimit: '2' }],
      ['a missing value', {}],
    ])('answers 400 VALIDATION_ERROR for %s, with the board', async (_, body) => {
      const response = await request(server).put('/api/board/settings').send(body);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        outcome: 'failed',
        error: { code: 'VALIDATION_ERROR' },
        board: { wipLimit: 2 },
      });
    });

    it('answers 409 WIP_LIMIT_LOCKED while a task is in progress', async () => {
      await createTask('Tarefa');
      await request(server).patch('/api/tasks/1/column').send({ column: 'in_progress' });

      const response = await request(server)
        .put('/api/board/settings')
        .send({ wipLimit: 3 });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        outcome: 'failed',
        error: { code: 'WIP_LIMIT_LOCKED' },
        board: { wipLimit: 2 },
      });
    });
  });

  describe('POST /api/board/undo', () => {
    it('reverts the last change and answers 200 changed', async () => {
      await createTask('Tarefa');

      const response = await request(server).post('/api/board/undo');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        outcome: 'changed',
        board: emptyBoard,
      });
    });

    it('answers 200 unchanged with nothing_to_undo when there is no history', async () => {
      const response = await request(server).post('/api/board/undo');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        outcome: 'unchanged',
        reason: 'nothing_to_undo',
        board: emptyBoard,
      });
    });
  });
});
