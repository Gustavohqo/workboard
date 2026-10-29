/** Generates task ids as a counter without leading zeros (ADR 0003). */
export class IdGenerator {
  private counter = 0;

  next(): string {
    this.counter += 1;
    return String(this.counter);
  }
}

/** Orders task ids by length first, then by text (ADR 0003). */
export function compareTaskIds(a: string, b: string): number {
  if (a.length !== b.length) {
    return a.length - b.length;
  }
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}
