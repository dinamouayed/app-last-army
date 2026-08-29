import { describe, expect, it } from '@jest/globals';

import { COMBAT_CONFIG } from '../config/combat';
import { ENEMIES } from '../config/enemies';
import { GAME_CONFIG } from '../config/game';
import { WEAPONS } from '../config/weapons';
import {
  addSoldiers,
  refreshFormation,
  removeSoldiers,
  setArmySize,
} from '../army/armyState';
import {
  buildFormationSlots,
  createFormationBuffer,
  formationFrontWidth,
  maxFormationExtent,
  wedgeRowWidth,
} from '../army/formation';
import {
  buildArmyFootprint,
  enemyOverlapsArmyFootprint,
} from '../army/footprint';
import { createGameState } from '../engine/GameState';
import { playerWorldZ } from '../math/camera';
import { getRoadWorldBoundsAtDepth } from '../math/roadBounds';
import { laneIndexToX } from '../math/lanes';
import { applyProjectileHit } from '../systems/CollisionSystem';
import {
  spawnBasicEnemyAt,
  updateEnemies,
} from '../systems/EnemySystem';
import { computeGroupSpawnX } from '../systems/SpawnSystem';
import { updateRunner } from '../systems/RunnerSystem';

describe('army arithmetic', () => {
  it('adds and removes soldiers with a zero floor', () => {
    const state = createGameState();
    addSoldiers(state, 10);
    expect(state.armySize).toBe(11);
    removeSoldiers(state, 5);
    expect(state.armySize).toBe(6);
    removeSoldiers(state, 10);
    expect(state.armySize).toBe(0);
    expect(state.status).toBe('gameover');
  });
});

describe('wedge formation', () => {
  it('keeps the front row narrow', () => {
    const slots = createFormationBuffer();
    buildFormationSlots(50, slots);
    expect(wedgeRowWidth(0)).toBe(1);
    expect(formationFrontWidth(slots)).toBeLessThan(1.2);
  });

  it('grows depth before covering all lanes', () => {
    const slots = createFormationBuffer();
    buildFormationSlots(30, slots);
    expect(maxFormationExtent(slots)).toBeGreaterThan(1);
  });
});

describe('army footprint', () => {
  it('does not overlap a distant enemy on another side of the road', () => {
    const armyX = laneIndexToX(0, GAME_CONFIG.laneSpacing);
    const playerZ = 10;
    const footprint = buildArmyFootprint(20, armyX, playerZ);
    const enemyX = laneIndexToX(2, GAME_CONFIG.laneSpacing);
    expect(
      enemyOverlapsArmyFootprint(enemyX, playerZ, ENEMIES.basic.collisionRadius, footprint),
    ).toBe(false);
  });
});

describe('enemy spawn bounds', () => {
  it('keeps generated group members inside road bounds', () => {
    const margin = COMBAT_CONFIG.enemyRoadMargin + COMBAT_CONFIG.enemyVisualHalfWidth;
    const bounds = getRoadWorldBoundsAtDepth(
      40,
      GAME_CONFIG.camera,
      margin,
    );
    const lanes: Array<0 | 1 | 2> = [0, 1, 2];

    for (const lane of lanes) {
      for (let i = 0; i < 16; i += 1) {
        const x = computeGroupSpawnX(lane, (i % 5) * 0.08 - 0.16);
        expect(x).toBeGreaterThanOrEqual(bounds.minX - 0.001);
        expect(x).toBeLessThanOrEqual(bounds.maxX + 0.001);
      }
    }
  });
});

describe('enemy engagement combat', () => {
  it('does not damage on depth alone without horizontal overlap', () => {
    const state = createGameState();
    state.armySize = 1;
    state.armyX = laneIndexToX(0, GAME_CONFIG.laneSpacing);
    state.targetLane = 0;
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    spawnBasicEnemyAt(state, laneIndexToX(2, GAME_CONFIG.laneSpacing), playerZ + 0.15);

    for (let i = 0; i < 8; i += 1) {
      updateEnemies(state, 1 / 60);
    }

    expect(state.armySize).toBe(1);
  });

  it('transitions approaching → engaging → attacking on overlap', () => {
    const state = createGameState();
    state.armySize = 20;
    state.armyX = laneIndexToX(1, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const enemy = spawnBasicEnemyAt(state, state.armyX, playerZ + 0.5);
    expect(enemy).not.toBeNull();

    let sawEngaging = false;
    let sawAttacking = false;
    for (let i = 0; i < 180; i += 1) {
      updateEnemies(state, 1 / 60);
      if (enemy!.behavior === 'engaging') {
        sawEngaging = true;
      }
      if (enemy!.behavior === 'attacking') {
        sawAttacking = true;
      }
    }

    expect(sawEngaging).toBe(true);
    expect(sawAttacking).toBe(true);
    expect(state.armySize).toBeLessThan(20);
    expect(enemy!.active).toBe(true);
  });

  it('respects attack interval between army damage ticks', () => {
    const state = createGameState();
    state.armySize = 10;
    state.armyX = laneIndexToX(1, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const enemy = spawnBasicEnemyAt(state, state.armyX, playerZ + 0.3)!;
    enemy.behavior = 'attacking';
    enemy.attackTimer = 0;

    updateEnemies(state, 0.01);
    const afterFirst = state.armySize;
    updateEnemies(state, 0.2);
    expect(afterFirst).toBe(9);
    expect(state.armySize).toBe(9);
    updateEnemies(state, ENEMIES.basic.attackInterval);
    expect(state.armySize).toBe(8);
  });

  it('prevents pass-through while attacking', () => {
    const state = createGameState();
    state.armySize = 15;
    state.armyX = laneIndexToX(1, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const enemy = spawnBasicEnemyAt(state, state.armyX, playerZ + 0.2)!;
    enemy.behavior = 'attacking';

    const startZ = enemy.z;
    for (let i = 0; i < 90; i += 1) {
      updateEnemies(state, 1 / 60);
    }

    expect(enemy.behavior).toBe('attacking');
    expect(enemy.z).toBeGreaterThan(playerZ - 2);
    expect(startZ - enemy.z).toBeLessThan(1.5);
  });

  it('allows projectile kills while attacking', () => {
    const state = createGameState();
    state.armySize = 5;
    state.armyX = laneIndexToX(1, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const enemy = spawnBasicEnemyAt(state, state.armyX, playerZ)!;
    enemy.behavior = 'attacking';

    while (enemy.hp > 0) {
      applyProjectileHit(state, 0, WEAPONS.pistol.damage);
    }

    expect(enemy.dying).toBe(true);
    expect(enemy.active).toBe(true);
  });

  it('steers a near-miss enemy toward the army instead of passing through', () => {
    const state = createGameState();
    state.armySize = 12;
    state.armyX = laneIndexToX(0, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const enemy = spawnBasicEnemyAt(state, laneIndexToX(1, GAME_CONFIG.laneSpacing), playerZ + 1)!;
    const startX = enemy.x;

    for (let i = 0; i < 200; i += 1) {
      updateEnemies(state, 1 / 60);
    }

    expect(enemy.x).toBeLessThan(startX);
    expect(enemy.behavior === 'engaging' || enemy.behavior === 'attacking').toBe(true);
  });

  it('removes a percentage of a large army on each contact tick', () => {
    const state = createGameState();
    state.armySize = 100;
    state.armyX = laneIndexToX(1, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const enemy = spawnBasicEnemyAt(state, state.armyX, playerZ + 0.3)!;
    enemy.behavior = 'attacking';
    enemy.attackTimer = 0;

    updateEnemies(state, 0.01);
    expect(state.armySize).toBe(98);
  });
});

describe('game over detection', () => {
  it('stops the runner when the army is depleted', () => {
    const state = createGameState();
    state.armySize = 0;
    updateRunner(state, 1 / 60, GAME_CONFIG);
    expect(state.status).toBe('gameover');
  });
});

describe('setArmySize', () => {
  it('supports direct set operations', () => {
    const state = createGameState();
    setArmySize(state, 20);
    expect(state.armySize).toBe(20);
  });
});
