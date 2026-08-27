import {
  addSoldiers,
  checkArmyGameOver,
  multiplyArmySize,
  removeSoldiers,
} from '../army/armyState';
import { armyFrontWorldZ } from '../army/footprint';
import { GATE_CONFIG } from '../config/gates';
import { COMBAT_CONFIG } from '../config/combat';
import { GAME_CONFIG } from '../config/game';
import { acquireEntity } from '../entities/combat';
import type { Particle } from '../entities/combat';
import type { Gate } from '../entities/gates';
import { createEmptyGate, isWeaponGate, livingGateCount } from '../entities/gates';
import { playerWorldZ } from '../math/camera';
import { asphaltLaneBounds, asphaltLaneCenterX } from '../math/roadBounds';
import type { GameState, LaneIndex } from '../types';
import { generateGateChoices, type GateGenerationMode } from './GateGenerator';
import { applyHitToShootableGate, syncShootableGateDerived } from './gateEvolution';
import {
  equipWeapon,
  failedWeaponUnlockSoldierLoss,
  registerWeaponUnlock,
} from './weaponGate';

function nextGateId(state: GameState): number {
  const id = state.nextEntityId;
  state.nextEntityId += 1;
  return id;
}

function nextGroupId(state: GameState): number {
  const id = state.nextGroupId;
  state.nextGroupId += 1;
  return id;
}

function minGateSpawnZ(armyFrontZ: number): number {
  return armyFrontZ + GATE_CONFIG.minSpawnAhead;
}

function initializeGateFromChoice(
  gate: Gate,
  choice: ReturnType<typeof generateGateChoices>[number],
): void {
  gate.lane = choice.lane;
  gate.x = asphaltLaneCenterX(choice.lane, GAME_CONFIG.camera);
  gate.kind = choice.kind;
  gate.operation = choice.operation ?? 'add';
  gate.value = choice.value ?? 0;
  gate.shootable = choice.shootable === true;
  gate.signedValue = choice.signedValue ?? 0;
  gate.damageBuffer = 0;
  gate.weaponId = choice.weaponId ?? null;
  gate.weaponHp = choice.weaponHp ?? 0;
  gate.weaponMaxHp = choice.weaponHp ?? 0;
  gate.weaponReady = false;
  gate.explodeT = 0;
  gate.weaponAbsorbT = 0;
  gate.valueFlash = 0;
  gate.evolvePulse = 0;
  gate.evolvePulseKind = 'none';
  gate.activated = false;
  gate.fadeT = 0;
  if (gate.shootable) {
    syncShootableGateDerived(gate);
  }
}

function spawnGateGroup(
  state: GameState,
  baseZ: number,
  rng: () => number,
  mode: GateGenerationMode = 'standard',
): number {
  if (livingGateCount(state.gates) >= GATE_CONFIG.maxGates) {
    return 0;
  }

  const choices = generateGateChoices(
    state.armySize,
    state.unlockedWeapons,
    state.distance,
    rng,
    mode,
  );
  const groupId = nextGroupId(state);
  let spawned = 0;

  for (let i = 0; i < choices.length; i += 1) {
    const choice = choices[i];
    if (!choice) {
      continue;
    }
    const gate = acquireEntity(state.gates, GATE_CONFIG.maxGates, () => createEmptyGate());
    if (!gate) {
      break;
    }

    gate.id = nextGateId(state);
    gate.groupId = groupId;
    gate.active = true;
    gate.z = baseZ;
    initializeGateFromChoice(gate, choice);
    spawned += 1;
  }

  return spawned;
}

export function spawnGateChoice(
  state: GameState,
  rng: () => number = Math.random,
  mode: GateGenerationMode = 'standard',
): number {
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const armyFrontZ = armyFrontWorldZ(playerZ, state.formationSlots);
  const minZ = minGateSpawnZ(armyFrontZ);
  const spawnZ = Math.max(minZ, armyFrontZ + GATE_CONFIG.spawnAhead);
  return spawnGateGroup(state, spawnZ, rng, mode);
}

export function scheduleFirstGate(state: GameState): void {
  state.nextGateDistance = GATE_CONFIG.firstGateDistance;
}

/** Removes math gates and weapon barrels too close to the boss depth. */
export function clearGatesNearWorldZ(state: GameState, z: number, clearance: number): number {
  let cleared = 0;
  for (let i = 0; i < state.gates.length; i += 1) {
    const gate = state.gates[i];
    if (!gate?.active) {
      continue;
    }
    if (Math.abs(gate.z - z) < clearance) {
      gate.active = false;
      cleared += 1;
    }
  }
  return cleared;
}

function armyInGateLane(armyX: number, lane: LaneIndex): boolean {
  const bounds = asphaltLaneBounds(lane, GAME_CONFIG.camera, 0.04);
  return armyX >= bounds.minX && armyX <= bounds.maxX;
}

function spawnGateActivationParticles(
  state: GameState,
  x: number,
  z: number,
  positive: boolean,
): void {
  const count = positive ? 6 : 4;
  for (let i = 0; i < count; i += 1) {
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
    const angle = (i / count) * Math.PI * 2;
    particle.active = true;
    particle.kind = positive ? 'gatePositive' : 'gateNegative';
    particle.x = x + Math.cos(angle) * 0.08;
    particle.z = z + Math.sin(angle) * 0.06;
    particle.vx = Math.cos(angle) * (positive ? 6.5 : 4.5);
    particle.vz = Math.sin(angle) * 3.5;
    particle.life = COMBAT_CONFIG.particleLife * (positive ? 1 : 0.75);
    particle.maxLife = particle.life;
  }
}

function spawnBarrelExplosion(state: GameState, x: number, z: number): void {
  for (let i = 0; i < 22; i += 1) {
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
    const angle = (i / 22) * Math.PI * 2 + (i % 3) * 0.2;
    const speed = 6 + (i % 5) * 2.2;
    particle.active = true;
    particle.kind = i % 3 === 0 ? 'gatePositive' : 'default';
    particle.x = x + Math.cos(angle) * 0.04;
    particle.z = z + Math.sin(angle) * 0.03;
    particle.vx = Math.cos(angle) * speed;
    particle.vz = Math.sin(angle) * (speed * 0.55);
    particle.life = COMBAT_CONFIG.particleLife * (1.2 + (i % 4) * 0.15);
    particle.maxLife = particle.life;
  }
}

function triggerEvolveFeedback(state: GameState, gate: Gate): void {
  state.gatePulseX = gate.x;
  state.gatePulseZ = gate.z;
  if (gate.evolvePulseKind === 'positive') {
    state.gatePulse = GATE_CONFIG.shootable.positiveCrossPulseDuration;
    state.gatePulsePositive = true;
    spawnGateActivationParticles(state, gate.x, gate.z, true);
    return;
  }
  if (gate.evolvePulseKind === 'zero') {
    state.gatePulse = GATE_CONFIG.shootable.zeroCrossPulseDuration;
    state.gatePulsePositive = true;
    spawnGateActivationParticles(state, gate.x, gate.z, true);
  }
}

function completeWeaponUnlock(state: GameState, gate: Gate): void {
  if (!gate.weaponId) {
    return;
  }
  registerWeaponUnlock(state, gate.weaponId);
  equipWeapon(state, gate.weaponId);
  gate.weaponReady = true;
  gate.weaponHp = 0;
  gate.explodeT = GATE_CONFIG.weaponGate.explodeDuration;
  state.gatePulse = GATE_CONFIG.weaponGate.unlockPulseDuration;
  state.gatePulseX = gate.x;
  state.gatePulseZ = gate.z;
  state.gatePulsePositive = true;
  spawnBarrelExplosion(state, gate.x, gate.z);
}

export function applyProjectileGateHit(
  state: GameState,
  gateIndex: number,
  _damage: number,
): void {
  const gate = state.gates[gateIndex];
  if (!gate?.active || gate.activated) {
    return;
  }

  if (isWeaponGate(gate)) {
    if (gate.weaponReady || gate.weaponHp <= 0) {
      return;
    }
    gate.weaponHp = Math.max(0, gate.weaponHp - 1);
    gate.valueFlash = GATE_CONFIG.weaponGate.hitFlashDuration;
    if (gate.weaponHp <= 0) {
      completeWeaponUnlock(state, gate);
    }
    return;
  }

  if (!gate.shootable) {
    return;
  }

  const result = applyHitToShootableGate(gate, 1);
  if (result.steps <= 0) {
    return;
  }

  if (result.crossedPositive) {
    gate.evolvePulseKind = 'positive';
    gate.evolvePulse = GATE_CONFIG.shootable.positiveCrossPulseDuration;
  } else if (result.crossedZero) {
    gate.evolvePulseKind = 'zero';
    gate.evolvePulse = GATE_CONFIG.shootable.zeroCrossPulseDuration;
  }

  triggerEvolveFeedback(state, gate);
}

function deactivateGateGroup(state: GameState, groupId: number, exceptGateId: number): void {
  for (let i = 0; i < state.gates.length; i += 1) {
    const gate = state.gates[i];
    if (!gate?.active || gate.groupId !== groupId || gate.id === exceptGateId) {
      continue;
    }
    gate.active = false;
  }
}

function activateWeaponGate(state: GameState, gate: Gate): void {
  if (gate.weaponHp > 0 && !gate.weaponReady) {
    gate.activated = true;
    gate.fadeT = 0;
    state.gatePulse = GATE_CONFIG.activationFeedbackDuration;
    state.gatePulseX = gate.x;
    state.gatePulseZ = gate.z;
    state.gatePulsePositive = false;
    spawnGateActivationParticles(state, gate.x, gate.z, false);
    removeSoldiers(
      state,
      failedWeaponUnlockSoldierLoss(state.armySize, gate.weaponHp, gate.weaponMaxHp),
      gate.x,
      gate.z,
    );
    deactivateGateGroup(state, gate.groupId, gate.id);
    return;
  }

  if (gate.weaponId && !gate.weaponReady) {
    completeWeaponUnlock(state, gate);
  }

  gate.activated = true;
  gate.fadeT = 0;
  deactivateGateGroup(state, gate.groupId, gate.id);
}

function activateMathGate(state: GameState, gate: Gate): void {
  if (gate.shootable) {
    syncShootableGateDerived(gate);
  }

  gate.activated = true;
  gate.fadeT = 0;

  const positive =
    gate.shootable ? gate.signedValue >= 0 : gate.operation === 'add' || gate.operation === 'multiply';
  state.gatePulse = GATE_CONFIG.activationFeedbackDuration;
  state.gatePulseX = gate.x;
  state.gatePulseZ = gate.z;
  state.gatePulsePositive = positive;
  spawnGateActivationParticles(state, gate.x, gate.z, positive);

  if (gate.shootable) {
    if (gate.signedValue > 0) {
      addSoldiers(state, gate.signedValue);
    } else if (gate.signedValue < 0) {
      removeSoldiers(state, Math.abs(gate.signedValue), gate.x, gate.z);
    }
  } else if (gate.operation === 'add') {
    addSoldiers(state, gate.value);
  } else if (gate.operation === 'subtract') {
    removeSoldiers(state, gate.value, gate.x, gate.z);
  } else {
    multiplyArmySize(state, gate.value, gate.x, gate.z);
  }

  checkArmyGameOver(state);
  deactivateGateGroup(state, gate.groupId, gate.id);
}

function activateGate(state: GameState, gate: Gate): void {
  if (gate.activated || state.status !== 'running') {
    return;
  }

  if (isWeaponGate(gate)) {
    activateWeaponGate(state, gate);
    return;
  }

  activateMathGate(state, gate);
}

function resolveGateCrossings(state: GameState): void {
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const frontZ = armyFrontWorldZ(playerZ, state.formationSlots);

  for (let i = 0; i < state.gates.length; i += 1) {
    const gate = state.gates[i];
    if (!gate?.active || gate.activated) {
      continue;
    }
    if (frontZ < gate.z) {
      continue;
    }
    if (!armyInGateLane(state.armyX, gate.lane)) {
      continue;
    }
    activateGate(state, gate);
    return;
  }
}

function cullPassedGates(state: GameState): void {
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const cullZ = playerZ - GATE_CONFIG.gateDepth * 2;

  for (let i = 0; i < state.gates.length; i += 1) {
    const gate = state.gates[i];
    if (!gate?.active) {
      continue;
    }
    if (gate.explodeT > 0 || gate.weaponAbsorbT > 0) {
      continue;
    }
    if (gate.z < cullZ && gate.activated) {
      gate.active = false;
      continue;
    }
    if (gate.z < cullZ - 1.5 && !gate.activated) {
      gate.active = false;
    }
  }
}

export function updateGateVisuals(state: GameState, dt: number): void {
  if (state.gatePulse > 0) {
    state.gatePulse = Math.max(0, state.gatePulse - dt);
  }

  for (let i = 0; i < state.gates.length; i += 1) {
    const gate = state.gates[i];
    if (!gate?.active) {
      continue;
    }
    if (gate.valueFlash > 0) {
      gate.valueFlash = Math.max(0, gate.valueFlash - dt);
    }
    if (gate.explodeT > 0) {
      const wasExploding = gate.explodeT > 0;
      gate.explodeT = Math.max(0, gate.explodeT - dt);
      if (wasExploding && gate.explodeT <= 0 && gate.weaponReady && gate.weaponAbsorbT <= 0) {
        gate.weaponAbsorbT = GATE_CONFIG.weaponGate.absorbDuration;
      }
    }
    if (gate.weaponAbsorbT > 0) {
      gate.weaponAbsorbT = Math.max(0, gate.weaponAbsorbT - dt);
      if (gate.weaponAbsorbT <= 0) {
        gate.active = false;
      }
      continue;
    }
    if (gate.evolvePulse > 0) {
      gate.evolvePulse = Math.max(0, gate.evolvePulse - dt);
      if (gate.evolvePulse <= 0) {
        gate.evolvePulseKind = 'none';
      }
    }
    if (!gate.activated && !gate.weaponReady) {
      continue;
    }
    if (gate.weaponReady && !gate.activated) {
      continue;
    }
    gate.fadeT += dt;
    if (gate.fadeT >= GATE_CONFIG.fadeOutDuration) {
      gate.active = false;
    }
  }
}

export function updateGates(
  state: GameState,
  dt: number,
  _rng: () => number = Math.random,
): void {
  if (state.status !== 'running') {
    return;
  }
  resolveGateCrossings(state);
  cullPassedGates(state);
  updateGateVisuals(state, dt);
}

/** Exported for tests — applies a gate operation exactly once. */
export function applyGateToArmy(state: GameState, gate: Gate): void {
  activateGate(state, gate);
}

/** Exported for dev controls. */
export { equipWeapon } from './weaponGate';
