export type EnemyId = 'basic';
export type EnemyBehaviorState = 'approaching' | 'engaging' | 'attacking';

export interface EnemyConfig {
  id: EnemyId;
  maxHp: number;
  approachSpeed: number;
  engagingForwardSpeed: number;
  collisionRadius: number;
  armyDamagePerAttack: number;
  attackInterval: number;
  /** Begin steering toward army footprint within this world distance. */
  engagementStartDistance: number;
  /** Depth window where near-miss enemies still seek the crowd. */
  nearCombatDepth: number;
  lateralSteeringSpeed: number;
  maxLateralSpeed: number;
}

export const ENEMIES = {
  basic: {
    id: 'basic',
    maxHp: 36,
    approachSpeed: 2.1,
    engagingForwardSpeed: 0.45,
    collisionRadius: 0.38,
    armyDamagePerAttack: 1,
    attackInterval: 0.8,
    engagementStartDistance: 4.5,
    nearCombatDepth: 1.2,
    lateralSteeringSpeed: 1.35,
    maxLateralSpeed: 0.85,
  },
} as const satisfies Record<EnemyId, EnemyConfig>;

export function getEnemyConfig(id: EnemyId): EnemyConfig {
  return ENEMIES[id];
}
