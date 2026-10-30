import type { ColumnId } from './types';

/** Column order as shown on screen, left to right. */
export const COLUMN_ORDER: readonly ColumnId[] = ['todo', 'in_progress', 'done'];

/** Column names shown to the user. Internal ids never appear on screen (design system). */
export const COLUMN_LABELS: Record<ColumnId, string> = {
  todo: 'A fazer',
  in_progress: 'Em andamento',
  done: 'Concluído',
};
