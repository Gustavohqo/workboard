import { describe, expect, it } from 'vitest';
import { History } from './history.js';

describe('History', () => {
  it('starts empty', () => {
    const history = new History();

    expect(history.size).toBe(0);
    expect(history.peek()).toBeUndefined();
  });

  it('returns the last pushed entry first (stack order)', () => {
    const history = new History();

    history.push({ kind: 'create', taskId: '1' });
    history.push({ kind: 'move', taskId: '1', from: 'todo', to: 'done' });

    expect(history.pop()).toEqual({
      kind: 'move',
      taskId: '1',
      from: 'todo',
      to: 'done',
    });
    expect(history.pop()).toEqual({ kind: 'create', taskId: '1' });
  });

  it('peek reads the top entry without removing it', () => {
    const history = new History();
    history.push({ kind: 'create', taskId: '1' });

    expect(history.peek()).toEqual({ kind: 'create', taskId: '1' });
    expect(history.size).toBe(1);
  });

  it('pop removes the top entry', () => {
    const history = new History();
    history.push({ kind: 'create', taskId: '1' });

    history.pop();

    expect(history.size).toBe(0);
    expect(history.peek()).toBeUndefined();
  });

  it('pop on an empty history returns undefined', () => {
    const history = new History();

    expect(history.pop()).toBeUndefined();
  });
});
