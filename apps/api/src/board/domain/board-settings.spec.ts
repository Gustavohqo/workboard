import { describe, expect, it } from 'vitest';
import { BoardSettings } from './board-settings.js';

describe('BoardSettings', () => {
  it('uses a limit of 2 when none is configured (RN07)', () => {
    const settings = new BoardSettings();

    expect(settings.limit).toBe(2);
  });

  it('accepts a new integer limit of at least 1 when the column is empty', () => {
    const settings = new BoardSettings();

    settings.setLimit(5, 0);

    expect(settings.limit).toBe(5);
  });

  it.each([0, -1, 1.5, Number.NaN])(
    'rejects the invalid limit %s and keeps the current one (RN19)',
    (limit) => {
      const settings = new BoardSettings();

      expect(() => settings.setLimit(limit, 0)).toThrow();
      expect(settings.limit).toBe(2);
    },
  );

  it('rejects a change while in_progress has tasks and keeps the limit (RN21)', () => {
    const settings = new BoardSettings();

    expect(() => settings.setLimit(5, 1)).toThrow();
    expect(settings.limit).toBe(2);
  });
});
