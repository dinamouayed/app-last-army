import { armyFrontWorldZ } from '../army/footprint';
import { COMBAT_CONFIG } from '../config/combat';
import { getSpawnPressure, pickGroupSize } from '../config/spawnPressure';
import { GAME_CONFIG } from '../config/game';
import { playerWorldZ } from '../math/camera';
import {
  asphaltLaneCenterX,
  clampWorldXToLane,
  getRoadWorldBounds,
} from '../math/roadBounds';
import type { GameState, LaneIndex } from '../types';
import { livingEnemyCount, spawnBasicEnemyAt } from './EnemySystem';

function enemyRoadMargin(): number {
  return COMBAT_CONFIG.enemyRoadMargin + COMBAT_CONFIG.enemyVisualHalfWidth;
}

function positionIsClear(state: GameState, x: number, z: number): boolean {
  for (let i = 0; i < state.enemies.length; i += 1) {
    const enemy = state.enemies[i];
    if (!enemy?.active || enemy.dying) {
      continue;
    }
    const dx = enemy.x - x;
    const dz = enemy.z - z;
    if (dx * dx + dz * dz < COMBAT_CONFIG.minEnemySpacing * COMBAT_CONFIG.minEnemySpacing) {
      return false;
    }
  }
  return true;
}

export function pickSpawnLane(rng: () => number): LaneIndex {
  const slot = Math.floor(rng() * GAME_CONFIG.laneCount);
  if (slot <= 0) {
    return 0;
  }
  if (slot >= 2) {
    return 2;
  }
  return 1;
}

export function minEnemySpawnZ(armyFrontZ: number): number {
  return armyFrontZ + COMBAT_CONFIG.minSpawnAhead;
}

function resolveGroupMemberZ(baseZ: number, minZ: number, index: number, rng: () => number): number {
  const jitter = (rng() - 0.5) * 2 * COMBAT_CONFIG.spawnDepthSpread;
  return Math.max(minZ, baseZ + jitter + index * 0.28);
}

export function spawnEnemyGroup(
  state: GameState,
  count: number,
  baseZ: number,
  lane: LaneIndex,
  rng: () => number,
  minZ = baseZ,
): number {
  const margin = enemyRoadMargin();
  const centerX = asphaltLaneCenterX(lane, GAME_CONFIG.camera);
  const road = getRoadWorldBounds(GAME_CONFIG.camera, margin);
  let spawned = 0;

  for (let i = 0; i < count; i += 1) {
    const offset = (rng() - 0.5) * 2 * COMBAT_CONFIG.groupSpreadX;
    const x = clampWorldXToLane(centerX + offset, lane, GAME_CONFIG.camera, margin);
    const z = resolveGroupMemberZ(baseZ, minZ, i, rng);

    if (x < road.minX || x > road.maxX) {
      continue;
    }
    if (!positionIsClear(state, x, z)) {
      continue;
    }
    const enemy = spawnBasicEnemyAt(state, x, z);
    if (enemy) {
      enemy.lane = lane;
      enemy.x = x;
      spawned += 1;
    }
  }

  return spawned;
}

export function updateSpawn(
  state: GameState,
  dt: number,
  rng: () => number = Math.random,
): void {
  state.spawnTimer -= dt;
  if (state.spawnTimer > 0) {
    return;
  }

  if (livingEnemyCount(state.enemies) >= COMBAT_CONFIG.maxEnemies) {
    state.spawnTimer = COMBAT_CONFIG.spawnRetryDelay;
    return;
  }

  const pressure = getSpawnPressure(state.distance);
  const groupSize = pickGroupSize(pressure, rng);
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const armyFrontZ = armyFrontWorldZ(playerZ, state.formationSlots);
  const minZ = minEnemySpawnZ(armyFrontZ);
  const spawnZ = Math.max(
    minZ,
    armyFrontZ +
      COMBAT_CONFIG.spawnAhead +
      (rng() - 0.5) * 2 * COMBAT_CONFIG.spawnJitter,
  );
  const lane = pickSpawnLane(rng);
  const spawned = spawnEnemyGroup(state, groupSize, spawnZ, lane, rng, minZ);
  state.spawnTimer = spawned > 0 ? pressure.spawnInterval : COMBAT_CONFIG.spawnRetryDelay;
}

/** Lane-centered spawn X with a small cluster offset, always on asphalt. */
export function computeGroupSpawnX(lane: LaneIndex, memberOffset: number): number {
  const margin = enemyRoadMargin();
  const centerX = asphaltLaneCenterX(lane, GAME_CONFIG.camera);
  return clampWorldXToLane(centerX + memberOffset, lane, GAME_CONFIG.camera, margin);
}
