/**
 * ParticleSystem.ts
 * GPU-efficient particle effects for game events (gathering, construction,
 * combat, death, abilities). All particles live in a single THREE.Points
 * object backed by a shared pool of 500 slots — one draw call total.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PARTICLES = 500;

/** Gravity applied to dust-type particles (units/s^2, downward). */
const DUST_GRAVITY = -0.5;

// -- Gold Sparkle (gathering) -----------------------------------------------
const GOLD_SPARKLE_MIN = 8;
const GOLD_SPARKLE_MAX = 12;
const GOLD_SPARKLE_COLORS: [number, number, number][] = [
  [0.94, 0.82, 0.38], // #f0d060
  [1.0, 0.6, 0.2],    // #ff9933
];
const GOLD_SPARKLE_VY_MIN = 1.5;
const GOLD_SPARKLE_VY_MAX = 2.5;
const GOLD_SPARKLE_DRIFT = 0.4;
const GOLD_SPARKLE_SIZE_MIN = 0.15;
const GOLD_SPARKLE_SIZE_MAX = 0.25;
const GOLD_SPARKLE_LIFE_MIN = 0.5;
const GOLD_SPARKLE_LIFE_MAX = 0.8;

// -- Construction Dust ------------------------------------------------------
const DUST_MIN = 15;
const DUST_MAX = 20;
const DUST_COLORS: [number, number, number][] = [
  [0.545, 0.451, 0.333], // #8b7355
  [0.769, 0.663, 0.412], // #c4a968
];
const DUST_VY_MIN = 0.5;
const DUST_VY_MAX = 1.0;
const DUST_SPREAD = 1.0;
const DUST_SIZE_MIN = 0.2;
const DUST_SIZE_MAX = 0.4;
const DUST_LIFE_MIN = 0.8;
const DUST_LIFE_MAX = 1.2;

// -- Combat Hit (melee) -----------------------------------------------------
const MELEE_HIT_MIN = 6;
const MELEE_HIT_MAX = 10;
const MELEE_HIT_COLORS: [number, number, number][] = [
  [1.0, 0.267, 0.0],   // #ff4400
  [1.0, 0.667, 0.0],   // #ffaa00
];
const MELEE_HIT_SPEED_MIN = 3.0;
const MELEE_HIT_SPEED_MAX = 5.0;
const MELEE_HIT_SIZE_MIN = 0.1;
const MELEE_HIT_SIZE_MAX = 0.15;
const MELEE_HIT_LIFE_MIN = 0.2;
const MELEE_HIT_LIFE_MAX = 0.4;

// -- Combat Hit (ranged) ----------------------------------------------------
const RANGED_HIT_MIN = 4;
const RANGED_HIT_MAX = 6;
const RANGED_HIT_COLORS: [number, number, number][] = [
  [0.667, 0.8, 1.0],   // #aaccff
  [1.0, 1.0, 1.0],     // #ffffff
];
const RANGED_HIT_LIFE_MIN = 0.15;
const RANGED_HIT_LIFE_MAX = 0.3;

// -- Death Effect -----------------------------------------------------------
const DEATH_MIN = 20;
const DEATH_MAX = 30;
const DEATH_SMOKE_COLOR: [number, number, number] = [0.2, 0.2, 0.2]; // #333333
const DEATH_SPEED = 2.0;
const DEATH_VY = 0.8;
const DEATH_SIZE_MIN = 0.2;
const DEATH_SIZE_MAX = 0.35;
const DEATH_LIFE_MIN = 1.0;
const DEATH_LIFE_MAX = 1.5;

// -- Building Destruction ---------------------------------------------------
const DESTRUCTION_MIN = 35;
const DESTRUCTION_MAX = 50;
const DESTRUCTION_DEBRIS_COLORS: [number, number, number][] = [
  [0.545, 0.380, 0.220], // #8b6138 dark wood
  [0.420, 0.420, 0.420], // #6b6b6b stone grey
  [0.200, 0.150, 0.100], // #33261a dark debris
];
const DESTRUCTION_FIRE_COLORS: [number, number, number][] = [
  [1.0, 0.400, 0.0],     // #ff6600 bright fire
  [1.0, 0.200, 0.0],     // #ff3300 deep fire
  [1.0, 0.667, 0.0],     // #ffaa00 golden flame
];
const DESTRUCTION_SPEED_MIN = 1.5;
const DESTRUCTION_SPEED_MAX = 4.0;
const DESTRUCTION_VY_MIN = 2.0;
const DESTRUCTION_VY_MAX = 5.0;
const DESTRUCTION_SIZE_MIN = 0.25;
const DESTRUCTION_SIZE_MAX = 0.55;
const DESTRUCTION_LIFE_MIN = 1.2;
const DESTRUCTION_LIFE_MAX = 2.0;

// -- Heal Effect ------------------------------------------------------------
const HEAL_COUNT = 12;
const HEAL_COLOR: [number, number, number] = [0.2, 1.0, 0.3]; // bright green
const HEAL_VY_MIN = 1.0;
const HEAL_VY_MAX = 2.0;
const HEAL_DRIFT = 0.3;
const HEAL_SIZE = 0.2;
const HEAL_LIFE_MIN = 0.6;
const HEAL_LIFE_MAX = 1.0;

// -- Buff Aura --------------------------------------------------------------
const BUFF_COUNT = 20;
const BUFF_ORBIT_SPEED = 3.0;
const BUFF_SIZE = 0.18;
const BUFF_LIFE_MIN = 1.0;
const BUFF_LIFE_MAX = 1.5;

// -- Stun Stars -------------------------------------------------------------
const STUN_COUNT = 6;
const STUN_COLOR: [number, number, number] = [1.0, 1.0, 0.3]; // yellow stars
const STUN_SIZE = 0.22;
const STUN_LIFE = 1.2;

// -- Ability Burst ----------------------------------------------------------
const ABILITY_COUNT = 40;
const ABILITY_EXPAND_SPEED = 2.0;
const ABILITY_VY = 0.3;
const ABILITY_SIZE_MIN = 0.3;
const ABILITY_SIZE_MAX = 0.5;
const ABILITY_LIFE_MIN = 1.5;
const ABILITY_LIFE_MAX = 2.0;

// ---------------------------------------------------------------------------
// Particle type enum
// ---------------------------------------------------------------------------

const enum ParticleType {
  None = 0,
  GoldSparkle = 1,
  ConstructionDust = 2,
  CombatMelee = 3,
  CombatRanged = 4,
  Death = 5,
  Ability = 6,
}

// ---------------------------------------------------------------------------
// Particle metadata (parallel to BufferGeometry arrays)
// ---------------------------------------------------------------------------

interface ParticleMeta {
  alive: boolean;
  type: ParticleType;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  baseSize: number;
  /** Whether this particle type is affected by dust-gravity. */
  hasGravity: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Random float in [min, max). */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Random integer in [min, max] (inclusive). */
function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

/** Linearly interpolate between two RGB triples. */
function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** Convert a hex color number (0xRRGGBB) to normalised RGB triple. */
function hexToRgb(hex: number): [number, number, number] {
  return [
    ((hex >> 16) & 0xff) / 255,
    ((hex >> 8) & 0xff) / 255,
    (hex & 0xff) / 255,
  ];
}

// ---------------------------------------------------------------------------
// ParticleSystem
// ---------------------------------------------------------------------------

export class ParticleSystem {
  private readonly scene: THREE.Scene;
  private readonly points: THREE.Points;
  private readonly geometry: THREE.BufferGeometry;
  private readonly posAttr: THREE.BufferAttribute;
  private readonly colorAttr: THREE.BufferAttribute;
  private readonly sizeAttr: THREE.BufferAttribute;
  private readonly meta: ParticleMeta[];

  // Pre-allocated typed arrays
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly sizes: Float32Array;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Allocate flat arrays
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);

    // Initialise metadata
    this.meta = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.meta.push({
        alive: false,
        type: ParticleType.None,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        baseSize: 0,
        hasGravity: false,
      });
      // Park dead particles far below the scene so they are invisible
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -9999;
      this.positions[i * 3 + 2] = 0;
      this.sizes[i] = 0;
    }

    // BufferGeometry
    this.geometry = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.positions, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.colorAttr = new THREE.BufferAttribute(this.colors, 3);
    this.colorAttr.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr = new THREE.BufferAttribute(this.sizes, 1);
    this.sizeAttr.setUsage(THREE.DynamicDrawUsage);

    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('color', this.colorAttr);
    this.geometry.setAttribute('size', this.sizeAttr);

    // PointsMaterial — additive blending for a glow look
    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false; // particles span the whole map
    this.scene.add(this.points);
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Advance all alive particles by `dt` seconds. */
  update(dt: number): void {
    let needsUpdate = false;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const m = this.meta[i];
      if (!m.alive) continue;
      needsUpdate = true;

      // Tick lifetime
      m.life -= dt;
      if (m.life <= 0) {
        this.kill(i);
        continue;
      }

      const i3 = i * 3;

      // Apply velocity
      this.positions[i3] += m.vx * dt;
      this.positions[i3 + 1] += m.vy * dt;
      this.positions[i3 + 2] += m.vz * dt;

      // Apply gravity for dust-type particles
      if (m.hasGravity) {
        m.vy += DUST_GRAVITY * dt;
      }

      // Life ratio: 1 = just spawned, 0 = about to die
      const lifeRatio = m.life / m.maxLife;

      // Fade out in last 30% of life
      const fadeThreshold = 0.3;
      const alpha = lifeRatio < fadeThreshold ? lifeRatio / fadeThreshold : 1.0;

      // Shrink as particle ages
      this.sizes[i] = m.baseSize * alpha;

      // Dim colour by alpha (since PointsMaterial does not support per-vertex alpha,
      // we modulate the vertex colour towards black to simulate fade)
      this.colors[i3] *= alpha > 0 ? Math.pow(alpha, 0.15) : 0;
      this.colors[i3 + 1] *= alpha > 0 ? Math.pow(alpha, 0.15) : 0;
      this.colors[i3 + 2] *= alpha > 0 ? Math.pow(alpha, 0.15) : 0;
    }

    if (needsUpdate) {
      this.posAttr.needsUpdate = true;
      this.colorAttr.needsUpdate = true;
      this.sizeAttr.needsUpdate = true;
    }
  }

  /** Spawn a burst of gold sparkles at position (gathering resource feedback). */
  spawnGoldSparkle(x: number, y: number, z: number): void {
    const count = randInt(GOLD_SPARKLE_MIN, GOLD_SPARKLE_MAX);
    for (let n = 0; n < count; n++) {
      const idx = this.allocate();
      if (idx === -1) return; // pool exhausted

      const t = Math.random();
      const color = lerpColor(GOLD_SPARKLE_COLORS[0], GOLD_SPARKLE_COLORS[1], t);
      const life = rand(GOLD_SPARKLE_LIFE_MIN, GOLD_SPARKLE_LIFE_MAX);
      const size = rand(GOLD_SPARKLE_SIZE_MIN, GOLD_SPARKLE_SIZE_MAX);

      this.spawn(idx, {
        x,
        y,
        z,
        vx: rand(-GOLD_SPARKLE_DRIFT, GOLD_SPARKLE_DRIFT),
        vy: rand(GOLD_SPARKLE_VY_MIN, GOLD_SPARKLE_VY_MAX),
        vz: rand(-GOLD_SPARKLE_DRIFT, GOLD_SPARKLE_DRIFT),
        life,
        size,
        color,
        type: ParticleType.GoldSparkle,
        gravity: false,
      });
    }
  }

  /** Spawn a dust cloud at position (construction / building feedback). */
  spawnConstructionDust(x: number, y: number, z: number): void {
    const count = randInt(DUST_MIN, DUST_MAX);
    for (let n = 0; n < count; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      const t = Math.random();
      const color = lerpColor(DUST_COLORS[0], DUST_COLORS[1], t);
      const life = rand(DUST_LIFE_MIN, DUST_LIFE_MAX);
      const size = rand(DUST_SIZE_MIN, DUST_SIZE_MAX);

      // Expand outward in XZ, rise in Y
      const angle = Math.random() * Math.PI * 2;
      const spread = rand(0, DUST_SPREAD);

      this.spawn(idx, {
        x: x + Math.cos(angle) * spread * 0.3,
        y,
        z: z + Math.sin(angle) * spread * 0.3,
        vx: Math.cos(angle) * spread,
        vy: rand(DUST_VY_MIN, DUST_VY_MAX),
        vz: Math.sin(angle) * spread,
        life,
        size,
        color,
        type: ParticleType.ConstructionDust,
        gravity: true,
      });
    }
  }

  /** Spawn hit impact particles at position (combat feedback). */
  spawnCombatHit(x: number, y: number, z: number, isRanged: boolean): void {
    if (isRanged) {
      this.spawnRangedHit(x, y, z);
    } else {
      this.spawnMeleeHit(x, y, z);
    }
  }

  /** Spawn death effect at position with faction colour tint. */
  spawnDeathEffect(x: number, y: number, z: number, factionColor: number): void {
    const count = randInt(DEATH_MIN, DEATH_MAX);
    const factionRgb = hexToRgb(factionColor);

    for (let n = 0; n < count; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      // Mix faction colour and dark smoke — roughly 50/50
      const useSmoke = Math.random() < 0.5;
      const color: [number, number, number] = useSmoke
        ? [...DEATH_SMOKE_COLOR]
        : [...factionRgb];

      const life = rand(DEATH_LIFE_MIN, DEATH_LIFE_MAX);
      const size = rand(DEATH_SIZE_MIN, DEATH_SIZE_MAX);

      // Radiate outward in all directions
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(0.5, DEATH_SPEED);

      this.spawn(idx, {
        x,
        y,
        z,
        vx: Math.cos(angle) * speed,
        vy: rand(0.2, DEATH_VY),
        vz: Math.sin(angle) * speed,
        life,
        size,
        color,
        type: ParticleType.Death,
        gravity: false,
      });
    }
  }

  /** Spawn ability activation ring (e.g. Carnavalsrage). */
  spawnAbilityBurst(
    x: number,
    y: number,
    z: number,
    color: number,
    radius: number,
  ): void {
    const rgb = hexToRgb(color);

    for (let n = 0; n < ABILITY_COUNT; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      // Distribute particles evenly in a ring
      const angle = (n / ABILITY_COUNT) * Math.PI * 2;
      const startX = x + Math.cos(angle) * radius;
      const startZ = z + Math.sin(angle) * radius;

      const life = rand(ABILITY_LIFE_MIN, ABILITY_LIFE_MAX);
      const size = rand(ABILITY_SIZE_MIN, ABILITY_SIZE_MAX);

      this.spawn(idx, {
        x: startX,
        y,
        z: startZ,
        vx: Math.cos(angle) * ABILITY_EXPAND_SPEED,
        vy: rand(0, ABILITY_VY),
        vz: Math.sin(angle) * ABILITY_EXPAND_SPEED,
        life,
        size,
        color: [...rgb],
        type: ParticleType.Ability,
        gravity: false,
      });
    }
  }

  /**
   * Spawn a large building destruction explosion:
   * debris chunks flying outward + fire particles rising.
   */
  spawnBuildingDestruction(x: number, y: number, z: number, factionColor: number): void {
    const count = randInt(DESTRUCTION_MIN, DESTRUCTION_MAX);
    const factionRgb = hexToRgb(factionColor);

    for (let n = 0; n < count; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      const isFire = Math.random() < 0.35;
      const isFaction = !isFire && Math.random() < 0.25;
      let color: [number, number, number];
      if (isFire) {
        const palette = DESTRUCTION_FIRE_COLORS;
        color = [...palette[Math.floor(Math.random() * palette.length)]];
      } else if (isFaction) {
        color = [...factionRgb];
      } else {
        const palette = DESTRUCTION_DEBRIS_COLORS;
        color = [...palette[Math.floor(Math.random() * palette.length)]];
      }

      const life = rand(DESTRUCTION_LIFE_MIN, DESTRUCTION_LIFE_MAX);
      const size = rand(DESTRUCTION_SIZE_MIN, DESTRUCTION_SIZE_MAX);
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(DESTRUCTION_SPEED_MIN, DESTRUCTION_SPEED_MAX);

      this.spawn(idx, {
        x: x + rand(-1, 1),
        y: y + rand(0, 1.5),
        z: z + rand(-1, 1),
        vx: Math.cos(angle) * speed,
        vy: rand(DESTRUCTION_VY_MIN, DESTRUCTION_VY_MAX),
        vz: Math.sin(angle) * speed,
        life,
        size,
        color,
        type: ParticleType.Death,
        gravity: true,
      });
    }
  }

  /** Spawn upward green healing particles at position. */
  spawnHealEffect(x: number, y: number, z: number): void {
    for (let n = 0; n < HEAL_COUNT; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      const life = rand(HEAL_LIFE_MIN, HEAL_LIFE_MAX);

      this.spawn(idx, {
        x: x + rand(-0.5, 0.5),
        y,
        z: z + rand(-0.5, 0.5),
        vx: rand(-HEAL_DRIFT, HEAL_DRIFT),
        vy: rand(HEAL_VY_MIN, HEAL_VY_MAX),
        vz: rand(-HEAL_DRIFT, HEAL_DRIFT),
        life,
        size: HEAL_SIZE,
        color: [...HEAL_COLOR],
        type: ParticleType.Ability,
        gravity: false,
      });
    }
  }

  /** Spawn orbiting buff aura particles around position. */
  spawnBuffAura(x: number, y: number, z: number, color: number, radius: number): void {
    const rgb = hexToRgb(color);

    for (let n = 0; n < BUFF_COUNT; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      const angle = (n / BUFF_COUNT) * Math.PI * 2;
      const startX = x + Math.cos(angle) * radius;
      const startZ = z + Math.sin(angle) * radius;
      const life = rand(BUFF_LIFE_MIN, BUFF_LIFE_MAX);

      // Orbit tangentially
      this.spawn(idx, {
        x: startX,
        y: y + rand(0, 0.5),
        z: startZ,
        vx: -Math.sin(angle) * BUFF_ORBIT_SPEED,
        vy: rand(0.2, 0.5),
        vz: Math.cos(angle) * BUFF_ORBIT_SPEED,
        life,
        size: BUFF_SIZE,
        color: [...rgb],
        type: ParticleType.Ability,
        gravity: false,
      });
    }
  }

  /** Spawn spinning star particles above stunned unit. */
  spawnStunStars(x: number, y: number, z: number): void {
    for (let n = 0; n < STUN_COUNT; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      const angle = (n / STUN_COUNT) * Math.PI * 2;

      this.spawn(idx, {
        x: x + Math.cos(angle) * 0.6,
        y: y + 2.5,
        z: z + Math.sin(angle) * 0.6,
        vx: -Math.sin(angle) * 2.0,
        vy: rand(-0.1, 0.2),
        vz: Math.cos(angle) * 2.0,
        life: STUN_LIFE,
        size: STUN_SIZE,
        color: [...STUN_COLOR],
        type: ParticleType.Ability,
        gravity: false,
      });
    }
  }

  /**
   * Spawn a cone-shaped burst (for abilities like Mestverspreider).
   * @param facing Direction in radians
   * @param halfAngle Half-width of cone in radians
   * @param range Length of cone
   */
  spawnConeEffect(
    x: number, y: number, z: number,
    facing: number, halfAngle: number, range: number,
    color: number,
  ): void {
    const rgb = hexToRgb(color);
    const count = 25;

    for (let n = 0; n < count; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      const angle = facing + rand(-halfAngle, halfAngle);
      const speed = rand(2.0, range * 0.5);
      const life = rand(0.8, 1.4);

      this.spawn(idx, {
        x,
        y: y + rand(0, 0.5),
        z,
        vx: Math.cos(angle) * speed,
        vy: rand(0, 0.8),
        vz: Math.sin(angle) * speed,
        life,
        size: rand(0.2, 0.4),
        color: [...rgb],
        type: ParticleType.Ability,
        gravity: true,
      });
    }
  }

  /**
   * Spawn a line/charge trail effect.
   * @param startX/Z Start position
   * @param endX/Z End position
   */
  spawnLineTrail(
    startX: number, y: number, startZ: number,
    endX: number, endZ: number,
    color: number,
  ): void {
    const rgb = hexToRgb(color);
    const count = 20;
    const dx = endX - startX;
    const dz = endZ - startZ;

    for (let n = 0; n < count; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      const t = n / count;
      const px = startX + dx * t + rand(-0.5, 0.5);
      const pz = startZ + dz * t + rand(-0.5, 0.5);
      const life = rand(0.6, 1.2);

      this.spawn(idx, {
        x: px,
        y: y + rand(0, 0.3),
        z: pz,
        vx: rand(-0.3, 0.3),
        vy: rand(0.5, 1.5),
        vz: rand(-0.3, 0.3),
        life,
        size: rand(0.15, 0.3),
        color: [...rgb],
        type: ParticleType.Ability,
        gravity: false,
      });
    }
  }

  /** Spawn a teleport flash (implosion at origin, explosion at destination). */
  spawnTeleportFlash(x: number, y: number, z: number, color: number): void {
    const rgb = hexToRgb(color);
    const count = 30;

    for (let n = 0; n < count; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      const angle = (n / count) * Math.PI * 2;
      const speed = rand(3.0, 6.0);
      const life = rand(0.4, 0.8);

      this.spawn(idx, {
        x,
        y: y + rand(0, 2.0),
        z,
        vx: Math.cos(angle) * speed,
        vy: rand(1.0, 3.0),
        vz: Math.sin(angle) * speed,
        life,
        size: rand(0.2, 0.4),
        color: [...rgb],
        type: ParticleType.Ability,
        gravity: false,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Internal: melee / ranged sub-spawners
  // -------------------------------------------------------------------------

  private spawnMeleeHit(x: number, y: number, z: number): void {
    const count = randInt(MELEE_HIT_MIN, MELEE_HIT_MAX);
    for (let n = 0; n < count; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      const t = Math.random();
      const color = lerpColor(MELEE_HIT_COLORS[0], MELEE_HIT_COLORS[1], t);
      const life = rand(MELEE_HIT_LIFE_MIN, MELEE_HIT_LIFE_MAX);
      const size = rand(MELEE_HIT_SIZE_MIN, MELEE_HIT_SIZE_MAX);

      // Radiate outward in random 3D directions
      const angle = Math.random() * Math.PI * 2;
      const elevation = rand(-0.3, 0.6);
      const speed = rand(MELEE_HIT_SPEED_MIN, MELEE_HIT_SPEED_MAX);

      this.spawn(idx, {
        x,
        y,
        z,
        vx: Math.cos(angle) * speed,
        vy: elevation * speed,
        vz: Math.sin(angle) * speed,
        life,
        size,
        color,
        type: ParticleType.CombatMelee,
        gravity: false,
      });
    }
  }

  private spawnRangedHit(x: number, y: number, z: number): void {
    const count = randInt(RANGED_HIT_MIN, RANGED_HIT_MAX);
    for (let n = 0; n < count; n++) {
      const idx = this.allocate();
      if (idx === -1) return;

      const t = Math.random();
      const color = lerpColor(RANGED_HIT_COLORS[0], RANGED_HIT_COLORS[1], t);
      const life = rand(RANGED_HIT_LIFE_MIN, RANGED_HIT_LIFE_MAX);
      // Reuse melee size constants for ranged (similar small sparks)
      const size = rand(MELEE_HIT_SIZE_MIN, MELEE_HIT_SIZE_MAX);

      const angle = Math.random() * Math.PI * 2;
      const speed = rand(1.5, 3.0);

      this.spawn(idx, {
        x,
        y,
        z,
        vx: Math.cos(angle) * speed,
        vy: rand(0, 1.0),
        vz: Math.sin(angle) * speed,
        life,
        size,
        color,
        type: ParticleType.CombatRanged,
        gravity: false,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Pool management
  // -------------------------------------------------------------------------

  /** Find and return the index of a dead particle slot, or -1 if pool full. */
  private allocate(): number {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (!this.meta[i].alive) return i;
    }
    return -1;
  }

  /** Write a single particle into slot `idx`. */
  private spawn(
    idx: number,
    opts: {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      life: number;
      size: number;
      color: [number, number, number];
      type: ParticleType;
      gravity: boolean;
    },
  ): void {
    const i3 = idx * 3;

    this.positions[i3] = opts.x;
    this.positions[i3 + 1] = opts.y;
    this.positions[i3 + 2] = opts.z;

    this.colors[i3] = opts.color[0];
    this.colors[i3 + 1] = opts.color[1];
    this.colors[i3 + 2] = opts.color[2];

    this.sizes[idx] = opts.size;

    const m = this.meta[idx];
    m.alive = true;
    m.type = opts.type;
    m.vx = opts.vx;
    m.vy = opts.vy;
    m.vz = opts.vz;
    m.life = opts.life;
    m.maxLife = opts.life;
    m.baseSize = opts.size;
    m.hasGravity = opts.gravity;

    // Mark dirty
    this.posAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
  }

  /** Mark particle at `idx` as dead and hide it below the scene. */
  private kill(idx: number): void {
    this.meta[idx].alive = false;
    this.meta[idx].type = ParticleType.None;
    const i3 = idx * 3;
    this.positions[i3 + 1] = -9999;
    this.sizes[idx] = 0;
  }
}
