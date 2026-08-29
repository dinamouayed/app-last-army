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
  visibleSoldierCount,
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
  spawnEnemyAt,
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

  it('renders a denser crowd once the army is large', () => {
    const slots = createFormationBuffer();
    buildFormationSlots(GAME_CONFIG.maxVisibleSoldiers, slots);
    const active = slots.filter((slot) => slot.active).length;
    expect(active).toBe(GAME_CONFIG.maxVisibleSoldiers);
    expect(visibleSoldierCount(800)).toBe(GAME_CONFIG.maxVisibleSoldiers);
  });

  it('spills a large army off the bottom of the screen', () => {
    const slots = createFormationBuffer();
    buildFormationSlots(GAME_CONFIG.maxVisibleSoldiers, slots);
    const minZ = Math.min(
      ...slots.filter((slot) => slot.active).map((slot) => slot.offsetZ),
    );
    expect(minZ).toBeLessThan(-2.8);
  });

  it('grows depth before covering all lanes', () => {
    const slots = createFormationBuffer();
    buildFormationSlots(30, slots);
    const depths = slots.filter((slot) => slot.active).map((slot) => slot.depth);
    expect(Math.max(...depths)).toBeGreaterThanOrEqual(4);
    expect(maxFormationExtent(slots)).toBeGreaterThan(0.5);
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

  it('keeps a missed basic enemy in its spawn lane instead of seeking the army', () => {
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

    expect(Math.abs(enemy.x - startX)).toBeLessThan(0.08);
    expect(enemy.active).toBe(true);
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

  it('keeps a charger in its own lane instead of seeking the army', () => {
    const state = createGameState();
    state.armySize = 12;
    state.armyX = laneIndexToX(0, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const enemy = spawnEnemyAt(
      state,
      laneIndexToX(2, GAME_CONFIG.laneSpacing),
      playerZ + 2,
      'charger',
    )!;
    const startX = enemy.x;

    for (let i = 0; i < 90; i += 1) {
      updateEnemies(state, 1 / 60);
    }

    expect(enemy.kind).toBe('charger');
    expect(Math.abs(enemy.x - startX)).toBeLessThan(0.08);
    expect(enemy.approachSpeed).toBeGreaterThan(ENEMIES.basic.approachSpeed);
  });

  it('despawns a missed charger without kill credit', () => {
    const state = createGameState();
    state.armySize = 4;
    state.armyX = laneIndexToX(0, GAME_CONFIG.laneSpacing);
    refreshFormation(state);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const enemy = spawnEnemyAt(
      state,
      laneIndexToX(2, GAME_CONFIG.laneSpacing),
      playerZ + 1.2,
      'charger',
    )!;
    const killed = state.enemiesKilled;

    for (let i = 0; i < 180; i += 1) {
      updateEnemies(state, 1 / 60);
    }

    expect(enemy.active).toBe(false);
    expect(state.enemiesKilled).toBe(killed);
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
