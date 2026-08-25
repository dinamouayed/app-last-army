export const COMBAT_CONFIG = {
  spawnAhead: 52,
  spawnJitter: 6,
  spawnDepthSpread: 1.8,
  /** Hard floor: spawn Z is never closer than this to the army front. */
  minSpawnAhead: 36,
  firstSpawnDelay: 1.1,
  minEnemySpacing: 1.6,
  maxEnemies: 14,
  maxProjectiles: 48,
  maxParticles: 24,
  projectileRadius: 0.12,
  /** Extra hit radius for enemies already brawling with the army. */
  contactProjectileHitBonus: 0.22,
  muzzleWorldX: 0.16,
  muzzleWorldZ: 0.22,
  muzzleFlashDuration: 0.06,
  hitFlashDuration: 0.09,
  hitKnockback: 0.28,
  deathDuration: 0.22,
  contactPulseDuration: 0.14,
  particleLife: 0.28,
  /** Horizontal cluster offset around a lane center — stays inside that lane. */
  groupSpreadX: 0.16,
  /** Extra padding from the asphalt edge, on top of the visual body half-width. */
  enemyRoadMargin: 0.08,
  /** Sprite half-width in world units so feet+body stay on asphalt. */
  enemyVisualHalfWidth: 0.22,
  spawnRetryDelay: 0.35,
} as const;

export type CombatConfig = typeof COMBAT_CONFIG;
