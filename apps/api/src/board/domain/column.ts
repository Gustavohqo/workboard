/** The three fixed columns of the board. */
export const COLUMNS = ['todo', 'in_progress', 'done'] as const;

export type Column = (typeof COLUMNS)[number];

/** Tells whether an unknown value is one of the board columns (RN04). */
export function isColumn(value: unknown): value is Column {
  return (COLUMNS as readonly unknown[]).includes(value);
}
