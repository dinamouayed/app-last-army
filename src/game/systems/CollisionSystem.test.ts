import { describe, expect, it } from '@jest/globals';

import { GATE_CONFIG } from '../config/gates';
import { WEAPONS } from '../config/weapons';
import { createGameState } from '../engine/GameState';
import { createEmptyGate } from '../entities/gates';
import { resolveProjectileCollisions } from './CollisionSystem';
import { spawnBasicEnemyAt } from './EnemySystem';
import { applyProjectileGateHit } from './GateSystem';
import { fireCurrentWeapon } from './ShootingSystem';

function makeShootableGate(signedValue: number, x: number, z: number) {
  const gate = createEmptyGate();
  gate.active = true;
  gate.shootable = true;
  gate.signedValue = signedValue;
  gate.operation = signedValue >= 0 ? 'add' : 'subtract';
  gate.value = Math.abs(signedValue);
  gate.x = x;
  gate.z = z;
  gate.lane = 1;
  return gate;
}

describe('projectile gate collisions', () => {
  it('damages a shootable gate when no enemy blocks the shot', () => {
    const state = createGameState();
    state.gates.push(makeShootableGate(-10, 0, 30));
    const projectile = fireCurrentWeapon(state);
    expect(projectile).not.toBeNull();
    projectile!.x = 0;
    projectile!.prevX = 0;
    projectile!.prevZ = 20;
    projectile!.z = 32;

    resolveProjectileCollisions(state);

    expect(projectile!.active).toBe(false);
    expect(state.gates[0]?.signedValue).toBe(-10);
    expect(state.gates[0]?.damageBuffer).toBe(1);
  });

  it('prioritizes enemies over gates on the same projectile path', () => {
    const state = createGameState();
    state.gates.push(makeShootableGate(-10, 0, 24));
    const enemy = spawnBasicEnemyAt(state, 0, 24);
    expect(enemy).not.toBeNull();
    enemy!.hp = 100;

    const projectile = fireCurrentWeapon(state);
    expect(projectile).not.toBeNull();
    projectile!.x = 0;
    projectile!.prevX = 0;
    projectile!.prevZ = 20;
    projectile!.z = 28;

    resolveProjectileCollisions(state);

    expect(projectile!.active).toBe(false);
    expect(enemy!.hp).toBe(100 - WEAPONS.pistol.damage);
    expect(state.gates[0]?.signedValue).toBe(-10);
  });

  it('applies evolved value when the army crosses a shootable gate', () => {
    const state = createGameState();
    state.armySize = 20;
    const gate = makeShootableGate(-10, 0, 12);
    state.gates.push(gate);
    applyProjectileGateHit(state, 0, WEAPONS.pistol.damage);
    const stepsFromMinusTenToOne = 11;
    for (let i = 1; i < stepsFromMinusTenToOne * GATE_CONFIG.shootable.hitsPerStep; i += 1) {
      applyProjectileGateHit(state, 0, WEAPONS.pistol.damage);
    }

    expect(state.gates[0]?.signedValue).toBe(1);
  });

  it('does not hit a gate on another lane', () => {
    const state = createGameState();
    state.gates.push(makeShootableGate(-10, 1, 30));
    state.gates[0]!.lane = 2;
    const projectile = fireCurrentWeapon(state);
    expect(projectile).not.toBeNull();
    projectile!.x = 0;
    projectile!.prevX = 0;
    projectile!.prevZ = 20;
    projectile!.z = 32;

    resolveProjectileCollisions(state);

    expect(projectile!.active).toBe(true);
    expect(state.gates[0]?.damageBuffer).toBe(0);
  });
});

describe('projectile enemy lane lock', () => {
  it('does not hit a distant enemy on another lane', () => {
    const state = createGameState();
    const enemy = spawnBasicEnemyAt(state, 1, 24);
    expect(enemy).not.toBeNull();
    enemy!.lane = 2;

    const projectile = fireCurrentWeapon(state);
    expect(projectile).not.toBeNull();
    projectile!.x = 0;
    projectile!.prevX = 0;
    projectile!.prevZ = 20;
    projectile!.z = 28;

    resolveProjectileCollisions(state);

    expect(projectile!.active).toBe(true);
    expect(enemy!.hp).toBe(enemy!.maxHp);
  });
});
