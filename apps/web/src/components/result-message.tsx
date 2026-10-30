import type { ActionOutcome } from '@/lib/board/types';

export type ResultMessageProps = {
  outcome: ActionOutcome;
  text: string;
};

const WORDS: Record<ActionOutcome, string> = {
  changed: 'Feito',
  unchanged: 'Nada mudou',
  failed: 'Falhou',
};

const STYLES: Record<ActionOutcome, string> = {
  changed: 'bg-accent-soft text-accent',
  unchanged: 'bg-warning-soft text-warning',
  failed: 'bg-danger-soft text-danger',
};

/** Result of the last action (RN15). The word states the outcome, so color is never the only signal. */
export function ResultMessage({ outcome, text }: ResultMessageProps) {
  return (
    <p
      role={outcome === 'failed' ? 'alert' : 'status'}
      className={`rounded-lg px-4 py-3 text-body ${STYLES[outcome]}`}
    >
      <strong className="font-medium">{WORDS[outcome]}</strong> {text}
    </p>
  );
}
