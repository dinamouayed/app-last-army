import { GAME_CONFIG } from './game';

export const ARMY_CONFIG = {
  maxVisibleSoldiers: GAME_CONFIG.maxVisibleSoldiers,
  formationFrontWidth: 1,
  formationRearMaxWidth: 19,
  widthGrowEveryDepth: 1,
  formationSpacingX: 0.36,
  formationSpacingZ: 0.34,
  rearSpacingXScale: 0.045,
  formationMaxDepth: 22,
  soldierCollisionRadius: 0.28,
  hitFlashDuration: 0.12,
  deathPulseDuration: 0.2,
  shakeDuration: 0.14,
  soldierDeathDuration: 0.42,
  /** Max simultaneous firing origins per volley. */
  maxFiringOrigins: 6,
  /** Only front wedge rows up to this depth may fire. */
  maxFiringFormationDepth: 2,
  /** Half-width of offensive corridor around armyX (selected lane). */
  fireCorridorHalfWidth: 0.38,
  /** Small cluster spread among firing origins inside the corridor. */
  fireOriginClusterSpread: 0.11,
  /** Cap on aggregate damage multiplier from army size. */
  armyDamageScaleMax: 2.4,
  deathParticleCount: 14,
  leaderScaleBoost: 1.08,
  crowdScaleMin: 0.78,
  rearScaleBoost: 1.12,
} as const;

export type ArmyConfig = typeof ARMY_CONFIG;
