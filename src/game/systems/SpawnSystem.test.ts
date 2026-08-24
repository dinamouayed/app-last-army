import { describe, expect, it } from '@jest/globals';

import { COMBAT_CONFIG } from '../config/combat';
import { GAME_CONFIG } from '../config/game';
import { createGameState } from '../engine/GameState';
import { refreshFormation } from '../army/armyState';
import { armyFrontWorldZ } from '../army/footprint';
import { countActive } from '../entities/combat';
import { playerWorldZ, worldToScreen } from '../math/camera';
import {
  asphaltLaneCenterX,
  getRoadWorldBounds,
} from '../math/roadBounds';
import { laneIndexToX } from '../math/lanes';
import type { LaneIndex } from '../types';
import { spawnBasicEnemyAt, updateEnemies } from './EnemySystem';
import {
  computeGroupSpawnX,
  minEnemySpawnZ,
  pickSpawnLane,
  spawnEnemyGroup,
  updateSpawn,
} from './SpawnSystem';

const WIDTH = 390;
const HEIGHT = 844;

function sequenceRng(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index] ?? 0.5;
    index += 1;
    return value;
  };
}

describe('spawn lanes', () => {
  it('maps rng thirds to LEFT, CENTER and RIGHT', () => {
    expect(pickSpawnLane(() => 0.0)).toBe(0);
    expect(pickSpawnLane(() => 0.32)).toBe(0);
    expect(pickSpawnLane(() => 0.5)).toBe(1);
    expect(pickSpawnLane(() => 0.9)).toBe(2);
  });

  it('places LEFT / CENTER / RIGHT groups on the matching asphalt centers', () => {
    const lanes: LaneIndex[] = [0, 1, 2];
    const margin = COMBAT_CONFIG.enemyRoadMargin + COMBAT_CONFIG.enemyVisualHalfWidth;
    const road = getRoadWorldBounds(GAME_CONFIG.camera, margin);

    for (const lane of lanes) {
      const state = createGameState();
      const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
      const minZ = minEnemySpawnZ(playerZ);
      const spawned = spawnEnemyGroup(state, 3, minZ + 8, lane, () => 0.5, minZ);
      expect(spawned).toBeGreaterThan(0);

      const center = asphaltLaneCenterX(lane, GAME_CONFIG.camera);
      for (const enemy of state.enemies) {
        if (!enemy.active) {
          continue;
        }
        expect(enemy.lane).toBe(lane);
        expect(Math.abs(enemy.x - center)).toBeLessThan(0.22);
        expect(enemy.x).toBeGreaterThanOrEqual(road.minX - 0.001);
        expect(enemy.x).toBeLessThanOrEqual(road.maxX + 0.001);
        expect(enemy.z).toBeGreaterThanOrEqual(minZ);
      }
    }
  });

  it('keeps cluster offsets on asphalt and inside the chosen lane', () => {
    const lanes: LaneIndex[] = [0, 1, 2];
    const margin = COMBAT_CONFIG.enemyRoadMargin + COMBAT_CONFIG.enemyVisualHalfWidth;
    const road = getRoadWorldBounds(GAME_CONFIG.camera, margin);

    for (const lane of lanes) {
      const center = asphaltLaneCenterX(lane, GAME_CONFIG.camera);
      for (const offset of [-0.2, 0, 0.2]) {
        const x = computeGroupSpawnX(lane, offset);
        expect(x).toBeGreaterThanOrEqual(road.minX - 0.001);
        expect(x).toBeLessThanOrEqual(road.maxX + 0.001);
        expect(Math.abs(x - center)).toBeLessThan(asphaltLaneCenterX(2, GAME_CONFIG.camera) * 0.55);
      }
    }
  });
});

describe('spawn depth', () => {
  it('spawns every group ahead of the army front toward the horizon', () => {
    const state = createGameState();
    state.armySize = 40;
    refreshFormation(state);
    state.spawnTimer = 0;

    updateSpawn(state, 1 / 60, sequenceRng([0.5, 0, 0.1, 0.2, 0.8, 0.4]));

    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const frontZ = armyFrontWorldZ(playerZ, state.formationSlots);
    const minZ = minEnemySpawnZ(frontZ);
    expect(countActive(state.enemies)).toBeGreaterThan(0);

    for (const enemy of state.enemies) {
      if (!enemy.active) {
        continue;
      }
      expect(enemy.z).toBeGreaterThan(playerZ);
      expect(enemy.z).toBeGreaterThanOrEqual(minZ);
      expect(enemy.z).toBeGreaterThan(frontZ + 20);
    }
  });

  it('never lets jitter or group depth pull a spawn behind the army', () => {
    const state = createGameState();
    state.spawnTimer = 0;
    // Extreme rng: 0 for jitter (minimum spawnAhead), then LEFT, then negative-looking offsets.
    updateSpawn(state, 1 / 60, () => 0);

    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const minZ = minEnemySpawnZ(playerZ);
    for (const enemy of state.enemies) {
      if (!enemy.active) {
        continue;
      }
      expect(enemy.z).toBeGreaterThanOrEqual(minZ);
      expect(enemy.z).toBeGreaterThan(playerZ + COMBAT_CONFIG.minSpawnAhead - 0.001);
    }
  });

  it('projects spawned enemies above the army, not at the player depth', () => {
    const state = createGameState();
    state.spawnTimer = 0;
    updateSpawn(state, 1 / 60, () => 0.5);

    const camera = GAME_CONFIG.camera;
    const playerZ = playerWorldZ(state.distance, camera);
    const player = worldToScreen(0, playerZ, state.distance, WIDTH, HEIGHT, camera);
    const enemy = state.enemies.find((item) => item.active);
    expect(enemy).toBeDefined();

    const point = worldToScreen(
      enemy!.x,
      enemy!.z,
      state.distance,
      WIDTH,
      HEIGHT,
      camera,
    );
    expect(point.screenY).toBeLessThan(player.screenY - 80);
  });
});

describe('spawn screen placement', () => {
  it('keeps LEFT / CENTER / RIGHT spawns between the projected asphalt edges', () => {
    const camera = GAME_CONFIG.camera;
    const cameraZ = 0;
    const spawnZ = playerWorldZ(cameraZ, camera) + COMBAT_CONFIG.spawnAhead;
    const leftEdge = worldToScreen(-camera.roadHalfWidth, spawnZ, cameraZ, WIDTH, HEIGHT, camera);
    const rightEdge = worldToScreen(camera.roadHalfWidth, spawnZ, cameraZ, WIDTH, HEIGHT, camera);
    const lanes: LaneIndex[] = [0, 1, 2];

    for (const lane of lanes) {
      const x = computeGroupSpawnX(lane, 0);
      const point = worldToScreen(x, spawnZ, cameraZ, WIDTH, HEIGHT, camera);
      expect(point.screenX).toBeGreaterThan(leftEdge.screenX);
      expect(point.screenX).toBeLessThan(rightEdge.screenX);
    }

    const left = worldToScreen(computeGroupSpawnX(0, 0), spawnZ, cameraZ, WIDTH, HEIGHT, camera);
    const center = worldToScreen(computeGroupSpawnX(1, 0), spawnZ, cameraZ, WIDTH, HEIGHT, camera);
    const right = worldToScreen(computeGroupSpawnX(2, 0), spawnZ, cameraZ, WIDTH, HEIGHT, camera);
    expect(left.screenX).toBeLessThan(center.screenX);
    expect(center.screenX).toBeLessThan(right.screenX);
    expect(center.screenX).toBeCloseTo(WIDTH / 2, 5);
  });
});

describe('enemy depth clamp', () => {
  it('does not let an opposite-lane enemy pass behind the army front', () => {
    const state = createGameState();
    state.armySize = 8;
    state.armyX = laneIndexToX(0, GAME_CONFIG.laneSpacing);
    state.targetLane = 0;
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const frontZ = armyFrontWorldZ(playerZ, state.formationSlots);
    const enemy = spawnBasicEnemyAt(
      state,
      asphaltLaneCenterX(2, GAME_CONFIG.camera),
      playerZ + 0.4,
    );
    expect(enemy).not.toBeNull();

    for (let i = 0; i < 240; i += 1) {
      updateEnemies(state, 1 / 60);
      expect(enemy!.z).toBeGreaterThanOrEqual(frontZ - enemy!.radius * 0.21);
    }
  });
});
