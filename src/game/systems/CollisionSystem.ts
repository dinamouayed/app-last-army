import { COMBAT_CONFIG } from '../config/combat';
import { GATE_CONFIG } from '../config/gates';
import type { GameState } from '../types';
import { segmentCircleHitT } from '../math/collision';
import {
  buildArmyFootprintForState,
  isEnemyInArmyContact,
} from '../army/contactFiring';
import { applyProjectileGateHit } from './GateSystem';
import { killEnemy } from './EnemySystem';
import type { FootprintSlice } from '../army/footprint';

export function applyProjectileHit(state: GameState, enemyIndex: number, damage: number): void {
  const enemy = state.enemies[enemyIndex];
  if (!enemy?.active || enemy.dying) {
    return;
  }
  enemy.hp -= damage;
  enemy.hitFlash = COMBAT_CONFIG.hitFlashDuration;
  enemy.z += COMBAT_CONFIG.hitKnockback;
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
  const gateRadius = GATE_CONFIG.shootable.hitRadius + radiusPad;

  for (let g = 0; g < state.gates.length; g += 1) {
    const gate = state.gates[g];
    if (!gate?.active || !gate.shootable || gate.activated) {
      continue;
    }
    const t = segmentCircleHitT(prevX, prevZ, x, z, gate.x, gate.z, gateRadius);
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

/** Enemies take priority over shootable gates on the same projectile path. */
export function resolveProjectileCollisions(state: GameState): void {
  const footprint = buildArmyFootprintForState(state);

  for (let p = 0; p < state.projectiles.length; p += 1) {
    const projectile = state.projectiles[p];
    if (!projectile?.active) {
      continue;
    }

    const radiusPad = projectile.radius;
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
