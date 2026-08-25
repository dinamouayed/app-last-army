import type { EnemyId, EnemyBehaviorState } from '../config/enemies';
import type { WeaponId } from '../config/weapons';
import type { LaneIndex } from '../types';

export interface Projectile {
  id: number;
  active: boolean;
  x: number;
  z: number;
  prevX: number;
  prevZ: number;
  damage: number;
  speed: number;
  vx: number;
  radius: number;
}

export interface Enemy {
  id: number;
  active: boolean;
  kind: EnemyId;
  /** Spawn lane hint — gameplay position uses continuous `x`. */
  lane: LaneIndex;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  radius: number;
  hitFlash: number;
  deathT: number;
  dying: boolean;
  behavior: EnemyBehaviorState;
  attackTimer: number;
}

export interface Particle {
  active: boolean;
  x: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  maxLife: number;
  kind: 'default' | 'gatePositive' | 'gateNegative';
}

export interface CombatState {
  weaponId: WeaponId;
  unlockedWeapons: WeaponId[];
  fireAccumulator: number;
  muzzleFlash: number;
  contactPulse: number;
  contactX: number;
  contactZ: number;
  spawnTimer: number;
  nextEntityId: number;
  projectiles: Projectile[];
  enemies: Enemy[];
  particles: Particle[];
}

export function acquireEntity<T extends { active: boolean }>(
  list: T[],
  max: number,
  create: () => T,
): T | null {
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (item && !item.active) {
      return item;
    }
  }
  if (list.length >= max) {
    return null;
  }
  const item = create();
  list.push(item);
  return item;
}

export function countActive(list: { active: boolean }[]): number {
  let count = 0;
  for (let i = 0; i < list.length; i += 1) {
    if (list[i]?.active) {
      count += 1;
    }
  }
  return count;
}

export function livingEnemyCount(enemies: Enemy[]): number {
  let count = 0;
  for (let i = 0; i < enemies.length; i += 1) {
    const enemy = enemies[i];
    if (enemy?.active && !enemy.dying) {
      count += 1;
    }
  }
  return count;
}
