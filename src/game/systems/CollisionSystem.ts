import { COMBAT_CONFIG } from '../config/combat';
import type { GameState } from '../types';
import { segmentCircleHitT } from '../math/collision';
import { killEnemy } from './EnemySystem';

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

export function resolveProjectileEnemyCollisions(state: GameState): void {
  for (let p = 0; p < state.projectiles.length; p += 1) {
    const projectile = state.projectiles[p];
    if (!projectile?.active) {
      continue;
    }

    let bestT = 2;
    let bestIndex = -1;
    const radiusPad = projectile.radius;

    for (let e = 0; e < state.enemies.length; e += 1) {
      const enemy = state.enemies[e];
      if (!enemy?.active || enemy.dying) {
        continue;
      }
      const t = segmentCircleHitT(
        projectile.prevX,
        projectile.prevZ,
        projectile.x,
        projectile.z,
        enemy.x,
        enemy.z,
        enemy.radius + radiusPad,
      );
      if (t !== null && t < bestT) {
        bestT = t;
        bestIndex = e;
      }
    }

    if (bestIndex < 0) {
      continue;
    }
    applyProjectileHit(state, bestIndex, projectile.damage);
    projectile.active = false;
  }
}
