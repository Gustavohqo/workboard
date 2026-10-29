import { expect, test } from '@playwright/test';

test('home page renders title and API status', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workboard');
  // O status vem de um Server Component async, por isso é validado no E2E
  await expect(page.getByText(/^API:/)).not.toContainText('carregando...');
});

test('counter increments on click', async ({ page }) => {
  await page.goto('/');

  const counter = page.getByRole('button', { name: /Cliques/ });
  await expect(counter).toHaveText('Cliques: 0');
  await counter.click();
  await expect(counter).toHaveText('Cliques: 1');
});
