import { describe, expect, it } from '@jest/globals';

import { refreshFormation } from '../army/armyState';
import { getContactEnemyOffsetXs } from '../army/contactFiring';
import { firingCorridorContains, getArmyFiringOrigins } from '../army/firing';
import { ARMY_CONFIG } from '../config/army';
import { WEAPONS } from '../config/weapons';
import { createGameState } from '../engine/GameState';
import { playerWorldZ } from '../math/camera';
import { laneIndexToX } from '../math/lanes';
import { resolveProjectileCollisions } from '../systems/CollisionSystem';
import { spawnBasicEnemyAt } from '../systems/EnemySystem';
import { fireCurrentWeapon, updateShooting } from '../systems/ShootingSystem';
import { updateProjectiles } from '../systems/ProjectileSystem';
import { updateEnemies } from '../systems/EnemySystem';
import { GAME_CONFIG } from '../config/game';

describe('contact firing', () => {
  it('adds firing origins toward brawling enemies on other lanes', () => {
    const state = createGameState();
    state.armySize = 20;
    state.armyX = laneIndexToX(1, GAME_CONFIG.laneSpacing);
    state.targetLane = 1;
    refreshFormation(state);

    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const enemy = spawnBasicEnemyAt(
      state,
      laneIndexToX(2, GAME_CONFIG.laneSpacing),
      playerZ + 0.25,
    );
    expect(enemy).not.toBeNull();
    enemy!.behavior = 'attacking';

    const offsets = getContactEnemyOffsetXs(state);
    expect(offsets.length).toBeGreaterThan(0);

    const origins = getArmyFiringOrigins(state.formationSlots, state.armySize, {
      contactOffsetX: offsets,
    });
    expect(
      origins.some((origin) => Math.abs(origin.offsetX) > ARMY_CONFIG.fireCorridorHalfWidth),
    ).toBe(true);
  });

  it('damages a brawling enemy without moving onto their lane', () => {
    const state = createGameState();
    state.armySize = 20;
    state.armyX = laneIndexToX(1, GAME_CONFIG.laneSpacing);
    state.targetLane = 1;
    refreshFormation(state);

    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const enemy = spawnBasicEnemyAt(
      state,
      laneIndexToX(2, GAME_CONFIG.laneSpacing),
      playerZ + 0.35,
    );
    expect(enemy).not.toBeNull();

    for (let i = 0; i < 120; i += 1) {
      updateEnemies(state, 1 / 60);
    }
    expect(enemy!.behavior === 'engaging' || enemy!.behavior === 'attacking').toBe(true);

    const startHp = enemy!.hp;
    for (let i = 0; i < 8; i += 1) {
      updateShooting(state, 1 / 3);
      updateProjectiles(state, 1 / 3);
      resolveProjectileCollisions(state);
    }

    expect(enemy!.hp).toBeLessThan(startHp);
    expect(state.armyX).toBeCloseTo(laneIndexToX(1, GAME_CONFIG.laneSpacing), 2);
  });

  it('still requires lane alignment for distant enemies', () => {
    const state = createGameState();
    state.armySize = 20;
    state.armyX = laneIndexToX(1, GAME_CONFIG.laneSpacing);
    refreshFormation(state);

    const enemy = spawnBasicEnemyAt(state, laneIndexToX(2, GAME_CONFIG.laneSpacing), 24);
    expect(enemy).not.toBeNull();
    expect(enemy!.behavior).toBe('approaching');

    const projectile = fireCurrentWeapon(state);
    expect(projectile).not.toBeNull();
    projectile!.x = state.armyX;
    projectile!.prevX = state.armyX;
    projectile!.prevZ = 20;
    projectile!.z = 28;

    resolveProjectileCollisions(state);

    expect(projectile!.active).toBe(true);
    expect(enemy!.hp).toBe(enemy!.maxHp);
  });

  it('keeps the default volley inside the narrow corridor when no brawl is active', () => {
    const state = createGameState();
    state.armySize = 100;
    state.armyX = laneIndexToX(1, GAME_CONFIG.laneSpacing);
    refreshFormation(state);

    fireCurrentWeapon(state);
    for (const projectile of state.projectiles) {
      if (!projectile.active) {
        continue;
      }
      expect(firingCorridorContains(projectile.x, state.armyX)).toBe(true);
    }
  });
});
