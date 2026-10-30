import { describe, expect, it } from 'vitest';
import { describeResult } from './messages';
import type { ActionResult, Board } from './types';

const board: Board = {
  columns: {
    todo: [{ id: '3', title: 'Revisar' }],
    in_progress: [
      { id: '1', title: 'Comprar pão' },
      { id: '2', title: 'Pagar conta' },
    ],
    done: [],
  },
  wipLimit: 2,
  undoTaskId: '1',
};

describe('describeResult', () => {
  it('confirms a created task in A fazer', () => {
    const result: ActionResult = { outcome: 'changed', taskId: '3', board };

    expect(describeResult({ type: 'create', title: 'Revisar' }, result)).toEqual({
      outcome: 'changed',
      text: 'Tarefa #3 criada em A fazer.',
    });
  });

  it('confirms a moved task with the column name', () => {
    const result: ActionResult = { outcome: 'changed', board };

    expect(describeResult({ type: 'move', taskId: '1', column: 'done' }, result)).toEqual({
      outcome: 'changed',
      text: 'Tarefa #1 movida para Concluído.',
    });
  });

  it('says nothing changed when moving to the current column', () => {
    const result: ActionResult = { outcome: 'unchanged', board };

    expect(describeResult({ type: 'move', taskId: '1', column: 'in_progress' }, result)).toEqual({
      outcome: 'unchanged',
      text: 'Tarefa #1 já está em Em andamento. Nada mudou.',
    });
  });

  it('explains a full in_progress column and keeps the board', () => {
    const result: ActionResult = {
      outcome: 'failed',
      board,
      error: { code: 'WIP_LIMIT_REACHED', message: 'The in_progress column is full.' },
    };

    expect(describeResult({ type: 'move', taskId: '3', column: 'in_progress' }, result)).toEqual({
      outcome: 'failed',
      text: 'Em andamento já tem 2 de 2 tarefas. Nada foi alterado.',
    });
  });

  it('explains an empty title', () => {
    const result: ActionResult = {
      outcome: 'failed',
      board,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' },
    };

    expect(describeResult({ type: 'create', title: '   ' }, result)).toEqual({
      outcome: 'failed',
      text: 'O título não pode ficar vazio. Nada foi alterado.',
    });
  });

  it('explains a limit that cannot change while in_progress has tasks', () => {
    const result: ActionResult = {
      outcome: 'failed',
      board,
      error: { code: 'WIP_LIMIT_LOCKED', message: 'The limit is locked.' },
    };

    expect(describeResult({ type: 'limit', wipLimit: 3 }, result)).toEqual({
      outcome: 'failed',
      text: 'Não é possível mudar o limite com tarefas em Em andamento. Nada foi alterado.',
    });
  });

  it('confirms a new limit', () => {
    const result: ActionResult = { outcome: 'changed', board: { ...board, wipLimit: 3 } };

    expect(describeResult({ type: 'limit', wipLimit: 3 }, result)).toEqual({
      outcome: 'changed',
      text: 'Limite de Em andamento definido como 3.',
    });
  });

  it('confirms an undo', () => {
    const result: ActionResult = { outcome: 'changed', board };

    expect(describeResult({ type: 'undo' }, result)).toEqual({
      outcome: 'changed',
      text: 'Última ação desfeita.',
    });
  });

  it('says there is nothing to undo', () => {
    const result: ActionResult = { outcome: 'unchanged', reason: 'nothing_to_undo', board };

    expect(describeResult({ type: 'undo' }, result)).toEqual({
      outcome: 'unchanged',
      text: 'Não há nada para desfazer.',
    });
  });
});
