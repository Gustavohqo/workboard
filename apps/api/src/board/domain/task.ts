import type { Column } from './column.js';

/** A task on the board. Its column is the only place its position is stored. */
export class Task {
  constructor(
    readonly id: string,
    readonly title: string,
    public column: Column,
  ) {
    if (title.trim() === '') {
      throw new Error('Task title must not be blank');
    }
  }
}
