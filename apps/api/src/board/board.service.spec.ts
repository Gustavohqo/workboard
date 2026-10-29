import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoardService } from './board.service.js';
import { History, type HistoryEntry } from './domain/history.js';

type Reverting = { revert(entry: HistoryEntry): void };

function storageFailure(): never {
  throw new Error('storage failure');
}

describe('BoardService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('creating tasks', () => {
    it('puts a new task in todo and makes it the undo target (RN01)', () => {
      const service = new BoardService();

      const result = service.createTask('Escrever testes');

      expect(result).toMatchObject({ outcome: 'changed', taskId: '1' });
      expect(service.getBoard().columns.todo).toEqual([
        { id: '1', title: 'Escrever testes' },
      ]);
      expect(service.getBoard().undoTaskId).toBe('1');
    });

    it.each(['', '   ', '\t\n'])(
      'fails on the blank title %j and changes nothing (RN18)',
      (title) => {
        const service = new BoardService();
        const before = service.getBoard();

        const result = service.createTask(title);

        expect(result).toMatchObject({
          outcome: 'failed',
          error: { code: 'VALIDATION_ERROR' },
        });
        expect(service.getBoard()).toEqual(before);
      },
    );

    it('does not consume an id when the title is rejected', () => {
      const service = new BoardService();
      service.createTask('   ');

      expect(service.createTask('Primeira')).toMatchObject({ taskId: '1' });
    });

    it('keeps the board and history when recording the creation fails (RN16)', () => {
      const service = new BoardService();
      const before = service.getBoard();
      vi.spyOn(History.prototype, 'push').mockImplementation(storageFailure);

      expect(() => service.createTask('Escrever testes')).toThrow(
        'storage failure',
      );
      expect(service.getBoard()).toEqual(before);
    });
  });

  describe('moving tasks', () => {
    it('moves the task to the chosen column and makes it the undo target (RN02)', () => {
      const service = new BoardService();
      service.createTask('Escrever testes');

      const result = service.moveTask('1', 'done');

      expect(result).toMatchObject({ outcome: 'changed' });
      expect(service.getBoard().columns.todo).toEqual([]);
      expect(service.getBoard().columns.done).toEqual([
        { id: '1', title: 'Escrever testes' },
      ]);
      expect(service.getBoard().undoTaskId).toBe('1');
    });

    it('fails when the task does not exist and changes nothing (RN03)', () => {
      const service = new BoardService();
      service.createTask('Escrever testes');
      const before = service.getBoard();

      const result = service.moveTask('99', 'done');

      expect(result).toMatchObject({
        outcome: 'failed',
        error: { code: 'TASK_NOT_FOUND' },
      });
      expect(service.getBoard()).toEqual(before);
    });

    it('fails on an unknown column and changes nothing (RN04)', () => {
      const service = new BoardService();
      service.createTask('Escrever testes');
      const before = service.getBoard();

      const result = service.moveTask('1', 'concluido');

      expect(result).toMatchObject({
        outcome: 'failed',
        error: { code: 'UNKNOWN_COLUMN' },
      });
      expect(service.getBoard()).toEqual(before);
    });

    it('reports unchanged when moving to the column the task is already in (RN05)', () => {
      const service = new BoardService();
      service.createTask('Escrever testes');
      const before = service.getBoard();

      const result = service.moveTask('1', 'todo');

      expect(result).toMatchObject({
        outcome: 'unchanged',
        reason: 'same_column',
      });
      expect(service.getBoard()).toEqual(before);
    });

    it('fails when in_progress is at its limit and changes nothing (RN17)', () => {
      const service = new BoardService();
      service.createTask('A');
      service.createTask('B');
      service.createTask('C');
      service.moveTask('1', 'in_progress');
      service.moveTask('2', 'in_progress');
      const before = service.getBoard();

      const result = service.moveTask('3', 'in_progress');

      expect(result).toMatchObject({
        outcome: 'failed',
        error: { code: 'WIP_LIMIT_REACHED' },
      });
      expect(service.getBoard()).toEqual(before);
    });

    it('allows leaving in_progress when the column is full', () => {
      const service = new BoardService();
      service.createTask('A');
      service.createTask('B');
      service.moveTask('1', 'in_progress');
      service.moveTask('2', 'in_progress');

      expect(service.moveTask('1', 'done')).toMatchObject({
        outcome: 'changed',
      });
    });

    it('keeps the task and history when recording the move fails (RN16)', () => {
      const service = new BoardService();
      service.createTask('Escrever testes');
      const before = service.getBoard();
      vi.spyOn(History.prototype, 'push').mockImplementation(storageFailure);

      expect(() => service.moveTask('1', 'done')).toThrow('storage failure');
      expect(service.getBoard()).toEqual(before);
    });
  });

  describe('undo', () => {
    it('reports nothing to undo on an empty history (RN12)', () => {
      const service = new BoardService();
      const before = service.getBoard();

      const result = service.undo();

      expect(result).toMatchObject({
        outcome: 'unchanged',
        reason: 'nothing_to_undo',
      });
      expect(service.getBoard()).toEqual(before);
    });

    it('removes the task created by the last action (RN09)', () => {
      const service = new BoardService();
      service.createTask('Escrever testes');

      expect(service.undo()).toMatchObject({ outcome: 'changed' });
      expect(service.getBoard().columns.todo).toEqual([]);
      expect(service.getBoard().undoTaskId).toBeNull();
    });

    it('returns a moved task to its previous column (RN10)', () => {
      const service = new BoardService();
      service.createTask('Escrever testes');
      service.moveTask('1', 'in_progress');
      service.moveTask('1', 'done');

      service.undo();

      expect(service.getBoard().columns.in_progress).toEqual([
        { id: '1', title: 'Escrever testes' },
      ]);
    });

    it('undoes one action at a time, in reverse order (RN08)', () => {
      const service = new BoardService();
      service.createTask('Escrever testes');
      service.moveTask('1', 'in_progress');
      service.moveTask('1', 'done');

      service.undo();
      expect(service.getBoard().columns.in_progress).toHaveLength(1);
      service.undo();
      expect(service.getBoard().columns.todo).toHaveLength(1);
      service.undo();
      expect(service.getBoard().columns.todo).toEqual([]);
      expect(service.undo()).toMatchObject({ reason: 'nothing_to_undo' });
    });

    it('does not record the undo itself, so a second undo goes further back (RN11)', () => {
      const service = new BoardService();
      service.createTask('A');
      service.createTask('B');

      service.undo();

      expect(service.getBoard().undoTaskId).toBe('1');
    });

    it('keeps the task and history when reverting fails (RN16)', () => {
      const service = new BoardService();
      service.createTask('Escrever testes');
      service.moveTask('1', 'done');
      const before = service.getBoard();
      vi.spyOn(BoardService.prototype as unknown as Reverting, 'revert')
        .mockImplementation(storageFailure);

      expect(() => service.undo()).toThrow('storage failure');
      expect(service.getBoard()).toEqual(before);
    });
  });

  describe('undo indicator (RN22)', () => {
    it('points at the task of the last action that changed the board', () => {
      const service = new BoardService();
      service.createTask('A');
      service.createTask('B');

      expect(service.getBoard().undoTaskId).toBe('2');
    });

    it('ignores failed and unchanged actions', () => {
      const service = new BoardService();
      service.createTask('A');
      service.createTask('B');
      service.moveTask('2', 'done');

      service.moveTask('1', 'concluido');
      service.moveTask('2', 'done');
      service.moveTask('99', 'done');

      expect(service.getBoard().undoTaskId).toBe('2');
    });

    it('moves to the task now on top of the history after an undo', () => {
      const service = new BoardService();
      service.createTask('A');
      service.createTask('B');
      service.moveTask('1', 'done');

      service.undo();

      expect(service.getBoard().undoTaskId).toBe('2');
    });
  });

  describe('changing the limit (RN21)', () => {
    it('changes the limit when in_progress is empty', () => {
      const service = new BoardService();

      expect(service.setLimit(5)).toMatchObject({ outcome: 'changed' });
      expect(service.getBoard().wipLimit).toBe(5);
    });

    it.each([0, -1, 1.5, '3', null])(
      'rejects the invalid limit %j and keeps the current one (RN19)',
      (limit) => {
        const service = new BoardService();

        expect(service.setLimit(limit)).toMatchObject({
          outcome: 'failed',
          error: { code: 'VALIDATION_ERROR' },
        });
        expect(service.getBoard().wipLimit).toBe(2);
      },
    );

    it('fails while a task is in in_progress and keeps the limit and board', () => {
      const service = new BoardService();
      service.createTask('A');
      service.moveTask('1', 'in_progress');
      const before = service.getBoard();

      expect(service.setLimit(5)).toMatchObject({
        outcome: 'failed',
        error: { code: 'WIP_LIMIT_LOCKED' },
      });
      expect(service.getBoard()).toEqual(before);
    });

    it('allows the change after the in_progress column was emptied', () => {
      const service = new BoardService();
      service.createTask('A');
      service.moveTask('1', 'in_progress');
      service.moveTask('1', 'done');

      expect(service.setLimit(3)).toMatchObject({ outcome: 'changed' });
      expect(service.getBoard().wipLimit).toBe(3);
    });
  });

  describe('board view (RN13)', () => {
    it('lists each column in creation order of the ids', () => {
      const service = new BoardService();
      for (let i = 1; i <= 12; i++) {
        service.createTask(`Tarefa ${i}`);
      }

      const ids = service.getBoard().columns.todo.map((task) => task.id);

      expect(ids).toEqual(Array.from({ length: 12 }, (_, i) => String(i + 1)));
    });
  });
});
