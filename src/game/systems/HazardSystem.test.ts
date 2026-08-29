import { describe, expect, it } from '@jest/globals';

import { GAME_CONFIG } from '../config/game';
import { HAZARD_CONFIG, pickHazardLanes } from '../config/hazards';
import { createGameState } from '../engine/GameState';
import { refreshFormation } from '../army/armyState';
import { countActive } from '../entities/combat';
import { createEmptyHazard } from '../entities/hazards';
import { playerWorldZ } from '../math/camera';
import { armyFrontWorldZ } from '../army/footprint';
import { asphaltLaneCenterX } from '../math/roadBounds';
import { laneIndexToX } from '../math/lanes';
import { updateHazards } from './HazardSystem';
import type { GameState, LaneIndex } from '../types';

function placeHazard(state: GameState, lane: LaneIndex, z: number) {
  const hazard = createEmptyHazard();
  hazard.active = true;
  hazard.lane = lane;
  hazard.x = asphaltLaneCenterX(lane, GAME_CONFIG.camera);
  hazard.z = z;
  state.hazards.push(hazard);
  return hazard;
}

describe('pickHazardLanes', () => {
  it('never blocks all three lanes', () => {
    for (let i = 0; i < 40; i += 1) {
      const one = pickHazardLanes(false, () => (i * 0.17) % 1);
      const two = pickHazardLanes(true, () => (i * 0.23) % 1);
      expect(one.length).toBe(1);
      expect(two.length).toBe(2);
      expect(new Set(one).size).toBe(one.length);
      expect(new Set(two).size).toBe(two.length);
    }
  });
});

describe('hazard activation', () => {
  it('kills the army that hits a TNT crate', () => {
    const state = createGameState();
    state.armySize = 40;
    state.targetLane = 1;
    state.armyX = laneIndexToX(1, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const frontZ = armyFrontWorldZ(playerZ, state.formationSlots);
    const hazard = placeHazard(state, 1, frontZ - 0.1);

    updateHazards(state, 1 / 60);
    expect(state.armySize).toBe(0);
    expect(state.status).toBe('gameover');
    expect(hazard.activated).toBe(true);
    expect(state.explosionBurst).toBe(HAZARD_CONFIG.explosionDuration);
    expect(state.explosionBurstX).toBe(hazard.x);
    expect(state.explosionBurstZ).toBe(hazard.z);
    expect(countActive(state.particles)).toBeGreaterThan(8);
    expect(state.particles.some((particle) => particle.active && particle.kind === 'explosion')).toBe(
      true,
    );
  });

  it('does not trigger when the army uses a free lane', () => {
    const state = createGameState();
    state.armySize = 40;
    state.targetLane = 0;
    state.armyX = laneIndexToX(0, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const frontZ = armyFrontWorldZ(playerZ, state.formationSlots);
    const hazard = placeHazard(state, 2, frontZ - 0.1);

    updateHazards(state, 1 / 60);
    expect(state.armySize).toBe(40);
    expect(state.status).toBe('running');
    expect(hazard.activated).toBe(false);
    expect(state.explosionBurst).toBe(0);
  });
});
