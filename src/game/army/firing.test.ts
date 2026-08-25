import { describe, expect, it } from '@jest/globals';

import { refreshFormation } from '../army/armyState';
import {
  armyDamageMultiplier,
  firingCorridorContains,
  firingOriginCount,
  getArmyFiringOrigins,
} from '../army/firing';
import { ARMY_CONFIG } from '../config/army';
import { GAME_CONFIG } from '../config/game';
import { WEAPON_PROGRESSION } from '../config/weapons';
import { createGameState } from '../engine/GameState';
import { laneIndexToX } from '../math/lanes';
import { nearestAsphaltLane } from '../math/roadBounds';
import { updateProjectiles } from '../systems/ProjectileSystem';
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

describe('lane-locked shots', () => {
  const sizes = [1, 80, 1000] as const;
  const lanes = [0, 1, 2] as const;

  for (const weaponId of WEAPON_PROGRESSION) {
    for (const armySize of sizes) {
      for (const lane of lanes) {
        it(`keeps ${weaponId} armySize=${armySize} lane=${lane} on that lane in flight`, () => {
          const state = createGameState();
          state.weaponId = weaponId;
          state.armySize = armySize;
          state.targetLane = lane;
          state.armyX = laneIndexToX(lane, GAME_CONFIG.laneSpacing);
          refreshFormation(state);

          fireCurrentWeapon(state, () => 1);
          expect(state.projectiles.some((projectile) => projectile.active)).toBe(true);

          updateProjectiles(state, 1.6);

          for (const projectile of state.projectiles) {
            expect(projectile.vx).toBe(0);
            expect(firingCorridorContains(projectile.x, state.armyX)).toBe(true);
            expect(nearestAsphaltLane(projectile.x, GAME_CONFIG.camera)).toBe(lane);
          }
        });
      }
    }
  }
});

describe('firepower scaling', () => {
  it('caps origin count and increases damage multiplier', () => {
    expect(firingOriginCount(1)).toBe(1);
    expect(firingOriginCount(1000)).toBeLessThanOrEqual(ARMY_CONFIG.maxFiringOrigins);
    expect(armyDamageMultiplier(1000)).toBeGreaterThan(armyDamageMultiplier(1));
    expect(armyDamageMultiplier(1000)).toBeLessThanOrEqual(ARMY_CONFIG.armyDamageScaleMax);
  });
});
