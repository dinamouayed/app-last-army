import { describe, expect, it } from '@jest/globals';

import { GAME_CONFIG } from '../config/game';
import { buildWorldDecorations } from './EnvironmentSystem';

const ROAD_HALF = GAME_CONFIG.camera.roadHalfWidth;

function snapshot(cameraZ: number) {
  const decorations = buildWorldDecorations(cameraZ);
  return {
    details: decorations.roadDetails.map((item) => ({
      kind: item.kind,
      x: item.x,
      z: item.z,
      seed: item.seed,
    })),
    roadside: decorations.roadside.map((item) => ({
      kind: item.kind,
      x: item.x,
      z: item.z,
      seed: item.seed,
    })),
    distant: decorations.distant.map((item) => ({
      kind: item.kind,
      x: item.x,
      z: item.z,
      seed: item.seed,
    })),
    terrain: decorations.terrain.map((item) => ({
      x: item.x,
      z: item.z,
      seed: item.seed,
    })),
  };
}

describe('buildWorldDecorations', () => {
  it('keeps roadside props outside the playable road', () => {
    const decorations = buildWorldDecorations(24);
    expect(decorations.roadside.length).toBeGreaterThan(0);
    for (const item of decorations.roadside) {
      expect(Math.abs(item.x)).toBeGreaterThan(ROAD_HALF);
    }
  });

  it('keeps distant decorations out of the three gameplay lanes', () => {
    const decorations = buildWorldDecorations(24);
    expect(decorations.distant.length).toBeGreaterThan(0);
    for (const item of decorations.distant) {
      expect(Math.abs(item.x)).toBeGreaterThan(1.2);
    }
  });

  it('keeps terrain patches off the asphalt', () => {
    const decorations = buildWorldDecorations(24);
    expect(decorations.terrain.length).toBeGreaterThan(0);
    for (const item of decorations.terrain) {
      expect(Math.abs(item.x)).toBeGreaterThan(ROAD_HALF);
    }
  });

  it('includes asphalt material cues for a still frame', () => {
    const kinds = new Set<string>();
    for (const cameraZ of [0, 12, 40, 88]) {
      for (const item of buildWorldDecorations(cameraZ).roadDetails) {
        kinds.add(item.kind);
      }
    }
    expect(kinds.has('patch')).toBe(true);
    expect(kinds.has('crack')).toBe(true);
    expect(kinds.has('grain')).toBe(true);
    expect(kinds.has('tire')).toBe(true);
  });

  it('is deterministic for a given cameraZ', () => {
    const first = snapshot(40);
    const second = snapshot(40);
    expect(second).toEqual(first);
  });
});
