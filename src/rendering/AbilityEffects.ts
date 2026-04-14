/**
 * AbilityEffects.ts
 * Maps hero ability IDs to visual particle effects.
 * Listens to EventBus events and spawns appropriate effects via ParticleSystem.
 */

import { eventBus } from '../core/EventBus';
import { Position, Movement, UnitAI } from '../ecs/components';
import { FactionId, NO_ENTITY } from '../types/index';
import { audioManager } from '../audio/AudioManager';
import type { ParticleSystem } from './ParticleSystem';
import type { RTSCamera } from '../camera/RTSCamera';

// Faction ability colours (hex)
const FACTION_ABILITY_COLORS: Record<number, number> = {
  [FactionId.Brabanders]: 0xe67e22, // warm orange
  [FactionId.Randstad]: 0x4da6ff,   // corporate blue
  [FactionId.Limburgers]: 0x44cc44, // emerald green
  [FactionId.Belgen]: 0xff4060,     // crimson red
};

// Ability-specific colour overrides
const ABILITY_COLORS: Record<string, number> = {
  'boer-mestverspreider': 0x6b4423,    // brown manure
  'maasridder-maasvloed': 0x2288cc,    // water blue
  'maasridder-nevelgordijn': 0x999999, // grey fog
  'maasridder-watergraf': 0x2266aa,    // dark water
  'frietkoning-koninklijke-portie': 0xffcc00, // golden
  'frietkoning-frituurfondue': 0xff8800,      // frying oil
  'abdijbrouwer-trappistenzegen': 0xdaa520,   // golden blessing
  'abdijbrouwer-stiltegelofte': 0x8844aa,     // purple silence
};

// Ability effect type classification
type EffectType = 'aoe-buff' | 'aoe-damage' | 'aoe-stun' | 'aoe-heal'
  | 'cone' | 'line' | 'teleport' | 'summon' | 'single-target' | 'map-wide';

interface AbilityEffectDef {
  type: EffectType;
  radius?: number;
  range?: number;
  halfAngle?: number;
  shakeIntensity?: number;
}

const ABILITY_EFFECTS: Record<string, AbilityEffectDef> = {
  // Prins van Brabant
  'prins-toespraak':    { type: 'aoe-buff', radius: 12 },
  'prins-dans':         { type: 'aoe-stun', radius: 8, shakeIntensity: 0.3 },
  'prins-alaaf':        { type: 'map-wide', shakeIntensity: 0.4 },

  // Boer van Brabant
  'boer-mestverspreider': { type: 'cone', range: 10, halfAngle: Math.PI / 6 },
  'boer-opstand':         { type: 'summon' },
  'boer-tractorcharge':   { type: 'line', range: 25, shakeIntensity: 0.5 },

  // De CEO
  'ceo-kwartaalcijfers':     { type: 'aoe-buff', radius: 15 },
  'ceo-goldenhandshake':     { type: 'single-target', shakeIntensity: 0.2 },
  'ceo-vijandige-overname':  { type: 'single-target' },

  // De Politicus
  'politicus-verkiezingsbelofte': { type: 'aoe-buff', radius: 10 },
  'politicus-lobby':              { type: 'single-target' },
  'politicus-kamerdebat':         { type: 'aoe-stun', radius: 20, shakeIntensity: 0.4 },

  // De Mijnbaas
  'mijnbaas-mijnschacht-instorten': { type: 'aoe-damage', radius: 8, shakeIntensity: 0.6 },
  'mijnbaas-gluck-auf':             { type: 'aoe-buff', radius: 12 },
  'mijnbaas-tunnelcommando':        { type: 'teleport' },

  // De Maasridder
  'maasridder-maasvloed':     { type: 'line', range: 20, shakeIntensity: 0.3 },
  'maasridder-nevelgordijn':  { type: 'aoe-buff', radius: 10 },
  'maasridder-watergraf':     { type: 'aoe-stun', radius: 5, shakeIntensity: 0.3 },

  // De Frietkoning
  'frietkoning-koninklijke-portie': { type: 'aoe-heal', radius: 10 },
  'frietkoning-belgisch-decreet':   { type: 'single-target' },
  'frietkoning-frituurfondue':      { type: 'aoe-damage', radius: 6, shakeIntensity: 0.3 },

  // De Abdijbrouwer
  'abdijbrouwer-stiltegelofte':     { type: 'single-target' },
  'abdijbrouwer-trappistenzegen':   { type: 'aoe-heal', radius: 8 },
  'abdijbrouwer-dubbel-of-tripel':  { type: 'summon' },
};

/**
 * Initialize ability visual effects.
 * Call once during game setup, after ParticleSystem and Camera are ready.
 */
export function initAbilityEffects(
  particles: ParticleSystem,
  camera: RTSCamera,
): void {
  eventBus.on('hero-ability-used', (event: {
    entityId: number;
    factionId: FactionId;
    heroTypeId: number;
    abilityId: string;
    abilitySlot: number;
  }) => {
    const def = ABILITY_EFFECTS[event.abilityId];
    if (!def) return;

    const hx = Position.x[event.entityId];
    const hz = Position.z[event.entityId];
    const hy = (Position.y?.[event.entityId] ?? 0) + 1.0;

    const color = ABILITY_COLORS[event.abilityId]
      ?? FACTION_ABILITY_COLORS[event.factionId]
      ?? 0xffffff;

    switch (def.type) {
      case 'aoe-buff':
        particles.spawnAbilityBurst(hx, hy, hz, color, def.radius ?? 8);
        particles.spawnBuffAura(hx, hy, hz, color, (def.radius ?? 8) * 0.5);
        break;

      case 'aoe-damage':
        particles.spawnAbilityBurst(hx, hy, hz, color, def.radius ?? 8);
        if (def.shakeIntensity) camera.shake(def.shakeIntensity, 0.4);
        break;

      case 'aoe-stun':
        particles.spawnAbilityBurst(hx, hy, hz, color, def.radius ?? 8);
        particles.spawnStunStars(hx, hy, hz);
        if (def.shakeIntensity) camera.shake(def.shakeIntensity, 0.3);
        break;

      case 'aoe-heal':
        particles.spawnAbilityBurst(hx, hy, hz, color, def.radius ?? 8);
        particles.spawnHealEffect(hx, hy, hz);
        break;

      case 'cone': {
        const facing = Math.atan2(
          Movement.targetZ[event.entityId] - hz,
          Movement.targetX[event.entityId] - hx,
        );
        particles.spawnConeEffect(
          hx, hy, hz,
          facing,
          def.halfAngle ?? Math.PI / 6,
          def.range ?? 10,
          color,
        );
        break;
      }

      case 'line': {
        const facing2 = Math.atan2(
          Movement.targetZ[event.entityId] - hz,
          Movement.targetX[event.entityId] - hx,
        );
        const endX = hx + Math.cos(facing2) * (def.range ?? 20);
        const endZ = hz + Math.sin(facing2) * (def.range ?? 20);
        particles.spawnLineTrail(hx, hy, hz, endX, endZ, color);
        if (def.shakeIntensity) camera.shake(def.shakeIntensity, 0.4);
        break;
      }

      case 'teleport': {
        // Flash at origin
        particles.spawnTeleportFlash(hx, hy, hz, color);
        // Flash at destination (if target exists)
        const targetEid = UnitAI.targetEid[event.entityId];
        if (targetEid !== NO_ENTITY) {
          const tx = Position.x[targetEid];
          const tz = Position.z[targetEid];
          particles.spawnTeleportFlash(tx, hy, tz, color);
        }
        camera.shake(0.3, 0.3);
        break;
      }

      case 'summon':
        particles.spawnAbilityBurst(hx, hy, hz, color, 4);
        break;

      case 'map-wide':
        // Large expanding ring for map-wide abilities
        particles.spawnAbilityBurst(hx, hy, hz, color, 15);
        if (def.shakeIntensity) camera.shake(def.shakeIntensity, 0.5);
        break;

      case 'single-target':
        particles.spawnAbilityBurst(hx, hy, hz, color, 3);
        if (def.shakeIntensity) camera.shake(def.shakeIntensity, 0.2);
        break;
    }
  });

  // Heal effect on support unit heal ticks
  eventBus.on('unit-healed', (event: {
    healerEid: number;
    targetEid: number;
    amount: number;
    x: number;
    z: number;
  }) => {
    particles.spawnHealEffect(event.x, 1.0, event.z);
    audioManager.playSound('heal_tick', { x: event.x, z: event.z });
  });
}
