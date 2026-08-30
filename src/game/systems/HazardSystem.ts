import { armyFrontWorldZ } from '../army/footprint';
import { HAZARD_CONFIG, pickHazardLanes } from '../config/hazards';
import { GAME_CONFIG } from '../config/game';
import { acquireEntity } from '../entities/combat';
import type { Particle } from '../entities/combat';
import { COMBAT_CONFIG } from '../config/combat';
import { FEEL_CONFIG } from '../config/feel';
import { addCameraShake, pushFeedback } from '../feel/feedback';
import { createEmptyHazard, livingHazardCount } from '../entities/hazards';
import type { Hazard } from '../entities/hazards';
import { playerWorldZ } from '../math/camera';
import { asphaltLaneBounds, asphaltLaneCenterX } from '../math/roadBounds';
import { difficultyProgress } from '../config/difficulty';
import type { GameState, LaneIndex } from '../types';
import { checkArmyGameOver, removeSoldiers } from '../army/armyState';

function nextHazardId(state: GameState): number {
  const id = state.nextEntityId;
  state.nextEntityId += 1;
  return id;
}

function armyInHazardLane(armyX: number, lane: LaneIndex): boolean {
  const bounds = asphaltLaneBounds(lane, GAME_CONFIG.camera, 0.04);
  return armyX >= bounds.minX && armyX <= bounds.maxX;
}

function twoLaneChance(distance: number): number {
  const t = difficultyProgress(distance);
  return (
    HAZARD_CONFIG.twoLaneChanceStart +
    (HAZARD_CONFIG.twoLaneChanceLate - HAZARD_CONFIG.twoLaneChanceStart) * t
  );
}

/** Local fireball used before the game-over screen (TNT crate, fatal boss slam). */
export function spawnExplosionBurst(state: GameState, x: number, z: number): void {
  state.explosionBurst = HAZARD_CONFIG.explosionDuration;
  state.explosionBurstX = x;
  state.explosionBurstZ = z;
  state.armyShake = Math.max(state.armyShake, HAZARD_CONFIG.explosionShakeDuration);
  addCameraShake(state, FEEL_CONFIG.explosionShake);

  const count = HAZARD_CONFIG.explosionParticleCount;
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
    const angle = (i / count) * Math.PI * 2 + (i % 4) * 0.18;
    const speed = 4.2 + (i % 6) * 1.8;
    particle.active = true;
    particle.kind = 'explosion';
    particle.x = x + Math.cos(angle) * 0.08;
    particle.z = z + Math.sin(angle) * 0.06;
    particle.vx = Math.cos(angle) * speed;
    particle.vz = Math.sin(angle) * speed * 0.72 - 1.1;
    particle.life = COMBAT_CONFIG.particleLife * (1.35 + (i % 3) * 0.25);
    particle.maxLife = particle.life;
  }
}

function activateHazard(state: GameState, hazard: Hazard): void {
  if (hazard.activated || state.status !== 'running') {
    return;
  }
  hazard.activated = true;
  hazard.fadeT = 0;
  removeSoldiers(state, state.armySize, hazard.x, hazard.z);
  spawnExplosionBurst(state, hazard.x, hazard.z);
  pushFeedback(state, 'explosion');
  checkArmyGameOver(state);
}

export function spawnHazardSet(state: GameState, rng: () => number = Math.random): number {
  if (livingHazardCount(state.hazards) >= HAZARD_CONFIG.maxHazards) {
    return 0;
  }

  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const armyFrontZ = armyFrontWorldZ(playerZ, state.formationSlots);
  const minZ = armyFrontZ + HAZARD_CONFIG.minSpawnAhead;
  const spawnZ = Math.max(minZ, armyFrontZ + HAZARD_CONFIG.spawnAhead);
  const twoLane = rng() < twoLaneChance(state.distance);
  const lanes = pickHazardLanes(twoLane, rng);
  const groupId = state.nextGroupId;
  state.nextGroupId += 1;
  let spawned = 0;

  for (let i = 0; i < lanes.length; i += 1) {
    const lane = lanes[i];
    if (lane === undefined) {
      continue;
    }
    const hazard = acquireEntity(state.hazards, HAZARD_CONFIG.maxHazards, () => createEmptyHazard());
    if (!hazard) {
      break;
    }
    hazard.id = nextHazardId(state);
    hazard.groupId = groupId;
    hazard.active = true;
    hazard.lane = lane;
    hazard.x = asphaltLaneCenterX(lane, GAME_CONFIG.camera);
    hazard.z = spawnZ;
    hazard.activated = false;
    hazard.fadeT = 0;
    spawned += 1;
  }

  return spawned;
}

/** Removes hazards too close to a world depth (boss spawn, etc.). */
export function clearHazardsNearWorldZ(state: GameState, z: number, clearance: number): number {
  let cleared = 0;
  for (let i = 0; i < state.hazards.length; i += 1) {
    const hazard = state.hazards[i];
    if (!hazard?.active) {
      continue;
    }
    if (hazard.z - clearance < z && pitFarZ(hazard) + clearance > z) {
      hazard.active = false;
      cleared += 1;
    }
  }
  return cleared;
}

function pitFarZ(hazard: Hazard): number {
  return hazard.z + HAZARD_CONFIG.length;
}

function resolveHazardCrossings(state: GameState): void {
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const frontZ = armyFrontWorldZ(playerZ, state.formationSlots);

  for (let i = 0; i < state.hazards.length; i += 1) {
    const hazard = state.hazards[i];
    if (!hazard?.active || hazard.activated) {
      continue;
    }
    if (frontZ < hazard.z || playerZ > pitFarZ(hazard)) {
      continue;
    }
    if (!armyInHazardLane(state.armyX, hazard.lane)) {
      continue;
    }
    activateHazard(state, hazard);
    return;
  }
}

function cullPassedHazards(state: GameState): void {
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);

  for (let i = 0; i < state.hazards.length; i += 1) {
    const hazard = state.hazards[i];
    if (!hazard?.active) {
      continue;
    }
    if (pitFarZ(hazard) < playerZ - 1.2) {
      hazard.active = false;
    }
  }
}

export function updateHazards(state: GameState, _dt: number): void {
  if (state.status !== 'running') {
    return;
  }

  resolveHazardCrossings(state);
  cullPassedHazards(state);
}
