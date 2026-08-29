import { COMBAT_CONFIG } from '../config/combat';
import { GAME_CONFIG } from '../config/game';
import { GATE_CONFIG } from '../config/gates';
import type { GameState } from '../types';
import { isWeaponGate } from '../entities/gates';
import { segmentCircleHitT } from '../math/collision';
import { nearestAsphaltLane } from '../math/roadBounds';
import {
  buildArmyFootprintForState,
  isEnemyInArmyContact,
} from '../army/contactFiring';
import { enemyOverlapsArmyFootprint } from '../army/footprint';
import { applyProjectileGateHit } from './GateSystem';
import { applyProjectileBossHit } from './BossSystem';
import { killEnemy } from './EnemySystem';
import type { FootprintSlice } from '../army/footprint';

export function applyProjectileHit(state: GameState, enemyIndex: number, damage: number): void {
  const enemy = state.enemies[enemyIndex];
  if (!enemy?.active || enemy.dying) {
    return;
  }
  enemy.hp -= damage;
  enemy.hitFlash = COMBAT_CONFIG.hitFlashDuration;
  if (enemy.behavior !== 'attacking') {
    enemy.z += COMBAT_CONFIG.hitKnockback;
  }
  if (enemy.hp <= 0) {
    killEnemy(state, enemy);
  }
}

function enemyHitRadius(enemy: { radius: number }, inContact: boolean): number {
  if (inContact) {
    return enemy.radius + COMBAT_CONFIG.contactProjectileHitBonus;
  }
  return enemy.radius;
}

function onSameLane(ax: number, bx: number): boolean {
  return nearestAsphaltLane(ax, GAME_CONFIG.camera) === nearestAsphaltLane(bx, GAME_CONFIG.camera);
}

function findBestBossHit(
  state: GameState,
  prevX: number,
  prevZ: number,
  x: number,
  z: number,
  radiusPad: number,
  footprint: FootprintSlice[],
): { t: number } | null {
  const boss = state.boss;
  if (!boss.active || boss.dying) {
    return null;
  }
  const inContact = boss.behavior === 'fighting'
    ? enemyOverlapsArmyFootprint(boss.x, boss.z, boss.radius, footprint)
    : false;
  if (!inContact && !onSameLane(x, boss.x)) {
    return null;
  }
  const hitRadius = inContact
    ? boss.radius + COMBAT_CONFIG.contactProjectileHitBonus
    : boss.radius;
  const t = segmentCircleHitT(
    prevX,
    prevZ,
    x,
    z,
    boss.x,
    boss.z,
    hitRadius + radiusPad,
  );
  if (t === null) {
    return null;
  }
  return { t };
}

function findBestEnemyHit(
  state: GameState,
  prevX: number,
  prevZ: number,
  x: number,
  z: number,
  radiusPad: number,
  footprint: FootprintSlice[],
): { index: number; t: number } | null {
  let bestT = 2;
  let bestIndex = -1;

  for (let e = 0; e < state.enemies.length; e += 1) {
    const enemy = state.enemies[e];
    if (!enemy?.active || enemy.dying) {
      continue;
    }
    const inContact = isEnemyInArmyContact(enemy, footprint);
    if (!onSameLane(x, enemy.x)) {
      continue;
    }
    const t = segmentCircleHitT(
      prevX,
      prevZ,
      x,
      z,
      enemy.x,
      enemy.z,
      enemyHitRadius(enemy, inContact) + radiusPad,
    );
    if (t !== null && t < bestT) {
      bestT = t;
      bestIndex = e;
    }
  }

  if (bestIndex < 0) {
    return null;
  }
  return { index: bestIndex, t: bestT };
}

function gateHitRadius(gate: { kind: string; shootable: boolean }): number {
  if (isWeaponGate(gate as Parameters<typeof isWeaponGate>[0])) {
    return GATE_CONFIG.weaponGate.hitRadius;
  }
  return GATE_CONFIG.shootable.hitRadius;
}

function isHittableGate(gate: {
  active: boolean;
  activated: boolean;
  kind: string;
  shootable: boolean;
  weaponReady: boolean;
}): boolean {
  if (!gate.active || gate.activated) {
    return false;
  }
  if (isWeaponGate(gate as Parameters<typeof isWeaponGate>[0])) {
    return !gate.weaponReady;
  }
  return gate.shootable;
}

function findBestGateHit(
  state: GameState,
  prevX: number,
  prevZ: number,
  x: number,
  z: number,
  radiusPad: number,
): { index: number; t: number } | null {
  let bestT = 2;
  let bestIndex = -1;

  for (let g = 0; g < state.gates.length; g += 1) {
    const gate = state.gates[g];
    if (!gate || !isHittableGate(gate)) {
      continue;
    }
    if (!onSameLane(x, gate.x)) {
      continue;
    }
    const t = segmentCircleHitT(
      prevX,
      prevZ,
      x,
      z,
      gate.x,
      gate.z,
      gateHitRadius(gate) + radiusPad,
    );
    if (t !== null && t < bestT) {
      bestT = t;
      bestIndex = g;
    }
  }

  if (bestIndex < 0) {
    return null;
  }
  return { index: bestIndex, t: bestT };
}

export function resolveProjectileEnemyCollisions(state: GameState): void {
  resolveProjectileCollisions(state);
}

/** Bosses take priority over enemies; enemies over shootable / weapon gates. */
export function resolveProjectileCollisions(state: GameState): void {
  const footprint = buildArmyFootprintForState(state);

  for (let p = 0; p < state.projectiles.length; p += 1) {
    const projectile = state.projectiles[p];
    if (!projectile?.active) {
      continue;
    }

    const radiusPad = projectile.radius;
    const bossHit = findBestBossHit(
      state,
      projectile.prevX,
      projectile.prevZ,
      projectile.x,
      projectile.z,
      radiusPad,
      footprint,
    );
    const enemyHit = findBestEnemyHit(
      state,
      projectile.prevX,
      projectile.prevZ,
      projectile.x,
      projectile.z,
      radiusPad,
      footprint,
    );
    const gateHit = findBestGateHit(
      state,
      projectile.prevX,
      projectile.prevZ,
      projectile.x,
      projectile.z,
      radiusPad,
    );

    if (bossHit && (!enemyHit || bossHit.t <= enemyHit.t) && (!gateHit || bossHit.t <= gateHit.t)) {
      applyProjectileBossHit(state, projectile.damage);
      projectile.active = false;
      continue;
    }

    if (enemyHit && (!gateHit || enemyHit.t <= gateHit.t)) {
      applyProjectileHit(state, enemyHit.index, projectile.damage);
      projectile.active = false;
      continue;
    }

    if (gateHit) {
      applyProjectileGateHit(state, gateHit.index, projectile.damage);
      projectile.active = false;
    }
  }
}
