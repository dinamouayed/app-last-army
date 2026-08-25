import { describe, expect, it } from '@jest/globals';

import { COMBAT_CONFIG } from '../config/combat';
import { GAME_CONFIG } from '../config/game';
import { worldToScreen } from './camera';
import {
  asphaltLaneBounds,
  asphaltLaneCenterX,
  asphaltLaneWidth,
  clampWorldXToLane,
  clampWorldXToRoad,
  getRoadWorldBounds,
  nearestAsphaltLane,
} from './roadBounds';

describe('asphalt lanes', () => {
  const { camera } = GAME_CONFIG;
  const margin = COMBAT_CONFIG.enemyRoadMargin + COMBAT_CONFIG.enemyVisualHalfWidth;

  it('maps world X to the nearest asphalt third', () => {
    const width = asphaltLaneWidth(camera);
    expect(nearestAsphaltLane(-width, camera)).toBe(0);
    expect(nearestAsphaltLane(0, camera)).toBe(1);
    expect(nearestAsphaltLane(width, camera)).toBe(2);
  });

  it('keeps each lane center inside the asphalt with the enemy body margin', () => {
    const road = getRoadWorldBounds(camera, margin);
    for (const lane of [0, 1, 2] as const) {
      const center = asphaltLaneCenterX(lane, camera);
      expect(center).toBeGreaterThanOrEqual(road.minX);
      expect(center).toBeLessThanOrEqual(road.maxX);
      expect(clampWorldXToRoad(center, camera, margin)).toBeCloseTo(center, 8);
    }
  });

  it('does not let a lane offset leave the asphalt', () => {
    const road = getRoadWorldBounds(camera, margin);
    for (const lane of [0, 1, 2] as const) {
      const x = clampWorldXToLane(
        asphaltLaneCenterX(lane, camera) + 2,
        lane,
        camera,
        margin,
      );
      expect(x).toBeLessThanOrEqual(road.maxX + 0.001);
      expect(x).toBeGreaterThanOrEqual(road.minX - 0.001);
      const bounds = asphaltLaneBounds(lane, camera, margin);
      expect(x).toBeGreaterThanOrEqual(bounds.minX - 0.001);
      expect(x).toBeLessThanOrEqual(bounds.maxX + 0.001);
    }
  });

  it('projects lane centers onto the visible road at near and far depths', () => {
    const width = 390;
    const height = 844;
    const cameraZ = 10;
    for (const depth of [camera.playerDepth, camera.playerDepth + 52, camera.zFar - 4]) {
      const worldZ = cameraZ + depth;
      const leftRoad = worldToScreen(-camera.roadHalfWidth, worldZ, cameraZ, width, height, camera);
      const rightRoad = worldToScreen(camera.roadHalfWidth, worldZ, cameraZ, width, height, camera);
      for (const lane of [0, 1, 2] as const) {
        const point = worldToScreen(
          asphaltLaneCenterX(lane, camera),
          worldZ,
          cameraZ,
          width,
          height,
          camera,
        );
        expect(point.screenX).toBeGreaterThan(leftRoad.screenX);
        expect(point.screenX).toBeLessThan(rightRoad.screenX);
      }
    }
  });
});
