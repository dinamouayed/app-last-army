export type EnemyId = 'basic' | 'charger';
export type EnemyBehaviorState = 'approaching' | 'engaging' | 'attacking';

export interface EnemyConfig {
  id: EnemyId;
  maxHp: number;
  approachSpeed: number;
  engagingForwardSpeed: number;
  collisionRadius: number;
  /** Floor for contact damage — used when the army is still small. */
  armyDamagePerAttack: number;
  /** Share of current army removed per contact tick (large armies). */
  armyDamageFraction: number;
  attackInterval: number;
  /** Begin steering toward army footprint within this world distance. */
  engagementStartDistance: number;
  /** Depth window where near-miss enemies still seek the crowd. */
  nearCombatDepth: number;
  lateralSteeringSpeed: number;
  maxLateralSpeed: number;
  /** Stay in the spawn lane so the player must swipe to shoot them. */
  laneLocked: boolean;
  /** Seconds a missed lane-locked enemy waits at the front before despawning. */
  laneMissDespawn: number;
  visualScale: number;
}

export const ENEMIES = {
  basic: {
    id: 'basic',
    maxHp: 60,
    approachSpeed: 2.1,
    engagingForwardSpeed: 0.45,
    collisionRadius: 0.42,
    armyDamagePerAttack: 1,
    armyDamageFraction: 0.02,
    attackInterval: 0.8,
    engagementStartDistance: 4.5,
    nearCombatDepth: 1.2,
    lateralSteeringSpeed: 0,
    maxLateralSpeed: 0,
    laneLocked: true,
    laneMissDespawn: 0,
    visualScale: 1.28,
  },
  charger: {
    id: 'charger',
    maxHp: 14,
    approachSpeed: 5.6,
    engagingForwardSpeed: 1.55,
    collisionRadius: 0.34,
    armyDamagePerAttack: 2,
    armyDamageFraction: 0.07,
    attackInterval: 0.55,
    engagementStartDistance: 5.2,
    nearCombatDepth: 1.4,
    lateralSteeringSpeed: 0,
    maxLateralSpeed: 0,
    laneLocked: true,
    laneMissDespawn: 1.7,
    visualScale: 0.88,
  },
} as const satisfies Record<EnemyId, EnemyConfig>;

export function getEnemyConfig(id: EnemyId): EnemyConfig {
  return ENEMIES[id];
}

/**
 * Perspective grows as 1/depth. Uncompressed, a red soldier at the army
 * is more than twice the size of a blue one. Soft-cap the last stretch.
 */
export const ENEMY_DRAW = {
  nearScaleCap: 0.48,
  nearScaleEase: 0.12,
} as const;

export function enemyPerspectiveScale(perspectiveScale: number): number {
  const cap = ENEMY_DRAW.nearScaleCap;
  if (perspectiveScale <= cap) {
    return perspectiveScale;
  }
  return cap + (perspectiveScale - cap) * ENEMY_DRAW.nearScaleEase;
}

/** `scaleMul` for SoldierRenderer — visualScale with near-camera compression. */
export function enemyDrawScaleMul(kind: EnemyId, perspectiveScale: number): number {
  const compressed = enemyPerspectiveScale(perspectiveScale);
  return ENEMIES[kind].visualScale * (compressed / Math.max(perspectiveScale, 0.001));
}

/** Contact ticks scale with army size so a huge crowd cannot tank forever. */
export function enemyContactDamage(
  armySize: number,
  config: EnemyConfig = ENEMIES.basic,
): number {
  if (armySize <= 0) {
    return 0;
  }
  const scaled = Math.ceil(armySize * config.armyDamageFraction - 1e-9);
  return Math.max(config.armyDamagePerAttack, Math.min(armySize, scaled));
}
