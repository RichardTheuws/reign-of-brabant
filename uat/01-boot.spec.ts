import { expect, test } from '@playwright/test';
import { attachConsoleGuard } from './helpers/console-guard';

test.describe('UAT-01 boot & main menu', () => {
  test('game route loads, canvas + menu render, no console errors', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await page.goto('/play/');

    await expect(page.locator('#game-canvas')).toBeVisible();
    await expect(page.locator('#main-menu')).toBeVisible();
    await expect(page.locator('#btn-play')).toBeVisible();
    await expect(page.locator('#btn-campaign')).toBeVisible();
    await expect(page.locator('#btn-settings')).toBeVisible();

    const ready = await page.evaluate(() => {
      const c = document.getElementById('game-canvas') as HTMLCanvasElement | null;
      return !!c && c.width > 0 && c.height > 0;
    });
    expect(ready).toBe(true);

    guard.fail();
  });
});
