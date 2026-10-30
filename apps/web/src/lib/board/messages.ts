import { COLUMN_LABELS } from './labels';
import type { ActionOutcome, ActionResult, ColumnId } from './types';

/** What the user asked for, used to word the result. */
export type BoardAction =
  | { type: 'create'; title: string }
  | { type: 'move'; taskId: string; column: ColumnId }
  | { type: 'limit'; wipLimit: number }
  | { type: 'undo' };

export type Feedback = { outcome: ActionOutcome; text: string };

const NOTHING_CHANGED = 'Nada foi alterado.';

/** Turns an API result into the sentence shown to the user (RN15, RN16). */
export function describeResult(action: BoardAction, result: ActionResult): Feedback {
  switch (result.outcome) {
    case 'failed':
      return { outcome: 'failed', text: describeFailure(action, result) };
    case 'unchanged':
      return { outcome: 'unchanged', text: describeUnchanged(action, result) };
    case 'changed':
      return { outcome: 'changed', text: describeChanged(action, result) };
  }
}

function describeFailure(action: BoardAction, result: ActionResult): string {
  switch (result.error?.code) {
    case 'WIP_LIMIT_REACHED': {
      const limit = result.board.wipLimit;
      return `Em andamento já tem ${limit} de ${limit} tarefas. ${NOTHING_CHANGED}`;
    }
    case 'WIP_LIMIT_LOCKED':
      return `Não é possível mudar o limite com tarefas em Em andamento. ${NOTHING_CHANGED}`;
    case 'TASK_NOT_FOUND':
      return `Tarefa não encontrada. ${NOTHING_CHANGED}`;
    case 'UNKNOWN_COLUMN':
      return `Coluna desconhecida. ${NOTHING_CHANGED}`;
    case 'VALIDATION_ERROR':
      return `${validationText(action)} ${NOTHING_CHANGED}`;
    default:
      return `A ação falhou. ${NOTHING_CHANGED}`;
  }
}

function validationText(action: BoardAction): string {
  switch (action.type) {
    case 'create':
      return 'O título não pode ficar vazio.';
    case 'limit':
      return 'Use um número inteiro a partir de 1.';
    default:
      return 'Entrada inválida.';
  }
}

function describeUnchanged(action: BoardAction, result: ActionResult): string {
  if (action.type === 'undo' && result.reason === 'nothing_to_undo') {
    return 'Não há nada para desfazer.';
  }
  if (action.type === 'move') {
    return `Tarefa #${action.taskId} já está em ${COLUMN_LABELS[action.column]}. Nada mudou.`;
  }
  return 'Nada mudou.';
}

function describeChanged(action: BoardAction, result: ActionResult): string {
  switch (action.type) {
    case 'create':
      return `Tarefa #${result.taskId} criada em ${COLUMN_LABELS.todo}.`;
    case 'move':
      return `Tarefa #${action.taskId} movida para ${COLUMN_LABELS[action.column]}.`;
    case 'limit':
      return `Limite de ${COLUMN_LABELS.in_progress} definido como ${result.board.wipLimit}.`;
    case 'undo':
      return 'Última ação desfeita.';
  }
}
