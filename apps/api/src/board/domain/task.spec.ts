import { describe, expect, it } from 'vitest';
import { Task } from './task.js';

describe('Task', () => {
  it('keeps its id, title and column', () => {
    const task = new Task('1', 'Escrever testes', 'todo');

    expect(task.id).toBe('1');
    expect(task.title).toBe('Escrever testes');
    expect(task.column).toBe('todo');
  });

  it.each(['', '   ', '\t\n'])(
    'rejects a blank title %j (RN18)',
    (title) => {
      expect(() => new Task('1', title, 'todo')).toThrow();
    },
  );
});
