import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';

export type NewTaskProps = {
  /** Resolves to true when the task was created, so the form closes only then. */
  onCreate: (title: string) => Promise<boolean>;
};

/** Creation entry for the "A fazer" column: a button that opens the title input. */
export function NewTask({ onCreate }: NewTaskProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  function close() {
    setOpen(false);
    setTitle('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await onCreate(title);
    if (created) close();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') close();
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-center border border-new-task text-new-task"
        onClick={() => setOpen(true)}
      >
        + Nova tarefa
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-md border border-line-strong bg-surface-raised p-3"
    >
      <TextField
        label="Título da tarefa"
        hint={
          <span className="block text-right font-mono">
            <kbd aria-hidden="true" className="px-1 text-[20px] leading-none text-ink">
              ↵
            </kbd>{' '}
            Enter para criar.
          </span>
        }
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={title.length === 0}>
          Criar tarefa
        </Button>
        <Button variant="ghost" size="sm" onClick={close}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
