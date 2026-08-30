import { FEEL_CONFIG } from '../config/feel';
import { acquireEntity } from '../entities/combat';
import type { Particle } from '../entities/combat';
import { COMBAT_CONFIG } from '../config/combat';
import { addCameraShake, triggerSlowMo, type FeelRuntimeState } from '../feel/feedback';
import type { GameState } from '../types';

export function cameraShakeOffset(
  state: FeelRuntimeState,
  elapsed: number,
): { x: number; y: number } {
  const mag = state.cameraShakeMag;
  if (mag <= 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: Math.sin(elapsed * 63.4) * mag,
    y: Math.cos(elapsed * 52.1) * mag * 0.7,
  };
}

/** Real-time clock: shake and slow-mo must not stretch with timeScale. */
export function updateFeelClock(state: GameState, realDt: number): void {
  if (state.cameraShakeMag > 0) {
    state.cameraShakeMag = Math.max(
      0,
      state.cameraShakeMag - state.cameraShakeMag * FEEL_CONFIG.cameraShakeDecay * realDt,
    );
    if (state.cameraShakeMag < FEEL_CONFIG.cameraShakeFloor) {
      state.cameraShakeMag = 0;
    }
  }

  if (state.slowMoT > 0) {
    state.slowMoT = Math.max(0, state.slowMoT - realDt);
    const u = 1 - state.slowMoT / FEEL_CONFIG.slowMoDuration;
    const eased = u * u * (3 - 2 * u);
    state.timeScale = FEEL_CONFIG.slowMoScale + (1 - FEEL_CONFIG.slowMoScale) * eased;
  } else {
    state.timeScale = 1;
  }
}

export function updateFeelVisuals(state: GameState, dt: number): void {
  for (let i = 0; i < state.floatingTexts.length; i += 1) {
    const item = state.floatingTexts[i];
    if (!item?.active) {
      continue;
    }
    item.life -= dt;
    item.z += 1.8 * dt;
    if (item.life <= 0) {
      item.active = false;
    }
  }
}

export function spawnParticleBurst(
  state: GameState,
  x: number,
  z: number,
  options: {
    count: number;
    kind: Particle['kind'];
    speed: number;
    life: number;
    radius?: number;
  },
): void {
  const radius = options.radius ?? 0.06;
  for (let i = 0; i < options.count; i += 1) {
    const particle = acquireEntity(state.particles, COMBAT_CONFIG.maxParticles, () => ({
      active: false,
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      life: 0,
      maxLife: COMBAT_CONFIG.particleLife,
      kind: 'default' as const,
    } satisfies Particle));
    if (!particle) {
      return;
    }
    const angle = (i / options.count) * Math.PI * 2 + (i % 3) * 0.17;
    const speed = options.speed * (0.72 + (i % 4) * 0.12);
    particle.active = true;
    particle.kind = options.kind;
    particle.x = x + Math.cos(angle) * radius;
    particle.z = z + Math.sin(angle) * radius * 0.8;
    particle.vx = Math.cos(angle) * speed;
    particle.vz = Math.sin(angle) * speed * 0.7;
    particle.life = options.life * (0.85 + (i % 3) * 0.08);
    particle.maxLife = particle.life;
  }
}

export function spawnHitSparks(state: GameState, x: number, z: number): void {
  spawnParticleBurst(state, x, z, {
    count: FEEL_CONFIG.hitSparkCount,
    kind: 'hit',
    speed: FEEL_CONFIG.hitSparkSpeed,
    life: FEEL_CONFIG.hitSparkLife,
    radius: 0.04,
  });
}

export function applyBossDeathFeel(state: GameState): void {
  addCameraShake(state, FEEL_CONFIG.deathShake);
  triggerSlowMo(state);
}
