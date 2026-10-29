import { describe, expect, it } from 'vitest';
import { COLUMNS, isColumn } from './column.js';

describe('COLUMNS', () => {
  it('lists the three fixed columns', () => {
    expect(COLUMNS).toEqual(['todo', 'in_progress', 'done']);
  });
});

describe('isColumn', () => {
  it.each(COLUMNS)('accepts "%s"', (column) => {
    expect(isColumn(column)).toBe(true);
  });

  it.each(['concluido', 'a_fazer', 'em_andamento', 'TODO', '', 1, null])(
    'rejects %j (RN04)',
    (value: unknown) => {
      expect(isColumn(value)).toBe(false);
    },
  );
});
