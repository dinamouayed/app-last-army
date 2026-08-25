export const BOSS_CONFIG = {
  /** First boss encounter distance (meters) — ~20 s of runway to grow the army. */
  firstBossDistance: 320,
  /** Distance between boss encounters after the first. */
  bossInterval: 450,
  baseMaxHp: 850,
  hpPerDistance: 2.8,
  spawnDepthOffset: 48,
  /** Dev spawn — close enough to see the Brute immediately on screen. */
  devSpawnDepthOffset: 16,
  /** Minimum army size when using the dev spawn button. */
  devSpawnMinArmy: 30,
  /** World meters ahead of the army tip — keep the slam on the front ranks. */
  fightDepthOffset: 1.05,
  closureSpeed: 10,
  collisionRadius: 0.85,
  attackInterval: 3.2,
  firstBossAttackInterval: 5.0,
  /** Static pose before raising arms (contact only). */
  holdBeforeAttack: 2.6,
  windupRaiseDuration: 2.2,
  /** Arms held above head before the slam — visual only, no damage. */
  windupHoldDuration: 1.6,
  /** Descent animation — visual only, no damage. */
  slamDuration: 1.2,
  /** Beat after hands hit the ground before soldiers are removed. */
  slamImpactPause: 0.18,
  /** Keep the slam pose (arms down) before standing back up. */
  slamHoldDuration: 5.8,
  /** Rise back to standing. */
  recoverDuration: 2.8,
  /** Standing pause after recovering, before the next idle wait. */
  recoverHoldDuration: 1.9,
  hitFlashDuration: 0.1,
  hitKnockback: 0.12,
  deathDuration: 0.55,
  deathParticleCount: 18,
  unlockPulseDuration: 0.55,
  slamShakeDuration: 0.22,
  /** Screen scale for 256×256 atlas cells. */
  visualScale: 1.12,
  idleAnimFps: 6,
  slamBaseDamage: 12,
  slamDamagePerEncounter: 10,
  slamDamagePer100m: 2,
  /** Share of the current army removed by a first-boss slam. */
  firstBossArmyFraction: 0.24,
  /** Share of the current army removed by later slams. */
  slamArmyFraction: 0.28,
  slamFractionPerEncounter: 0.06,
  /** Minimum run distance between a boss spawn and the next gate spawn. */
  minGateDistanceSeparation: 90,
  /** World-depth clearance — gates/barrels within this range of the boss are removed. */
  gateClearanceZ: 48,
} as const;

export type BossConfig = typeof BOSS_CONFIG;

export function bossMaxHpForDistance(distance: number): number {
  return Math.round(BOSS_CONFIG.baseMaxHp + distance * BOSS_CONFIG.hpPerDistance);
}

export function bossAttackInterval(encounterIndex: number): number {
  if (encounterIndex <= 0) {
    return BOSS_CONFIG.firstBossAttackInterval;
  }
  return BOSS_CONFIG.attackInterval;
}

export function bossSlamDamage(distance: number, encounterIndex: number): number {
  const distanceBonus = Math.max(
    0,
    Math.floor((distance - BOSS_CONFIG.firstBossDistance) / 100),
  ) * BOSS_CONFIG.slamDamagePer100m;
  return Math.max(
    1,
    BOSS_CONFIG.slamBaseDamage
      + encounterIndex * BOSS_CONFIG.slamDamagePerEncounter
      + distanceBonus,
  );
}

function slamArmyFraction(encounterIndex: number): number {
  if (encounterIndex <= 0) {
    return BOSS_CONFIG.firstBossArmyFraction;
  }
  return Math.min(
    0.55,
    BOSS_CONFIG.slamArmyFraction
      + (encounterIndex - 1) * BOSS_CONFIG.slamFractionPerEncounter,
  );
}

export function bossSlamDamageForEncounter(
  _distance: number,
  encounterIndex: number,
  armySize: number,
): number {
  const scaled = Math.ceil(armySize * slamArmyFraction(encounterIndex) - 1e-9);
  return Math.max(1, Math.min(armySize, scaled));
}
