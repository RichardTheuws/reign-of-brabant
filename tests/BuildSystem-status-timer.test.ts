/**
 * BuildSystem-status-timer.test.ts
 *
 * Locks the construction-timer text used in the building card status string.
 * The training-units already render `(Xs)` (see Game.ts buildBuildingCardData
 * for `Training X (12s)`); this aligns the under-construction status to the
 * same convention so players can read remaining build-time at a glance.
 *
 * Backlog entry (P2): "Construction-timer in `Building.status` text '(15s)'
 * zoals trainings-units".
 *
 * The helper under test (`formatConstructionStatus`) is intentionally pure
 * (no ECS reads) so the timer-text behaviour can be locked without booting
 * the full Game class.
 */
import { describe, it, expect } from 'vitest';
import { formatConstructionStatus } from '../src/systems/BuildSystem';

describe('formatConstructionStatus — building card timer text', () => {
  it('appends `(Xs)` suffix while building is under construction', () => {
    // 30s total build time, 0% progress -> 30 seconds remaining.
    const status = formatConstructionStatus(0, 30, 0);
    expect(status).toBe('Under construction (30s)');
  });

  it('renders the "(15s)" example from the backlog entry verbatim', () => {
    // 30s total, halfway through -> 15 seconds remaining.
    const status = formatConstructionStatus(15, 30, 0);
    expect(status).toBe('Under construction (15s)');
  });

  it('uses Math.ceil so partial seconds round up (matches training format)', () => {
    // 14.2s remaining -> "(15s)" — same convention as Training X (Xs).
    const status = formatConstructionStatus(15.8, 30, 0);
    expect(status).toBe('Under construction (15s)');
  });

  it('returns null when the building is complete (no `(Xs)` suffix)', () => {
    // Caller (Game.ts) decides Idle / Training / etc. when complete=1.
    const status = formatConstructionStatus(30, 30, 1);
    expect(status).toBeNull();
  });

  it('omits the timer suffix when remaining time is zero or below', () => {
    // Edge case: progress reached maxProgress but the system has not yet
    // flipped complete=1 in the same tick — show plain "Under construction".
    const status = formatConstructionStatus(30, 30, 0);
    expect(status).toBe('Under construction');
    expect(status).not.toContain('(');
  });

  it('falls back to plain text when maxProgress is invalid (defensive)', () => {
    // maxProgress<=0 is treated as "no timer info" — same defensive guard
    // as createBuildSystem (skips entities with maxProgress<=0).
    expect(formatConstructionStatus(0, 0, 0)).toBe('Under construction');
    expect(formatConstructionStatus(0, -5, 0)).toBe('Under construction');
  });

  it('treats a destroyed/post-complete building (complete=1) as no timer', () => {
    // If a destroyed building is somehow re-inspected, complete=1 still
    // wins -> null (caller renders idle / dead state). Matches DESTROYED
    // requirement in the backlog acceptance criteria.
    expect(formatConstructionStatus(0, 30, 1)).toBeNull();
    expect(formatConstructionStatus(15, 30, 1)).toBeNull();
  });
});
