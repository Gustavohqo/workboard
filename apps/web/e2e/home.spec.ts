import { expect, test } from '@playwright/test';

// Os testes E2E precisam da API no ar (pnpm dev na raiz, porta 3333).

test('home page shows the title and the three columns', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workboard');
  await expect(page.getByRole('region', { name: 'A fazer' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Em andamento' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Concluído' })).toBeVisible();
});

test('creates a task with Enter and confirms it', async ({ page }) => {
  await page.goto('/');

  // Título único por execução, já que a API guarda o quadro em memória
  const title = `Tarefa E2E ${Date.now()}`;
  await page.getByRole('button', { name: '+ Nova tarefa' }).click();
  await page.getByRole('textbox', { name: 'Título da tarefa' }).fill(title);
  await page.keyboard.press('Enter');

  await expect(page.getByRole('status')).toContainText('criada em A fazer.');
  await expect(page.getByRole('region', { name: 'A fazer' })).toContainText(title);
});

test('refuses an empty title and keeps the board', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: '+ Nova tarefa' }).click();
  await page.getByRole('textbox', { name: 'Título da tarefa' }).fill('   ');
  await page.getByRole('button', { name: 'Criar tarefa' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Falhou' })).toContainText(
    'O título não pode ficar vazio. Nada foi alterado.',
  );
});
