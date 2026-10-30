import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './settings-panel';

const OPEN_LABEL = 'Configurações do quadro';

describe('SettingsPanel', () => {
  it('starts closed, with only the gear button', () => {
    render(<SettingsPanel wipLimit={2} onSave={vi.fn()} />);

    expect(screen.getByRole('button', { name: OPEN_LABEL })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('opens a panel with the current limit and a save button', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel wipLimit={2} onSave={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: OPEN_LABEL }));

    expect(screen.getByRole('button', { name: OPEN_LABEL })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('spinbutton', { name: 'Limite de Em andamento' })).toHaveValue(2);
    expect(screen.getByRole('button', { name: 'Salvar limite' })).toBeInTheDocument();
  });

  it('saves the typed limit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(true);
    render(<SettingsPanel wipLimit={2} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: OPEN_LABEL }));

    const limit = screen.getByRole('spinbutton', { name: 'Limite de Em andamento' });
    await user.clear(limit);
    await user.type(limit, '3');
    await user.click(screen.getByRole('button', { name: 'Salvar limite' }));

    expect(onSave).toHaveBeenCalledWith(3);
  });

  it('closes after a successful save', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel wipLimit={2} onSave={vi.fn().mockResolvedValue(true)} />);
    await user.click(screen.getByRole('button', { name: OPEN_LABEL }));

    await user.click(screen.getByRole('button', { name: 'Salvar limite' }));

    expect(await screen.findByRole('button', { name: OPEN_LABEL })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('stays open when the save is refused', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel wipLimit={2} onSave={vi.fn().mockResolvedValue(false)} />);
    await user.click(screen.getByRole('button', { name: OPEN_LABEL }));

    await user.click(screen.getByRole('button', { name: 'Salvar limite' }));

    expect(screen.getByRole('spinbutton', { name: 'Limite de Em andamento' })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel wipLimit={2} onSave={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: OPEN_LABEL }));

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });
});
