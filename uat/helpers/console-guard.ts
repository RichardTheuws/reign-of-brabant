import type { ConsoleMessage, Page } from '@playwright/test';

const ALLOWED_PATTERNS: RegExp[] = [
  /favicon/i,
  /vite.*hmr/i,
  /three\.module.*WebGL.*deprecation/i,
  /umami/i,
];

export interface ConsoleErrorCollector {
  errors: string[];
  fail(): void;
}

export function attachConsoleGuard(page: Page): ConsoleErrorCollector {
  const errors: string[] = [];
  const onMessage = (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (ALLOWED_PATTERNS.some((re) => re.test(text))) return;
    errors.push(text);
  };
  const onPageError = (err: Error) => {
    errors.push(`pageerror: ${err.message}`);
  };
  page.on('console', onMessage);
  page.on('pageerror', onPageError);
  return {
    errors,
    fail() {
      if (errors.length === 0) return;
      throw new Error(
        `Console errors detected (${errors.length}):\n` + errors.map((e, i) => `  [${i + 1}] ${e}`).join('\n'),
      );
    },
  };
}
