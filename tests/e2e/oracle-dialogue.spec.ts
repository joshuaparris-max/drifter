import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

const collectUnexpectedConsoleErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('console', (message: ConsoleMessage): void => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error: Error): void => errors.push(error.message));
  return errors;
};

test('loads and renders the Dreadnought Cortex without console errors', async ({ page }) => {
  const consoleErrors = collectUnexpectedConsoleErrors(page);
  await page.goto('/');

  await expect(page.getByTestId('cortex-scene')).toBeVisible();
  const canvas = page.getByTestId('cortex-canvas').locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveJSProperty('width', 1280);
  await expect(page.getByTestId('scene-controls')).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test('communes with the Oracle, rolls Persuasion, and returns to play', async ({ page }) => {
  const consoleErrors = collectUnexpectedConsoleErrors(page);
  await page.goto('/?testPosition=oracle');

  await expect(page.getByTestId('oracle-prompt')).toBeVisible();
  await page.keyboard.press('e');

  const overlay = page.getByTestId('dialogue-overlay');
  await expect(overlay).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Left Eye Nerve Oracle' })).toBeVisible();
  await expect(page.getByTestId('dialogue-choice-honest-answer')).toBeVisible();

  await page.getByTestId('dialogue-choice-persuade-oracle').click();
  const result = page.getByTestId('skill-check-result');
  await expect(result).toBeVisible();
  await expect(result).toContainText(/Natural \d+ [+-]\d+ = \d+ vs DC 11/);
  await expect(result).toContainText(/Check (succeeded|failed)/);
  await expect(page.locator('.dialogue-text')).toContainText(/Cult of the Left Eye will hear|sounded symmetrical/);
  await expect(page.getByTestId('faction-reputation')).toContainText(/(?:10|-5)$/);

  await page.getByTestId('dialogue-close').click();
  await expect(overlay).toBeHidden();
  await expect(page.getByTestId('cortex-canvas').locator('canvas')).toBeVisible();
  await expect(page.getByTestId('scene-controls')).toBeVisible();
  await expect(page.getByTestId('oracle-prompt')).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test('closes dialogue with Escape and allows interaction again', async ({ page }) => {
  await page.goto('/?testPosition=oracle');
  await expect(page.getByTestId('oracle-prompt')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByTestId('dialogue-overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('dialogue-overlay')).toBeHidden();
  await page.keyboard.press('e');
  await expect(page.getByTestId('dialogue-overlay')).toBeVisible();
});

test('walks from the normal spawn to the Oracle and resumes movement', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('cortex-canvas').locator('canvas');
  await expect(canvas).toHaveAttribute('data-player-x', '0.00');
  await expect(canvas).toHaveAttribute('data-player-z', '7.00');

  // Follow the room axes from (0, 7) to the Oracle around (4, -1).
  await page.keyboard.down('KeyW');
  await expect.poll(async () => Number(await canvas.getAttribute('data-player-z')), {
    timeout: 6000,
  }).toBeLessThan(0);
  await page.keyboard.up('KeyW');
  await page.keyboard.down('KeyD');
  await expect.poll(async () => Number(await canvas.getAttribute('data-player-x')), {
    timeout: 4000,
  }).toBeGreaterThan(3.5);
  await page.keyboard.up('KeyD');
  await expect(page.getByTestId('oracle-prompt')).toBeVisible();

  await page.keyboard.press('KeyE');
  await expect(page.getByTestId('dialogue-overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  const xBeforeResume = Number(await canvas.getAttribute('data-player-x'));
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyA');
  await expect.poll(async () => Number(await canvas.getAttribute('data-player-x'))).toBeLessThan(xBeforeResume);
});

test('follows the normal dialogue response and closes its outcome', async ({ page }) => {
  await page.goto('/?testPosition=oracle');
  await expect(page.getByTestId('oracle-prompt')).toBeVisible();
  await page.keyboard.press('KeyE');
  await page.getByTestId('dialogue-choice-honest-answer').click();
  await expect(page.locator('.dialogue-text')).toContainText('Flattery logged');
  await expect(page.getByTestId('faction-reputation')).toContainText('0');
  await page.getByTestId('dialogue-choice-leave-politely').click();
  await expect(page.getByTestId('dialogue-overlay')).toBeHidden();
});

for (const roll of [1, 20] as const) {
  test(`handles a deterministic natural ${roll} Persuasion result`, async ({ page }) => {
    await page.goto(`/?testPosition=oracle&testRoll=${roll}`);
    await expect(page.getByTestId('oracle-prompt')).toBeVisible();
    await page.keyboard.press('KeyE');
    await page.getByTestId('dialogue-choice-persuade-oracle').click();
    await expect(page.getByTestId('skill-check-result')).toContainText(`Natural ${roll}`);
    await expect(page.getByTestId('skill-check-result')).toContainText(roll === 20 ? 'Check succeeded' : 'Check failed');
    await expect(page.getByTestId('faction-reputation')).toContainText(roll === 20 ? '10' : '-5');
  });
}

test('refresh clears transient dialogue and reputation state', async ({ page }) => {
  await page.goto('/?testPosition=oracle&testRoll=20');
  await expect(page.getByTestId('oracle-prompt')).toBeVisible();
  await page.keyboard.press('KeyE');
  await page.getByTestId('dialogue-choice-persuade-oracle').click();
  await expect(page.getByTestId('faction-reputation')).toContainText('10');
  await page.reload();
  await expect(page.getByTestId('dialogue-overlay')).toBeHidden();
  await expect(page.getByTestId('oracle-prompt')).toBeVisible();
  await page.keyboard.press('KeyE');
  await expect(page.getByTestId('faction-reputation')).toContainText('0');
});
