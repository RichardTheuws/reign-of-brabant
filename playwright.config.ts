import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './uat',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL: 'http://localhost:5273',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Dedicated UAT port (5273), never the default 5173 — other game projects
    // (e.g. Cosmo) often hold 5173, and reuseExistingServer would then test the
    // WRONG app and false-fail the deploy gate. Always start a fresh RoB server.
    command: 'npm run dev -- --port 5273',
    url: 'http://localhost:5273',
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
