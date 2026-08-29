import { ARMY_CONFIG } from '../config/army';
import { COMBAT_CONFIG } from '../config/combat';
import { playerWorldZ } from '../math/camera';
import { isGameOver } from '../math/format';
import { GAME_CONFIG } from '../config/game';
import type { GameState } from '../types';
import {
  buildFormationSlots,
  sortedSlotIndices,
  visibleSoldierCount,
} from './formation';
import { acquireEntity } from '../entities/combat';
import type { Particle } from '../entities/combat';

function captureDyingVisuals(
  state: GameState,
  count: number,
  contactX?: number,
  contactZ?: number,
): void {
  if (count <= 0) {
    return;
  }

  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const anchorX = contactX ?? state.armyX;
  const anchorZ = contactZ ?? playerZ;

  const candidates = sortedSlotIndices(state.formationSlots).map((index) => {
    const slot = state.formationSlots[index];
    if (!slot?.active) {
      return { index, dist: Infinity };
    }
    const worldX = state.armyX + slot.offsetX;
    const worldZ = playerZ + slot.offsetZ;
    const dx = worldX - anchorX;
    const dz = worldZ - anchorZ;
    return { index, dist: dx * dx + dz * dz };
  });

  if (contactX === undefined) {
    candidates.sort((a, b) => b.dist - a.dist);
  } else {
    candidates.sort((a, b) => a.dist - b.dist);
  }

  let captured = 0;
  for (let i = 0; i < candidates.length && captured < count; i += 1) {
    const candidate = candidates[i];
    if (!candidate || !Number.isFinite(candidate.dist)) {
      continue;
    }
    const slot = state.formationSlots[candidate.index];
    if (!slot?.active) {
      continue;
    }

    let visual = state.dyingVisuals.find((item) => !item.active);
    if (!visual) {
      visual = state.dyingVisuals.find((item) => item.t > ARMY_CONFIG.soldierDeathDuration * 0.85);
      if (visual) {
        visual.active = false;
      }
    }
    if (!visual) {
      continue;
    }

    visual.active = true;
    visual.offsetX = slot.offsetX;
    visual.offsetZ = slot.offsetZ;
    visual.phase = slot.phase;
    visual.t = 0;
    captured += 1;
  }
}

function spawnArmyLossParticles(
  state: GameState,
  count: number,
  contactX: number,
  contactZ: number,
): void {
  const spawnCount = Math.min(count, ARMY_CONFIG.deathParticleCount);
  for (let i = 0; i < spawnCount; i += 1) {
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
    const angle = (i / spawnCount) * Math.PI * 2;
    particle.active = true;
    particle.x = contactX + Math.cos(angle) * 0.1;
    particle.z = contactZ + Math.sin(angle) * 0.08;
    particle.vx = Math.cos(angle) * 5;
    particle.vz = Math.sin(angle) * 4;
    particle.life = COMBAT_CONFIG.particleLife * 0.85;
    particle.maxLife = COMBAT_CONFIG.particleLife * 0.85;
  }
}

export function refreshFormation(state: GameState): void {
  const nextVisible = visibleSoldierCount(state.armySize);
  state.visibleCount = nextVisible;
  state.formationBuiltFor = state.armySize;
  buildFormationSlots(nextVisible, state.formationSlots);
}

function triggerLossFeedback(
  state: GameState,
  lost: number,
  contactX: number,
  contactZ: number,
): void {
  if (lost <= 0) {
    return;
  }
  state.armyDeathPulse = ARMY_CONFIG.deathPulseDuration;
  state.armyShake = ARMY_CONFIG.shakeDuration;
  state.contactPulse = COMBAT_CONFIG.contactPulseDuration;
  state.contactX = contactX;
  state.contactZ = contactZ;
  spawnArmyLossParticles(state, lost, contactX, contactZ);
}

export function checkArmyGameOver(state: GameState): void {
  if (isGameOver(state.armySize)) {
    state.status = 'gameover';
    state.armySize = 0;
    state.visibleCount = 0;
  }
}

/** Game-over screen waits until the fireball and fading soldiers have played. */
export function hasPendingDeathPresentation(state: GameState): boolean {
  if (state.explosionBurst > 0) {
    return true;
  }
  for (let i = 0; i < state.dyingVisuals.length; i += 1) {
    if (state.dyingVisuals[i]?.active) {
      return true;
    }
  }
  return false;
}

export function addSoldiers(state: GameState, amount: number): void {
  if (amount <= 0 || state.status !== 'running') {
    return;
  }
  state.armySize += amount;
  refreshFormation(state);
}

export function removeSoldiers(
  state: GameState,
  amount: number,
  contactX?: number,
  contactZ?: number,
): void {
  if (amount <= 0 || state.status !== 'running') {
    return;
  }
  const lost = Math.min(amount, state.armySize);
  captureDyingVisuals(state, lost, contactX, contactZ);
  state.armySize = Math.max(0, state.armySize - amount);
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  triggerLossFeedback(
    state,
    lost,
    contactX ?? state.armyX,
    contactZ ?? playerZ,
  );
  refreshFormation(state);
  checkArmyGameOver(state);
}

export function removeSoldiersAtContact(
  state: GameState,
  amount: number,
  contactX: number,
  contactZ: number,
): void {
  removeSoldiers(state, amount, contactX, contactZ);
}

export function setArmySize(state: GameState, size: number): void {
  if (state.status !== 'running') {
    return;
  }
  const clamped = Math.max(0, Math.floor(size));
  if (clamped >= state.armySize) {
    state.armySize = clamped;
    refreshFormation(state);
    return;
  }
  removeSoldiers(state, state.armySize - clamped);
}

export function multiplyArmySize(
  state: GameState,
  factor: number,
  contactX: number,
  contactZ: number,
): void {
  if (state.status !== 'running' || factor <= 0) {
    return;
  }
  const newSize = Math.max(0, Math.floor(state.armySize * factor));
  if (newSize === state.armySize) {
    return;
  }
  if (newSize > state.armySize) {
    addSoldiers(state, newSize - state.armySize);
    return;
  }
  removeSoldiers(state, state.armySize - newSize, contactX, contactZ);
}
