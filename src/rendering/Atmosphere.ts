/**
 * Atmosphere.ts
 * Sets up the visual atmosphere for the Reign of Brabant RTS:
 * sky dome with warm Brabant gradient, exponential fog, shadow-casting
 * sun light, and ambient dust particles.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAP_CENTER = new THREE.Vector3(64, 0, 64);
const PARTICLE_COUNT = 200;
const PARTICLE_BOX_SIZE = 60;   // particles spread across 60x30x60 box
const PARTICLE_BOX_HEIGHT = 30;
const SKY_RADIUS = 500;

// ---------------------------------------------------------------------------
// Module-level state for particle animation
// ---------------------------------------------------------------------------

let particleSystem: THREE.Points | null = null;
let particleVelocities: Float32Array | null = null;

// ---------------------------------------------------------------------------
// Sky Dome Shader
// ---------------------------------------------------------------------------

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uMidColor;
  uniform vec3 uHorizonColor;
  uniform float uOffset;
  uniform float uExponent;

  varying vec3 vWorldPosition;

  void main() {
    // Normalized height: 0 at horizon, 1 at zenith
    float h = normalize(vWorldPosition - vec3(0.0)).y;
    h = max(h, 0.0);

    // Two-stage gradient: horizon -> mid -> top
    vec3 color;
    if (h < 0.3) {
      // Horizon to mid sky
      float t = h / 0.3;
      t = pow(t, 0.8);
      color = mix(uHorizonColor, uMidColor, t);
    } else {
      // Mid sky to zenith
      float t = (h - 0.3) / 0.7;
      t = pow(t, 1.2);
      color = mix(uMidColor, uTopColor, t);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Sky Dome Creation
// ---------------------------------------------------------------------------

function createSkyDome(scene: THREE.Scene): void {
  const skyGeo = new THREE.SphereGeometry(SKY_RADIUS, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    uniforms: {
      uTopColor:     { value: new THREE.Color(0x1a3a5c) },
      uMidColor:     { value: new THREE.Color(0x87ceeb) },
      uHorizonColor: { value: new THREE.Color(0xf0d8a0) },
      uOffset:       { value: 0 },
      uExponent:     { value: 0.6 },
    },
    side: THREE.BackSide,
    depthWrite: false,
  });

  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.renderOrder = -1;
  scene.add(skyMesh);
}

// ---------------------------------------------------------------------------
// Fog
// ---------------------------------------------------------------------------

function createFog(scene: THREE.Scene): void {
  scene.fog = new THREE.FogExp2(0xc8d8e8, 0.003);
}

// ---------------------------------------------------------------------------
// Sun Light with Shadows
// ---------------------------------------------------------------------------

function createSunLight(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
): THREE.DirectionalLight {
  // Enable shadow mapping on renderer
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Directional sun light
  const sunLight = new THREE.DirectionalLight(0xffeedd, 1.1);
  sunLight.position.set(-40, 70, -30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -80;
  sunLight.shadow.camera.right = 80;
  sunLight.shadow.camera.top = 80;
  sunLight.shadow.camera.bottom = -80;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.bias = -0.001;

  scene.add(sunLight);
  scene.add(sunLight.target);

  return sunLight;
}

// ---------------------------------------------------------------------------
// Ambient Dust Particles
// ---------------------------------------------------------------------------

function createDustParticles(scene: THREE.Scene): void {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  particleVelocities = new Float32Array(PARTICLE_COUNT * 3);

  const baseColor = new THREE.Color(0xfff8e0);  // warm golden white
  const altColor = new THREE.Color(0xffffff);    // pure white

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    // Random position within box centered on map
    positions[i3]     = MAP_CENTER.x + (Math.random() - 0.5) * PARTICLE_BOX_SIZE;
    positions[i3 + 1] = 1 + Math.random() * PARTICLE_BOX_HEIGHT;
    positions[i3 + 2] = MAP_CENTER.z + (Math.random() - 0.5) * PARTICLE_BOX_SIZE;

    // Subtle drift: slight upward + sideways
    particleVelocities[i3]     = (Math.random() - 0.5) * 0.3;  // x drift
    particleVelocities[i3 + 1] = 0.05 + Math.random() * 0.15;  // upward drift
    particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.3;  // z drift

    // Mix golden and white
    const c = Math.random() > 0.5 ? baseColor : altColor;
    colors[i3]     = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;

    // Small varying sizes
    sizes[i] = 0.06 + Math.random() * 0.08;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });

  particleSystem = new THREE.Points(geometry, material);
  particleSystem.frustumCulled = false;
  scene.add(particleSystem);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialises the full atmosphere: sky dome, fog, shadow-casting sun light,
 * and ambient dust particles. Returns the configured directional light so
 * the caller can replace its existing (non-shadow) light.
 */
export function initAtmosphere(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
): THREE.DirectionalLight {
  createSkyDome(scene);
  createFog(scene);
  const sunLight = createSunLight(scene, renderer);
  createDustParticles(scene);
  return sunLight;
}

/**
 * Tick function for particle animation. Call each frame with delta time in
 * seconds.
 */
export function updateAtmosphere(dt: number): void {
  if (!particleSystem || !particleVelocities) return;

  const posAttr = particleSystem.geometry.getAttribute('position') as THREE.BufferAttribute;
  const positions = posAttr.array as Float32Array;

  const halfBoxX = PARTICLE_BOX_SIZE * 0.5;
  const halfBoxZ = PARTICLE_BOX_SIZE * 0.5;
  const minY = 1;
  const maxY = 1 + PARTICLE_BOX_HEIGHT;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    positions[i3]     += particleVelocities[i3]     * dt;
    positions[i3 + 1] += particleVelocities[i3 + 1] * dt;
    positions[i3 + 2] += particleVelocities[i3 + 2] * dt;

    // Wrap particles that drift out of the box
    if (positions[i3] < MAP_CENTER.x - halfBoxX) {
      positions[i3] = MAP_CENTER.x + halfBoxX;
    } else if (positions[i3] > MAP_CENTER.x + halfBoxX) {
      positions[i3] = MAP_CENTER.x - halfBoxX;
    }

    if (positions[i3 + 2] < MAP_CENTER.z - halfBoxZ) {
      positions[i3 + 2] = MAP_CENTER.z + halfBoxZ;
    } else if (positions[i3 + 2] > MAP_CENTER.z + halfBoxZ) {
      positions[i3 + 2] = MAP_CENTER.z - halfBoxZ;
    }

    // Particles that float above the ceiling respawn at the bottom
    if (positions[i3 + 1] > maxY) {
      positions[i3 + 1] = minY;
      positions[i3]     = MAP_CENTER.x + (Math.random() - 0.5) * PARTICLE_BOX_SIZE;
      positions[i3 + 2] = MAP_CENTER.z + (Math.random() - 0.5) * PARTICLE_BOX_SIZE;
    }
  }

  posAttr.needsUpdate = true;
}
