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
    lateralSteeringSpeed: 1.35,
    maxLateralSpeed: 0.85,
    laneLocked: false,
    laneMissDespawn: 0,
    visualScale: 1.22,
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
