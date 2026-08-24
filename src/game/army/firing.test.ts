import { describe, expect, it } from '@jest/globals';

import { ARMY_CONFIG } from '../config/army';
import { GAME_CONFIG } from '../config/game';
import { createGameState } from '../engine/GameState';
import { refreshFormation } from '../army/armyState';
import {
  armyDamageMultiplier,
  firingCorridorContains,
  firingOriginCount,
  getArmyFiringOrigins,
} from '../army/firing';
import { laneIndexToX } from '../math/lanes';
import { fireCurrentWeapon } from '../systems/ShootingSystem';

describe('firing corridor', () => {
  const sizes = [1, 100, 1000] as const;
  const lanes = [0, 1, 2] as const;

  for (const armySize of sizes) {
    for (const lane of lanes) {
      it(`keeps armySize=${armySize} lane=${lane} volley inside corridor`, () => {
        const state = createGameState();
        state.armySize = armySize;
        state.targetLane = lane;
        state.armyX = laneIndexToX(lane, GAME_CONFIG.laneSpacing);
        refreshFormation(state);

        const origins = getArmyFiringOrigins(state.formationSlots, armySize);
        expect(origins.length).toBeGreaterThan(0);
        expect(origins.length).toBeLessThanOrEqual(ARMY_CONFIG.maxFiringOrigins);

        for (const origin of origins) {
          expect(Math.abs(origin.offsetX)).toBeLessThanOrEqual(
            ARMY_CONFIG.fireCorridorHalfWidth + 0.001,
          );
        }

        state.projectiles = [];
        fireCurrentWeapon(state);
        for (const projectile of state.projectiles) {
          if (!projectile.active) {
            continue;
          }
          expect(firingCorridorContains(projectile.x, state.armyX)).toBe(true);
        }
      });
    }
  }

  it('does not pick rear-wide formation offsets as firing origins', () => {
    const state = createGameState();
    state.armySize = 500;
    refreshFormation(state);

    const origins = getArmyFiringOrigins(state.formationSlots, 500);
    for (const origin of origins) {
      expect(Math.abs(origin.offsetX)).toBeLessThanOrEqual(
        ARMY_CONFIG.fireCorridorHalfWidth + 0.001,
      );
    }
  });
});

describe('firepower scaling', () => {
  it('caps origin count and increases damage multiplier', () => {
    expect(firingOriginCount(1)).toBe(1);
    expect(firingOriginCount(1000)).toBeLessThanOrEqual(ARMY_CONFIG.maxFiringOrigins);
    expect(armyDamageMultiplier(1000)).toBeGreaterThan(armyDamageMultiplier(1));
    expect(armyDamageMultiplier(1000)).toBeLessThanOrEqual(ARMY_CONFIG.armyDamageScaleMax);
  });
});
