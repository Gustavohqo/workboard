/** Board configuration. The limit applies to the `in_progress` column (ADR 0006). */
export class BoardSettings {
  private currentLimit = 2;

  get limit(): number {
    return this.currentLimit;
  }

  /**
   * Changes the limit only when it is a valid integer (RN19) and the
   * `in_progress` column is empty (RN21). Validates before changing anything.
   */
  setLimit(limit: number, inProgressCount: number): void {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error('Limit must be an integer of at least 1');
    }
    if (inProgressCount > 0) {
      throw new Error('Limit cannot change while tasks are in progress');
    }
    this.currentLimit = limit;
  }
}
