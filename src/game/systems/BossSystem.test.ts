import { describe, expect, it } from '@jest/globals';

import { BOSS_CONFIG, bossMaxHpForDistance, bossSlamDamageForEncounter } from '../config/bosses';
import { GAME_CONFIG } from '../config/game';
import { WEAPONS } from '../config/weapons';
import { createGameState } from '../engine/GameState';
import { createEmptyGate } from '../entities/gates';
import { playerWorldZ } from '../math/camera';
import { applyProjectileBossHit, killBoss, scheduleFirstBoss, spawnBoss, spawnBossForDev, updateBoss } from './BossSystem';
import { resolveProjectileCollisions } from './CollisionSystem';
import { clearGatesNearWorldZ } from './GateSystem';
import { updateSpawn } from './SpawnSystem';
import { fireCurrentWeapon } from './ShootingSystem';
import { updateWorld } from './WorldGenerator';

describe('boss spawning', () => {
  it('schedules the first boss at the configured distance', () => {
    const state = createGameState();
    expect(state.nextBossDistance).toBe(BOSS_CONFIG.firstBossDistance);
  });

  it('spawns a boss when distance reaches nextBossDistance', () => {
    const state = createGameState();
    state.distance = BOSS_CONFIG.firstBossDistance;
    updateBoss(state, 0);
    expect(state.boss.active).toBe(true);
    expect(state.boss.maxHp).toBe(bossMaxHpForDistance(state.distance));
    expect(state.boss.depthOffset).toBeGreaterThan(BOSS_CONFIG.fightDepthOffset);
  });

  it('keeps the boss ahead of the army while the player keeps running', () => {
    const state = createGameState();
    spawnBoss(state);
    const startDistance = state.distance;
    for (let i = 0; i < 120; i += 1) {
      state.distance += 0.5;
      updateBoss(state, 1 / 60);
    }
    expect(state.boss.active).toBe(true);
    expect(state.boss.z).toBeGreaterThan(state.distance);
    expect(state.distance - startDistance).toBeGreaterThan(20);
  });

  it('does not spawn regular enemies while a boss is active', () => {
    const state = createGameState();
    spawnBoss(state);
    state.spawnTimer = 0;
    updateSpawn(state, 0.1);
    expect(state.spawnTimer).toBeGreaterThan(0);
  });
});

describe('boss and gate separation', () => {
  it('clears gates and barrels near the boss spawn depth', () => {
    const state = createGameState();
    const bossZ = playerWorldZ(state.distance, GAME_CONFIG.camera) + BOSS_CONFIG.spawnDepthOffset;
    const mathGate = createEmptyGate();
    mathGate.active = true;
    mathGate.z = bossZ;
    const barrel = createEmptyGate();
    barrel.active = true;
    barrel.kind = 'weapon';
    barrel.z = bossZ + 20;
    state.gates[0] = mathGate;
    state.gates[1] = barrel;

    spawnBoss(state);

    expect(mathGate.active).toBe(false);
    expect(barrel.active).toBe(false);
    expect(state.boss.z).toBeCloseTo(bossZ);
  });

  it('pushes next gate spawn after a boss appears', () => {
    const state = createGameState();
    state.nextGateDistance = state.distance + 20;
    spawnBoss(state);
    expect(state.nextGateDistance).toBeGreaterThanOrEqual(
      state.distance + BOSS_CONFIG.minGateDistanceSeparation,
    );
  });

  it('defers first boss when it would overlap the next gate distance', () => {
    const state = createGameState();
    state.nextGateDistance = BOSS_CONFIG.firstBossDistance + 20;
    scheduleFirstBoss(state);
    expect(state.nextBossDistance).toBe(
      state.nextGateDistance + BOSS_CONFIG.minGateDistanceSeparation,
    );
  });

  it('does not spawn gates while a boss is active', () => {
    const state = createGameState();
    spawnBoss(state);
    state.distance = state.nextGateDistance + 100;
    updateWorld(state, 0);
    expect(state.gates.every((gate) => !gate?.active)).toBe(true);
  });

  it('keeps upcoming gate encounters away from the scheduled boss', () => {
    const state = createGameState(7);
    const approach = state.segments.find((segment) => segment.active && segment.kind === 'BossApproach');
    expect(approach).toBeDefined();
    expect(approach!.startDistance + approach!.length).toBeCloseTo(state.nextBossDistance, 0);
    const overlappingGate = state.segments.some(
      (segment) =>
        segment.active &&
        segment.kind !== 'BossApproach' &&
        segment.startDistance >= approach!.startDistance &&
        segment.startDistance < state.nextBossDistance,
    );
    expect(overlappingGate).toBe(false);
  });

  it('exports clearGatesNearWorldZ for boss spawn cleanup', () => {
    const state = createGameState();
    const gate = createEmptyGate();
    gate.active = true;
    gate.z = 100;
    state.gates[0] = gate;
    expect(clearGatesNearWorldZ(state, 100, 10)).toBe(1);
    expect(gate.active).toBe(false);
  });

  it('dev spawn places the boss closer and keeps the army alive', () => {
    const state = createGameState();
    state.armySize = 1;
    spawnBossForDev(state);
    expect(state.boss.active).toBe(true);
    expect(state.armySize).toBeGreaterThanOrEqual(BOSS_CONFIG.devSpawnMinArmy);
    expect(state.boss.depthOffset).toBe(BOSS_CONFIG.devSpawnDepthOffset);
    for (let i = 0; i < 180; i += 1) {
      updateBoss(state, 1 / 60);
      if (state.status === 'gameover') {
        break;
      }
    }
    expect(state.status).toBe('running');
    expect(state.armySize).toBeGreaterThan(0);
  });

  it('dev spawn can replace an active boss', () => {
    const state = createGameState();
    spawnBoss(state);
    const firstId = state.boss.id;
    spawnBossForDev(state);
    expect(state.boss.active).toBe(true);
    expect(state.boss.id).not.toBe(firstId);
  });
});

describe('boss combat', () => {
  it('scales slam damage with army size so large crowds visibly thin', () => {
    expect(bossSlamDamageForEncounter(320, 0, 50)).toBe(12);
    expect(bossSlamDamageForEncounter(320, 0, 5)).toBe(2);
    expect(bossSlamDamageForEncounter(320, 0, 472)).toBe(114);
    expect(bossSlamDamageForEncounter(320, 1, 50)).toBe(14);
  });

  it('reduces boss HP from projectile hits', () => {
    const state = createGameState();
    spawnBoss(state);
    const startHp = state.boss.hp;
    applyProjectileBossHit(state, WEAPONS.pistol.damage);
    expect(state.boss.hp).toBe(startHp - WEAPONS.pistol.damage);
  });

  it('kills the boss at zero HP and schedules the next encounter', () => {
    const state = createGameState();
    state.distance = 500;
    spawnBoss(state);
    killBoss(state, state.boss);
    expect(state.boss.dying).toBe(true);
    updateBoss(state, BOSS_CONFIG.deathDuration);
    expect(state.boss.active).toBe(false);
    expect(state.nextBossDistance).toBe(state.distance + BOSS_CONFIG.bossInterval);
  });

  it('consumes projectiles that hit the boss', () => {
    const state = createGameState();
    spawnBoss(state);
    const projectile = fireCurrentWeapon(state);
    expect(projectile).not.toBeNull();
    projectile!.prevX = state.armyX;
    projectile!.prevZ = state.boss.z - 0.5;
    projectile!.x = state.armyX;
    projectile!.z = state.boss.z + 0.2;
    resolveProjectileCollisions(state);
    expect(projectile!.active).toBe(false);
    expect(state.boss.hp).toBeLessThan(state.boss.maxHp);
  });

  it('slam descent does not damage soldiers before the ground pause', () => {
    const state = createGameState();
    state.armySize = 50;
    spawnBoss(state);
    state.boss.behavior = 'fighting';
    state.boss.attackPhase = 'slam';
    state.boss.attackPhaseT = 0.001;
    updateBoss(state, 0.01);
    expect(state.armySize).toBe(50);
    expect(state.boss.attackPhase).toBe('slamHold');
  });

  it('slam damage hits only after a pause on the ground', () => {
    const state = createGameState();
    state.armySize = 50;
    spawnBoss(state);
    state.boss.behavior = 'fighting';
    state.boss.attackPhase = 'slamHold';
    state.boss.slamDamageApplied = false;
    state.boss.attackPhaseT = BOSS_CONFIG.slamHoldDuration;
    updateBoss(state, BOSS_CONFIG.slamImpactPause);
    expect(state.armySize).toBe(50);
    updateBoss(state, 0.02);
    expect(state.armySize).toBe(38);
    expect(state.boss.slamDamageApplied).toBe(true);
  });
});
