import { expect, test } from '@playwright/test';
import { attachConsoleGuard } from './helpers/console-guard';

test.describe('UAT-02 skirmish quickstart', () => {
  test('main menu → faction select → in-game without console errors', async ({ page }) => {
    test.setTimeout(90_000);
    const guard = attachConsoleGuard(page);

    await page.goto('/play/');
    await expect(page.locator('#main-menu')).toBeVisible();

    // 1. Click "Speel" — opens faction select
    await page.click('#btn-play');
    await expect(page.locator('#faction-select')).toBeVisible();

    // 2. Pick Brabanders (default)
    await page.click('#faction-card-brabanders');

    // 3. Confirm — starts skirmish
    const confirm = page.locator('#faction-confirm-btn');
    await expect(confirm).toBeEnabled();
    await confirm.click();

    // 4. Wait until the state machine reaches PLAYING.
    //    GameStateId.PLAYING = 'playing' (string enum).
    await page.waitForFunction(
      () => {
        const w = window as { __rob?: { stateMachine?: { currentId?: string | null } } };
        return w.__rob?.stateMachine?.currentId === 'PLAYING';
      },
      { timeout: 60_000 },
    );

    // 5. Hook integrity: game + eventBus + stateMachine all present.
    const hookOk = await page.evaluate(() => {
      const w = window as { __rob?: { game?: unknown; eventBus?: unknown; stateMachine?: unknown } };
      return !!w.__rob && !!w.__rob.game && !!w.__rob.eventBus && !!w.__rob.stateMachine;
    });
    expect(hookOk).toBe(true);

    guard.fail();
  });
});
