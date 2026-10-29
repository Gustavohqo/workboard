import type { Column } from './column.js';

/** Tells whether a title is usable: not empty and not only spaces (RN18). */
export function isValidTitle(title: string): boolean {
  return title.trim() !== '';
}

/** A task on the board. Its column is the only place its position is stored. */
export class Task {
  constructor(
    readonly id: string,
    readonly title: string,
    public column: Column,
  ) {
    if (!isValidTitle(title)) {
      throw new Error('Task title must not be blank');
    }
  }
}
