import { useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';

export type SettingsPanelProps = {
  wipLimit: number;
  /** Resolves to true when the limit was changed, which closes the panel. */
  onSave: (wipLimit: number) => Promise<boolean>;
};

/** Gear button that opens a dropdown with the board settings (the in_progress limit). */
export function SettingsPanel({ wipLimit, onSave }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(String(wipLimit));
  const hintId = useId();

  function openPanel() {
    setLimit(String(wipLimit));
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await onSave(Number(limit));
    if (saved) close();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') close();
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <Button
        variant="ghost"
        aria-label="Configurações do quadro"
        aria-expanded={open}
        onClick={() => (open ? close() : openPanel())}
        className="w-9 px-0 text-[20px] leading-none"
      >
        ⚙
      </Button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="absolute left-1/2 top-full z-10 mt-2 flex w-80 -translate-x-1/2 flex-col gap-2 rounded-lg border border-line bg-surface-raised p-3 shadow-card"
        >
          <div className="flex items-end gap-2">
            <TextField
              label="Limite de Em andamento"
              type="number"
              min={1}
              step={1}
              autoFocus
              aria-describedby={hintId}
              inputClassName="w-12"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
            <Button type="submit">Salvar limite</Button>
          </div>
          <p id={hintId} className="text-caption text-ink-muted">
            Só pode mudar com a coluna vazia.
          </p>
        </form>
      )}
    </div>
  );
}
