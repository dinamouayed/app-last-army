import { armyFrontWorldZ } from '../army/footprint';
import {
  BOSS_CONFIG,
  bossTapFireballAppliedDamage,
} from '../config/bosses';
import { COMBAT_CONFIG } from '../config/combat';
import { GAME_CONFIG } from '../config/game';
import { acquireEntity } from '../entities/combat';
import type { Particle } from '../entities/combat';
import { resetTapStrike } from '../entities/boss';
import { playerWorldZ } from '../math/camera';
import type { GameState } from '../types';
import { applyProjectileBossHit } from './BossSystem';

function lerpToward(current: number, target: number, dt: number, speed: number): number {
  const t = 1 - Math.exp(-speed * dt);
  return current + (target - current) * t;
}

function easeOutCubic(t: number): number {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

function armyLaunchPoint(state: GameState): { x: number; z: number } {
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  return {
    x: state.armyX,
    z: armyFrontWorldZ(playerZ, state.formationSlots),
  };
}

function spawnFireballTrail(state: GameState, x: number, z: number): void {
  const particle = acquireEntity(state.particles, COMBAT_CONFIG.maxParticles, () => ({
    active: false,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    life: 0,
    maxLife: COMBAT_CONFIG.particleLife,
    kind: 'explosion' as const,
  } satisfies Particle));
  if (!particle) {
    return;
  }
  const spin = state.elapsed * 11.3;
  particle.active = true;
  particle.x = x;
  particle.z = z;
  particle.vx = Math.sin(spin) * 1.2;
  particle.vz = Math.cos(spin * 0.7) * 0.9 - 0.5;
  particle.life = COMBAT_CONFIG.particleLife * 0.7;
  particle.maxLife = COMBAT_CONFIG.particleLife * 0.7;
}

function spawnFireballImpactParticles(state: GameState, x: number, z: number): void {
  const count = 16;
  for (let i = 0; i < count; i += 1) {
    const particle = acquireEntity(state.particles, COMBAT_CONFIG.maxParticles, () => ({
      active: false,
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      life: 0,
      maxLife: COMBAT_CONFIG.particleLife,
      kind: 'explosion' as const,
    } satisfies Particle));
    if (!particle) {
      return;
    }
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.18;
    const speed = 7 + (i % 5) * 2.1;
    particle.active = true;
    particle.x = x + Math.cos(angle) * 0.14;
    particle.z = z + Math.sin(angle) * 0.1;
    particle.vx = Math.cos(angle) * speed;
    particle.vz = Math.sin(angle) * speed * 0.7 - 1.2;
    particle.life = COMBAT_CONFIG.particleLife * 1.25;
    particle.maxLife = COMBAT_CONFIG.particleLife * 1.25;
  }
}

export function canChargeBossTap(state: GameState): boolean {
  return state.status === 'running' && state.boss.active && !state.boss.dying;
}

export function launchTapFireball(state: GameState): boolean {
  const strike = state.tapStrike;
  const boss = state.boss;
  if (!canChargeBossTap(state) || strike.fireballActive) {
    return false;
  }

  const from = armyLaunchPoint(state);
  strike.charge = 0;
  strike.fireballActive = true;
  strike.fireballT = 0;
  strike.fireballFromX = from.x;
  strike.fireballFromZ = from.z;
  strike.fireballToX = boss.x;
  strike.fireballToZ = boss.z;
  strike.fireballX = from.x;
  strike.fireballZ = from.z;
  return true;
}

export function registerBossTap(state: GameState): boolean {
  if (!canChargeBossTap(state)) {
    return false;
  }

  const strike = state.tapStrike;
  const now = state.elapsed;
  const hadPriorTap = strike.lastTapElapsed >= 0;
  const gap = now - strike.lastTapElapsed;
  const fastEnough = !hadPriorTap || gap <= BOSS_CONFIG.tapMaxGap;

  strike.lastTapElapsed = now;
  strike.hasTapped = true;
  strike.pulse = BOSS_CONFIG.tapPulseDuration;

  if (!fastEnough) {
    strike.idleT = BOSS_CONFIG.tapChargeIdleGrace;
    return false;
  }

  strike.charge = Math.min(1, strike.charge + BOSS_CONFIG.tapChargePerTap);
  strike.idleT = 0;
  if (strike.charge >= 1 && !strike.fireballActive) {
    launchTapFireball(state);
  }
  return true;
}

function detonateFireball(state: GameState): void {
  const strike = state.tapStrike;
  const boss = state.boss;
  const x = strike.fireballX;
  const z = strike.fireballZ;
  strike.fireballActive = false;
  strike.fireballT = 0;
  strike.impactT = BOSS_CONFIG.tapFireballImpact;
  state.armyShake = Math.max(state.armyShake, BOSS_CONFIG.slamShakeDuration * 1.15);
  spawnFireballImpactParticles(state, x, z);

  if (!boss.active || boss.dying) {
    return;
  }

  const damage = bossTapFireballAppliedDamage(boss.hp, boss.maxHp);
  if (damage > 0) {
    applyProjectileBossHit(state, damage);
  }
  boss.hitFlash = Math.max(boss.hitFlash, BOSS_CONFIG.hitFlashDuration * 1.8);
}

function updateFireball(state: GameState, dt: number): void {
  const strike = state.tapStrike;
  if (!strike.fireballActive) {
    return;
  }

  const boss = state.boss;
  if (boss.active) {
    strike.fireballToX = boss.x;
    strike.fireballToZ = boss.z;
  }

  strike.fireballT += dt;
  const u = Math.min(1, strike.fireballT / BOSS_CONFIG.tapFireballFlight);
  const eased = easeOutCubic(u);
  strike.fireballX = strike.fireballFromX + (strike.fireballToX - strike.fireballFromX) * eased;
  strike.fireballZ = strike.fireballFromZ + (strike.fireballToZ - strike.fireballFromZ) * eased;
  spawnFireballTrail(state, strike.fireballX, strike.fireballZ);

  if (u >= 1) {
    detonateFireball(state);
  }
}

export function updateBossTapStrike(state: GameState, dt: number): void {
  const strike = state.tapStrike;
  const boss = state.boss;

  if (!boss.active && !strike.fireballActive && strike.impactT <= 0 && strike.charge <= 0) {
    if (strike.chargeVisual > 0.01 || strike.hintT > 0 || strike.pulse > 0) {
      strike.chargeVisual = lerpToward(strike.chargeVisual, 0, dt, BOSS_CONFIG.tapChargeVisualLerp);
      strike.hintT = Math.max(0, strike.hintT - dt * 2);
      strike.pulse = Math.max(0, strike.pulse - dt);
    }
    return;
  }

  if (boss.active && !boss.dying && strike.hintT <= 0 && !strike.hasTapped) {
    strike.hintT = BOSS_CONFIG.tapHintDuration;
  }

  if (!canChargeBossTap(state)) {
    strike.charge = 0;
  } else {
    strike.idleT += dt;
    if (strike.idleT > BOSS_CONFIG.tapChargeIdleGrace) {
      strike.charge = Math.max(
        0,
        strike.charge - BOSS_CONFIG.tapChargeDecay * dt,
      );
    }
    if (strike.charge >= 1 && !strike.fireballActive) {
      launchTapFireball(state);
    }
  }

  strike.chargeVisual = lerpToward(
    strike.chargeVisual,
    strike.charge,
    dt,
    BOSS_CONFIG.tapChargeVisualLerp,
  );
  strike.pulse = Math.max(0, strike.pulse - dt);
  strike.impactT = Math.max(0, strike.impactT - dt);

  const hintFade = strike.hasTapped ? 3 : 1;
  strike.hintT = Math.max(0, strike.hintT - dt * hintFade);

  updateFireball(state, dt);

  if (!boss.active && !strike.fireballActive && strike.impactT <= 0) {
    resetTapStrike(strike);
  }
}

export function bossTapHintOpacity(state: GameState): number {
  if (!state.boss.active || state.boss.dying) {
    return 0;
  }
  return Math.min(1, state.tapStrike.hintT / 0.35);
}
