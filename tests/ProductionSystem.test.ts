import { describe, it, expect, beforeEach } from 'vitest';
import { playerState } from '../src/core/PlayerState';
import {
  FactionId,
  UnitTypeId,
  NO_PRODUCTION,
  MAX_QUEUE_SLOTS,
  BUREAUCRACY_BASE_MULTIPLIER,
  BUREAUCRACY_STACK_BONUS,
  BUREAUCRACY_MAX_STACKS,
  CARRY_CAPACITY,
} from '../src/types/index';

// ---------------------------------------------------------------------------
// Production queue logic (pure function extraction)
// ---------------------------------------------------------------------------

/**
 * Simulate the queue shift operation from ProductionSystem.
 * Returns the new active unitType and the updated queue.
 */
function shiftQueue(
  activeUnitType: number,
  queue: number[],
): { activeUnitType: number; queue: number[] } {
  const nextType = queue[0];

  if (nextType !== NO_PRODUCTION) {
    const newQueue = [...queue.slice(1), NO_PRODUCTION];
    return { activeUnitType: nextType, queue: newQueue };
  } else {
    return { activeUnitType: NO_PRODUCTION, queue: queue.map(() => NO_PRODUCTION) };
  }
}

/**
 * Simulate adding a unit to the production queue.
 * Returns whether the enqueue succeeded and the updated state.
 */
function enqueueUnit(
  activeUnitType: number,
  queue: number[],
  unitTypeId: number,
): { success: boolean; activeUnitType: number; queue: number[] } {
  // If nothing is currently being produced, start immediately
  if (activeUnitType === NO_PRODUCTION) {
    return { success: true, activeUnitType: unitTypeId, queue: [...queue] };
  }

  // Find first empty slot in queue
  const emptyIndex = queue.indexOf(NO_PRODUCTION);
  if (emptyIndex === -1) {
    return { success: false, activeUnitType, queue: [...queue] };
  }

  const newQueue = [...queue];
  newQueue[emptyIndex] = unitTypeId;
  return { success: true, activeUnitType, queue: newQueue };
}

describe('ProductionSystem — Queue Management', () => {
  describe('shiftQueue', () => {
    it('promotes queue[0] to active when queue has items', () => {
      const result = shiftQueue(UnitTypeId.Worker, [
        UnitTypeId.Infantry,
        NO_PRODUCTION,
        NO_PRODUCTION,
        NO_PRODUCTION,
        NO_PRODUCTION,
      ]);
      expect(result.activeUnitType).toBe(UnitTypeId.Infantry);
    });

    it('shifts remaining items down by one slot', () => {
      const result = shiftQueue(UnitTypeId.Worker, [
        UnitTypeId.Infantry,
        UnitTypeId.Ranged,
        NO_PRODUCTION,
        NO_PRODUCTION,
        NO_PRODUCTION,
      ]);
      expect(result.queue[0]).toBe(UnitTypeId.Ranged);
      expect(result.queue[1]).toBe(NO_PRODUCTION);
    });

    it('stops production when queue is empty', () => {
      const emptyQueue = Array(5).fill(NO_PRODUCTION);
      const result = shiftQueue(UnitTypeId.Worker, emptyQueue);
      expect(result.activeUnitType).toBe(NO_PRODUCTION);
    });

    it('handles full queue shift correctly', () => {
      const result = shiftQueue(UnitTypeId.Worker, [
        UnitTypeId.Infantry,
        UnitTypeId.Ranged,
        UnitTypeId.Worker,
        UnitTypeId.Infantry,
        UnitTypeId.Ranged,
      ]);
      expect(result.activeUnitType).toBe(UnitTypeId.Infantry);
      expect(result.queue).toEqual([
        UnitTypeId.Ranged,
        UnitTypeId.Worker,
        UnitTypeId.Infantry,
        UnitTypeId.Ranged,
        NO_PRODUCTION,
      ]);
    });

    it('last slot is always NO_PRODUCTION after shift', () => {
      const result = shiftQueue(UnitTypeId.Worker, [
        UnitTypeId.Infantry,
        UnitTypeId.Ranged,
        UnitTypeId.Worker,
        UnitTypeId.Infantry,
        UnitTypeId.Ranged,
      ]);
      expect(result.queue[4]).toBe(NO_PRODUCTION);
    });
  });

  describe('enqueueUnit', () => {
    it('starts production immediately when idle', () => {
      const emptyQueue = Array(5).fill(NO_PRODUCTION);
      const result = enqueueUnit(NO_PRODUCTION, emptyQueue, UnitTypeId.Infantry);
      expect(result.success).toBe(true);
      expect(result.activeUnitType).toBe(UnitTypeId.Infantry);
    });

    it('adds to first empty queue slot when producing', () => {
      const queue = [NO_PRODUCTION, NO_PRODUCTION, NO_PRODUCTION, NO_PRODUCTION, NO_PRODUCTION];
      const result = enqueueUnit(UnitTypeId.Worker, queue, UnitTypeId.Infantry);
      expect(result.success).toBe(true);
      expect(result.queue[0]).toBe(UnitTypeId.Infantry);
    });

    it('fails when queue is full', () => {
      const fullQueue = [
        UnitTypeId.Infantry,
        UnitTypeId.Ranged,
        UnitTypeId.Worker,
        UnitTypeId.Infantry,
        UnitTypeId.Ranged,
      ];
      const result = enqueueUnit(UnitTypeId.Worker, fullQueue, UnitTypeId.Infantry);
      expect(result.success).toBe(false);
    });

    it('fills queue slots sequentially', () => {
      let queue = Array(5).fill(NO_PRODUCTION);
      let active = UnitTypeId.Worker;

      // Enqueue 3 infantry
      for (let i = 0; i < 3; i++) {
        const result = enqueueUnit(active, queue, UnitTypeId.Infantry);
        expect(result.success).toBe(true);
        active = result.activeUnitType;
        queue = result.queue;
      }

      expect(queue[0]).toBe(UnitTypeId.Infantry);
      expect(queue[1]).toBe(UnitTypeId.Infantry);
      expect(queue[2]).toBe(UnitTypeId.Infantry);
      expect(queue[3]).toBe(NO_PRODUCTION);
      expect(queue[4]).toBe(NO_PRODUCTION);
    });
  });
});

describe('ProductionSystem — Resource Costs', () => {
  beforeEach(() => {
    playerState.reset();
  });

  it('player starts with 100 gold (enough for a worker)', () => {
    expect(playerState.getGold(FactionId.Brabanders)).toBe(100);
  });

  it('spending gold reduces balance correctly', () => {
    const workerCost = 50;
    playerState.spend(FactionId.Brabanders, workerCost);
    expect(playerState.getGold(FactionId.Brabanders)).toBe(50);
  });

  it('cannot spend more gold than available', () => {
    const result = playerState.spend(FactionId.Brabanders, 200);
    expect(result).toBe(false);
    expect(playerState.getGold(FactionId.Brabanders)).toBe(100);
  });

  it('multiple unit purchases deplete gold correctly', () => {
    playerState.spend(FactionId.Brabanders, 40); // worker
    playerState.spend(FactionId.Brabanders, 40); // worker
    expect(playerState.getGold(FactionId.Brabanders)).toBe(20);
    expect(playerState.canAfford(FactionId.Brabanders, 40)).toBe(false);
  });

  it('0 cost is always affordable', () => {
    expect(playerState.canAfford(FactionId.Brabanders, 0)).toBe(true);
  });

  it('exact gold amount is affordable', () => {
    expect(playerState.canAfford(FactionId.Brabanders, 100)).toBe(true);
  });
});

describe('ProductionSystem — Population Cap', () => {
  beforeEach(() => {
    playerState.reset();
  });

  it('default population max is 10', () => {
    expect(playerState.getPopulationMax(FactionId.Brabanders)).toBe(10);
  });

  it('training unit increases population', () => {
    playerState.addPopulation(FactionId.Brabanders);
    expect(playerState.getPopulation(FactionId.Brabanders)).toBe(1);
  });

  it('population room check with default max', () => {
    for (let i = 0; i < 10; i++) {
      expect(playerState.hasPopulationRoom(FactionId.Brabanders)).toBe(true);
      playerState.addPopulation(FactionId.Brabanders);
    }
    expect(playerState.hasPopulationRoom(FactionId.Brabanders)).toBe(false);
  });

  it('housing increases population cap', () => {
    playerState.addPopulationCapacity(FactionId.Brabanders, 5);
    expect(playerState.getPopulationMax(FactionId.Brabanders)).toBe(15);
  });

  it('unit death frees population room', () => {
    for (let i = 0; i < 10; i++) {
      playerState.addPopulation(FactionId.Brabanders);
    }
    expect(playerState.hasPopulationRoom(FactionId.Brabanders)).toBe(false);

    playerState.removePopulation(FactionId.Brabanders);
    expect(playerState.hasPopulationRoom(FactionId.Brabanders)).toBe(true);
  });

  it('population cannot go below 0', () => {
    playerState.removePopulation(FactionId.Brabanders, 10);
    expect(playerState.getPopulation(FactionId.Brabanders)).toBe(0);
  });
});

describe('ProductionSystem — Bureaucracy Modifier (Randstad)', () => {
  beforeEach(() => {
    playerState.reset();
  });

  it('non-Randstad factions have modifier 1.0', () => {
    expect(playerState.getBureaucracyModifier(FactionId.Brabanders)).toBe(1.0);
    expect(playerState.getBureaucracyModifier(FactionId.Limburgers)).toBe(1.0);
    expect(playerState.getBureaucracyModifier(FactionId.Belgen)).toBe(1.0);
  });

  it('Randstad base modifier is BUREAUCRACY_BASE_MULTIPLIER (1.2)', () => {
    expect(playerState.getBureaucracyModifier(FactionId.Randstad)).toBe(BUREAUCRACY_BASE_MULTIPLIER);
  });

  it('each efficiency stack reduces modifier by BUREAUCRACY_STACK_BONUS', () => {
    playerState.addEfficiencyStack(FactionId.Randstad);
    const expected = BUREAUCRACY_BASE_MULTIPLIER - BUREAUCRACY_STACK_BONUS;
    expect(playerState.getBureaucracyModifier(FactionId.Randstad)).toBeCloseTo(expected);
  });

  it('10 efficiency stacks reduce modifier significantly', () => {
    for (let i = 0; i < 10; i++) {
      playerState.addEfficiencyStack(FactionId.Randstad);
    }
    const expected = BUREAUCRACY_BASE_MULTIPLIER - 10 * BUREAUCRACY_STACK_BONUS;
    expect(playerState.getBureaucracyModifier(FactionId.Randstad)).toBeCloseTo(expected);
  });

  it('efficiency stacks cap at BUREAUCRACY_MAX_STACKS', () => {
    for (let i = 0; i < BUREAUCRACY_MAX_STACKS + 5; i++) {
      playerState.addEfficiencyStack(FactionId.Randstad);
    }
    expect(playerState.getEfficiencyStacks(FactionId.Randstad)).toBe(BUREAUCRACY_MAX_STACKS);
  });

  it('max stacks produce the fastest modifier', () => {
    for (let i = 0; i < BUREAUCRACY_MAX_STACKS; i++) {
      playerState.addEfficiencyStack(FactionId.Randstad);
    }
    const expected = BUREAUCRACY_BASE_MULTIPLIER - BUREAUCRACY_MAX_STACKS * BUREAUCRACY_STACK_BONUS;
    expect(playerState.getBureaucracyModifier(FactionId.Randstad)).toBeCloseTo(expected);
  });
});

describe('ProductionSystem — Faction Unit Templates', () => {
  it('MAX_QUEUE_SLOTS is 5', () => {
    expect(MAX_QUEUE_SLOTS).toBe(5);
  });

  it('NO_PRODUCTION sentinel is 255 (u8 max)', () => {
    expect(NO_PRODUCTION).toBe(0xFF);
  });

  it('CARRY_CAPACITY default is 10', () => {
    expect(CARRY_CAPACITY).toBe(10);
  });

  it('UnitTypeId.Worker is 0', () => {
    expect(UnitTypeId.Worker).toBe(0);
  });

  it('UnitTypeId.Infantry is 1', () => {
    expect(UnitTypeId.Infantry).toBe(1);
  });

  it('UnitTypeId.Ranged is 2', () => {
    expect(UnitTypeId.Ranged).toBe(2);
  });
});

describe('ProductionSystem — Production Progress', () => {
  it('progress increments correctly for given dt and duration', () => {
    const duration = 18; // infantry build time
    const dt = 1.0; // 1 second
    let progress = 0;

    progress += dt / duration;
    expect(progress).toBeCloseTo(1 / 18);
  });

  it('production completes when progress >= 1.0', () => {
    const duration = 12; // worker build time
    let progress = 0;

    // Simulate 12 seconds of 1s ticks
    for (let i = 0; i < 12; i++) {
      progress += 1.0 / duration;
    }
    expect(progress).toBeGreaterThanOrEqual(1.0);
  });

  it('bureaucracy modifier slows production for Randstad', () => {
    const baseDuration = 18;
    const bureaucracyMod = BUREAUCRACY_BASE_MULTIPLIER; // 1.2
    const effectiveDuration = baseDuration * bureaucracyMod;
    expect(effectiveDuration).toBeCloseTo(21.6);

    // It takes longer to produce
    const progressPerSecond = 1.0 / effectiveDuration;
    const baseProgressPerSecond = 1.0 / baseDuration;
    expect(progressPerSecond).toBeLessThan(baseProgressPerSecond);
  });

  it('CEO buff speeds up production (0.667 duration multiplier)', () => {
    const baseDuration = 18;
    const ceoBuff = 0.667;
    const effectiveDuration = baseDuration * ceoBuff;
    expect(effectiveDuration).toBeCloseTo(12.006);

    // Faster progress per second
    const progressPerSecond = 1.0 / effectiveDuration;
    const baseProgressPerSecond = 1.0 / baseDuration;
    expect(progressPerSecond).toBeGreaterThan(baseProgressPerSecond);
  });

  it('bureaucracy + CEO buff combined', () => {
    const baseDuration = 18;
    const bureaucracyMod = BUREAUCRACY_BASE_MULTIPLIER; // 1.2
    const ceoBuff = 0.667;
    const effectiveDuration = baseDuration * bureaucracyMod * ceoBuff;
    // 18 * 1.2 * 0.667 = 14.4072
    expect(effectiveDuration).toBeCloseTo(14.4072);
  });
});
