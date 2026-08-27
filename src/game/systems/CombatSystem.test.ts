import { describe, expect, it } from '@jest/globals';

import { COMBAT_CONFIG } from '../config/combat';
import { ENEMIES } from '../config/enemies';
import { GAME_CONFIG } from '../config/game';
import { WEAPONS } from '../config/weapons';
import { createGameState } from '../engine/GameState';
import { refreshFormation } from '../army/armyState';
import { countActive } from '../entities/combat';
import { playerWorldZ } from '../math/camera';
import { laneIndexToX } from '../math/lanes';
import {
  applyProjectileHit,
  resolveProjectileEnemyCollisions,
} from './CollisionSystem';
import { updateCombat } from './CombatSystem';
import { killEnemy, spawnBasicEnemy, spawnBasicEnemyAt, updateEnemies } from './EnemySystem';
import { updateProjectiles } from './ProjectileSystem';
import { fireCurrentWeapon, updateShooting } from './ShootingSystem';
import { debugQueueSegment } from './WorldGenerator';

describe('pistol shooting', () => {
  it('fires at the configured fire rate regardless of frame size', () => {
    const sixty = createGameState();
    const thirty = createGameState();
    sixty.spawnTimer = 99;
    thirty.spawnTimer = 99;

    for (let i = 0; i < 60; i += 1) {
      updateShooting(sixty, 1 / 60);
    }
    for (let i = 0; i < 30; i += 1) {
      updateShooting(thirty, 1 / 30);
    }

    expect(countActive(sixty.projectiles)).toBe(3);
    expect(countActive(thirty.projectiles)).toBe(3);
  });

  it('moves projectiles by speed * dt', () => {
    const state = createGameState();
    const projectile = fireCurrentWeapon(state);
    expect(projectile).not.toBeNull();
    const startZ = projectile!.z;
    updateProjectiles(state, 0.1);
    expect(projectile!.z - startZ).toBeCloseTo(WEAPONS.pistol.projectileSpeed * 0.1, 5);
  });

  it('deactivates projectiles that pass the far clip', () => {
    const state = createGameState();
    const projectile = fireCurrentWeapon(state);
    expect(projectile).not.toBeNull();
    projectile!.z = state.distance + GAME_CONFIG.camera.zFar + 1;
    projectile!.prevZ = projectile!.z;
    updateProjectiles(state, 1 / 60);
    expect(projectile!.active).toBe(false);
  });
});

describe('basic enemy combat', () => {
  it('reduces HP by pistol damage and dies at hp <= 0', () => {
    const state = createGameState();
    const enemy = spawnBasicEnemy(state, 1, 20);
    expect(enemy).not.toBeNull();
    applyProjectileHit(state, 0, WEAPONS.pistol.damage);
    expect(enemy!.hp).toBe(ENEMIES.basic.maxHp - WEAPONS.pistol.damage);
    expect(enemy!.dying).toBe(false);

    applyProjectileHit(state, 0, WEAPONS.pistol.damage);
    applyProjectileHit(state, 0, WEAPONS.pistol.damage);
    expect(enemy!.hp).toBeLessThanOrEqual(0);
    expect(enemy!.dying).toBe(true);
    expect(countActive(state.particles)).toBeGreaterThan(0);
  });

  it('consumes a projectile that sweeps through an enemy', () => {
    const state = createGameState();
    const enemy = spawnBasicEnemy(state, 1, 24);
    const projectile = fireCurrentWeapon(state);
    expect(enemy).not.toBeNull();
    expect(projectile).not.toBeNull();
    projectile!.x = 0;
    projectile!.prevX = 0;
    projectile!.prevZ = 20;
    projectile!.z = 28;
    resolveProjectileEnemyCollisions(state);
    expect(projectile!.active).toBe(false);
    expect(enemy!.hp).toBe(ENEMIES.basic.maxHp - WEAPONS.pistol.damage);
  });

  it('does not hit an enemy far away on X', () => {
    const state = createGameState();
    const enemy = spawnBasicEnemyAt(state, 1.2, 24);
    const projectile = fireCurrentWeapon(state);
    expect(enemy).not.toBeNull();
    expect(projectile).not.toBeNull();
    projectile!.x = 0;
    projectile!.prevX = 0;
    projectile!.prevZ = 20;
    projectile!.z = 28;
    resolveProjectileEnemyCollisions(state);
    expect(projectile!.active).toBe(true);
    expect(enemy!.hp).toBe(ENEMIES.basic.maxHp);
  });

  it('does not damage on depth alone without horizontal overlap', () => {
    const state = createGameState();
    state.armySize = 1;
    state.armyX = laneIndexToX(0, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    spawnBasicEnemyAt(state, laneIndexToX(2, GAME_CONFIG.laneSpacing), playerZ + 0.15);
    for (let i = 0; i < 8; i += 1) {
      updateEnemies(state, 1 / 60);
    }
    expect(state.armySize).toBe(1);
  });

  it('engages and damages only on physical overlap', () => {
    const state = createGameState();
    state.armySize = 4;
    state.armyX = laneIndexToX(1, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const enemy = spawnBasicEnemyAt(state, state.armyX, playerZ + 0.4);
    expect(enemy).not.toBeNull();
    for (let i = 0; i < 240; i += 1) {
      updateEnemies(state, 1 / 60);
    }
    expect(state.armySize).toBeLessThan(4);
    expect(enemy!.active).toBe(true);
  });

  it('cleans up a dead enemy after the death animation', () => {
    const state = createGameState();
    const enemy = spawnBasicEnemy(state, 1, 30);
    expect(enemy).not.toBeNull();
    killEnemy(state, enemy!);
    updateEnemies(state, COMBAT_CONFIG.deathDuration);
    expect(enemy!.active).toBe(false);
  });

  it('moves living enemies toward the player by approachSpeed * dt', () => {
    const state = createGameState();
    const enemy = spawnBasicEnemy(state, 1, 40);
    expect(enemy).not.toBeNull();
    const startZ = enemy!.z;
    updateEnemies(state, 0.2);
    expect(startZ - enemy!.z).toBeCloseTo(ENEMIES.basic.approachSpeed * 0.2, 5);
  });
});

describe('updateCombat', () => {
  it('spawns enemies ahead of the player', () => {
    const state = createGameState();
    debugQueueSegment(state, 'EnemyWave', 0, 80);
    updateCombat(state, 1 / 60, () => 0.5);
    expect(countActive(state.enemies)).toBeGreaterThanOrEqual(1);
    const enemy = state.enemies.find((item) => item.active);
    expect(enemy).toBeDefined();
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    expect(enemy!.z).toBeGreaterThan(playerZ + 20);
  });

  it('does not simulate combat after game over', () => {
    const state = createGameState();
    state.status = 'gameover';
    state.spawnTimer = 0;
    updateCombat(state, 1, () => 0.5);
    expect(countActive(state.enemies)).toBe(0);
    expect(countActive(state.projectiles)).toBe(0);
  });
});
