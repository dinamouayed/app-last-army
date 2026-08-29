import { describe, expect, it } from '@jest/globals';

import { GAME_CONFIG } from '../config/game';
import { createGameState } from '../engine/GameState';
import { updateRunner } from './RunnerSystem';

describe('updateRunner', () => {
  it('starts a run with one soldier in the center lane', () => {
    const state = createGameState();
    expect(state.armySize).toBe(1);
    expect(state.targetLane).toBe(1);
    expect(state.distance).toBe(0);
    expect(state.status).toBe('running');
  });

  it('advances at the opening pace on the first step', () => {
    const state = createGameState();
    const dt = 1 / 60;
    updateRunner(state, dt, GAME_CONFIG);
    expect(state.distance).toBeCloseTo(GAME_CONFIG.startForwardSpeed * dt, 5);
  });

  it('increases distance based on elapsed time, not frame count', () => {
    const sixtyFps = createGameState();
    const thirtyFps = createGameState();

    for (let i = 0; i < 60; i += 1) {
      updateRunner(sixtyFps, 1 / 60, GAME_CONFIG);
    }
    for (let i = 0; i < 30; i += 1) {
      updateRunner(thirtyFps, 1 / 30, GAME_CONFIG);
    }

    expect(sixtyFps.distance).toBeGreaterThan(GAME_CONFIG.startForwardSpeed);
    expect(sixtyFps.distance).toBeLessThan(GAME_CONFIG.maxForwardSpeed);
    expect(thirtyFps.distance).toBeGreaterThan(GAME_CONFIG.startForwardSpeed);
    expect(thirtyFps.distance).toBeLessThan(GAME_CONFIG.maxForwardSpeed);
    expect(sixtyFps.distance).toBeCloseTo(thirtyFps.distance, 2);
  });

  it('moves the army toward the selected lane over time', () => {
    const state = createGameState();
    state.targetLane = 0;
    updateRunner(state, 0.25, GAME_CONFIG);
    expect(state.armyX).toBeLessThan(0);
    expect(state.armyX).toBeGreaterThan(-1);
  });

  it('stops the run when army size reaches zero', () => {
    const state = createGameState();
    state.armySize = 0;
    updateRunner(state, 1 / 60, GAME_CONFIG);
    expect(state.status).toBe('gameover');
  });

  it('does not keep moving after game over', () => {
    const state = createGameState();
    state.status = 'gameover';
    state.armySize = 0;
    updateRunner(state, 1, GAME_CONFIG);
    expect(state.distance).toBe(0);
  });
});
