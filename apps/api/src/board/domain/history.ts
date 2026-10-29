/** One action that changed the board, enough to revert it (ADR 0004). */
export type HistoryEntry =
  | { kind: 'create'; taskId: string }
  | { kind: 'move'; taskId: string; from: string; to: string };

/** Stack of the actions that changed the board; the top is the last one. */
export class History {
  private readonly entries: HistoryEntry[] = [];

  get size(): number {
    return this.entries.length;
  }

  push(entry: HistoryEntry): void {
    this.entries.push(entry);
  }

  peek(): HistoryEntry | undefined {
    return this.entries.at(-1);
  }

  pop(): HistoryEntry | undefined {
    return this.entries.pop();
  }
}
