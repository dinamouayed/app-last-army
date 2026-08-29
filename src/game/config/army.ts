import { GAME_CONFIG } from './game';

export const ARMY_CONFIG = {
  maxVisibleSoldiers: GAME_CONFIG.maxVisibleSoldiers,
  formationFrontWidth: 1,
  formationRearMaxWidth: 23,
  widthGrowEveryDepth: 1,
  formationSpacingX: 0.2,
  formationSpacingZ: 0.18,
  rearSpacingXScale: 0.028,
  /** Stretch rear rows toward the camera so a huge army spills off the bottom. */
  rearSpacingZScale: 0.058,
  formationMaxDepth: 28,
  soldierCollisionRadius: 0.24,
  /** Extra draw scale on top of GAME_CONFIG.soldierDrawScale — player army only. */
  visualScale: 0.56,
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
  leaderScaleBoost: 1.04,
  crowdScaleMin: 0.74,
  rearScaleBoost: 1.06,
} as const;

export type ArmyConfig = typeof ARMY_CONFIG;
