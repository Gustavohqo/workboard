# Next steps

Decisions that are **not needed today** but may become necessary if the project context changes.
Each item names the trigger, what would have to be decided, and what the current design assumes.

Current scope: `docs/ai/context/escopo.md`. Current decisions: `docs/ai/decisions/`.

## Task ids

### Id width and ordering

- **Today:** ids come from an integer counter starting at 1, with no leading zeros, ordered by length and then by text (ADR 0003).
- **Trigger:** ids start being sorted or compared by systems that only know plain text ordering (a database index, an external API, a spreadsheet export).
- **Decision:** switch to fixed-width, zero-padded ids so plain text ordering matches creation order, choosing a width large enough to never be exhausted, or keep dynamic ids and require every consumer to use the length-then-text comparator.

### Id reuse

- **Today:** undoing a creation never frees its id.
- **Trigger:** ids must be gapless (e.g. sequential numbering required for auditing or display).
- **Decision:** whether undoing a creation should roll the counter back, and how to handle an id that someone already saw for a task that no longer exists.

## Storage

- **Today:** everything lives in memory; restarting loses the board, the history and the id counter.
- **Trigger:** the board must survive restarts.
- **Decision:** what is persisted (tasks only, or also history and counter), whether the undo history survives a restart, and how to keep a board change and its history entry atomic on disk.

## Undo history

### History size

- **Today:** the history grows without limit.
- **Trigger:** long-running sessions or persistence make the history large.
- **Decision:** cap the number of undoable actions, and what happens to the oldest entries.

### Redo

- **Today:** out of scope.
- **Trigger:** users ask to reapply an undone action.
- **Decision:** add a redo stack, and define that any new action that changes the board clears it.

## Work-in-progress limit

- **Today:** the limit is configured once before use (minimum 1, default 2). Because undo restores states in reverse order, it never pushes `em_andamento` over the limit.
- **Trigger:** the limit can be changed while the board is in use.
- **Decision:** what happens when the new limit is below the current number of tasks in `em_andamento`, and whether undoing a move back into `em_andamento` may exceed the new limit.

## Task deletion

- **Today:** out of scope.
- **Trigger:** users need to remove tasks.
- **Decision:** add a history entry type for deletion (keeping the full task and its column so undo can restore it), and confirm that deleted ids are still never reused.

## Multiple users

### Login

- **Today:** out of scope; there is a single anonymous board.
- **Trigger:** actions must be tied to a person.
- **Decision:** whether there is one board or one per user/team, and whether undo is global or limited to each person's own actions.

### Real-time collaboration

- **Today:** out of scope; actions happen one at a time.
- **Trigger:** several people act on the same board at the same time.
- **Decision:** how to serialize concurrent actions (especially two moves into `em_andamento` competing for the last slot), and what "undo the last change" means when the last change was made by someone else.
