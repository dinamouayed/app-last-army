import {
  addSoldiers,
  checkArmyGameOver,
  multiplyArmySize,
  removeSoldiers,
} from '../army/armyState';
import { armyFrontWorldZ } from '../army/footprint';
import { GATE_CONFIG } from '../config/gates';
import { GAME_CONFIG } from '../config/game';
import { acquireEntity } from '../entities/combat';
import type { Particle } from '../entities/combat';
import type { Gate } from '../entities/gates';
import { createEmptyGate, livingGateCount } from '../entities/gates';
import { playerWorldZ } from '../math/camera';
import { asphaltLaneBounds, asphaltLaneCenterX } from '../math/roadBounds';
import type { GameState, LaneIndex } from '../types';
import { generateGateChoices } from './GateGenerator';
import { applyHitToShootableGate, syncShootableGateDerived } from './gateEvolution';
import { COMBAT_CONFIG } from '../config/combat';

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

function pickGateSpacing(rng: () => number): number {
  const span = GATE_CONFIG.maxGateSpacing - GATE_CONFIG.minGateSpacing;
  return GATE_CONFIG.minGateSpacing + rng() * span;
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
  gate.operation = choice.operation;
  gate.value = choice.value;
  gate.shootable = choice.shootable === true;
  gate.signedValue = choice.signedValue ?? 0;
  gate.damageBuffer = 0;
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
): number {
  if (livingGateCount(state.gates) >= GATE_CONFIG.maxGates) {
    return 0;
  }

  const choices = generateGateChoices(state.armySize, rng);
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

export function scheduleFirstGate(state: GameState): void {
  state.nextGateDistance = GATE_CONFIG.firstGateDistance;
}

export function updateGateSpawn(
  state: GameState,
  rng: () => number = Math.random,
): void {
  if (state.status !== 'running') {
    return;
  }
  if (state.nextGateDistance <= 0) {
    scheduleFirstGate(state);
  }
  if (state.distance < state.nextGateDistance) {
    return;
  }

  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const armyFrontZ = armyFrontWorldZ(playerZ, state.formationSlots);
  const minZ = minGateSpawnZ(armyFrontZ);
  const spawnZ = Math.max(minZ, armyFrontZ + GATE_CONFIG.spawnAhead);
  const spawned = spawnGateGroup(state, spawnZ, rng);

  if (spawned > 0) {
    state.nextGateDistance = state.distance + pickGateSpacing(rng);
  } else {
    state.nextGateDistance = state.distance + GATE_CONFIG.spawnRetryDelay * GAME_CONFIG.forwardSpeed;
  }
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

export function applyProjectileGateHit(
  state: GameState,
  gateIndex: number,
  _damage: number,
): void {
  const gate = state.gates[gateIndex];
  if (!gate?.active || !gate.shootable || gate.activated) {
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

function activateGate(state: GameState, gate: Gate): void {
  if (gate.activated || state.status !== 'running') {
    return;
  }
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
    if (gate.evolvePulse > 0) {
      gate.evolvePulse = Math.max(0, gate.evolvePulse - dt);
      if (gate.evolvePulse <= 0) {
        gate.evolvePulseKind = 'none';
      }
    }
    if (!gate.activated) {
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
  rng: () => number = Math.random,
): void {
  if (state.status !== 'running') {
    return;
  }
  updateGateSpawn(state, rng);
  resolveGateCrossings(state);
  cullPassedGates(state);
  updateGateVisuals(state, dt);
}

/** Exported for tests — applies a gate operation exactly once. */
export function applyGateToArmy(state: GameState, gate: Gate): void {
  activateGate(state, gate);
}
