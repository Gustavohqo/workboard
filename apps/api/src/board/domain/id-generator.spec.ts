import { describe, expect, it } from 'vitest';
import { IdGenerator, compareTaskIds } from './id-generator.js';

describe('IdGenerator', () => {
  it('starts at "1"', () => {
    const generator = new IdGenerator();

    expect(generator.next()).toBe('1');
  });

  it('increments by one on each call', () => {
    const generator = new IdGenerator();

    expect([generator.next(), generator.next(), generator.next()]).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('has no leading zeros when the counter gains digits', () => {
    const generator = new IdGenerator();
    for (let i = 0; i < 9; i++) {
      generator.next();
    }

    expect(generator.next()).toBe('10');
  });
});

describe('compareTaskIds', () => {
  it('returns 0 for equal ids', () => {
    expect(compareTaskIds('7', '7')).toBe(0);
  });

  it('orders shorter ids before longer ones, so "2" comes before "10"', () => {
    expect(compareTaskIds('2', '10')).toBeLessThan(0);
    expect(compareTaskIds('10', '2')).toBeGreaterThan(0);
  });

  it('orders ids of the same length by text', () => {
    expect(compareTaskIds('11', '12')).toBeLessThan(0);
    expect(compareTaskIds('12', '11')).toBeGreaterThan(0);
  });

  it('sorts generated ids in creation order', () => {
    const generator = new IdGenerator();
    const created = Array.from({ length: 12 }, () => generator.next());
    const shuffled = [...created].reverse();

    expect(shuffled.sort(compareTaskIds)).toEqual(created);
  });
});
