export const BOSS_CONFIG = {
  /** First boss encounter distance (meters) — ~20 s of runway to grow the army. */
  firstBossDistance: 320,
  /** Distance between boss encounters after the first. */
  bossInterval: 450,
  baseMaxHp: 850,
  hpPerDistance: 2.8,
  spawnDepthOffset: 48,
  fightDepthOffset: 5.5,
  closureSpeed: 18,
  collisionRadius: 0.85,
  attackInterval: 2.4,
  firstBossAttackInterval: 2.8,
  /** Static pose before raising arms (contact only). */
  holdBeforeAttack: 0.75,
  windupRaiseDuration: 0.65,
  /** Arms held above head before the slam. */
  windupHoldDuration: 0.8,
  slamDuration: 0.45,
  /** Hands on the ground after impact. */
  slamHoldDuration: 0.85,
  recoverDuration: 0.9,
  hitFlashDuration: 0.1,
  hitKnockback: 0.12,
  deathDuration: 0.55,
  deathParticleCount: 18,
  unlockPulseDuration: 0.55,
  slamShakeDuration: 0.22,
  /** Screen scale for 205×211 atlas cells. */
  visualScale: 1.05,
  idleAnimFps: 6,
  slamBaseDamage: 8,
  slamDamagePerEncounter: 18,
  slamDamagePer100m: 2,
  /** First boss never removes more than this fraction of the army per slam. */
  firstBossMaxArmyFraction: 0.28,
  firstBossMaxSlamDamage: 12,
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

export function bossSlamDamageForEncounter(
  distance: number,
  encounterIndex: number,
  armySize: number,
): number {
  let damage = bossSlamDamage(distance, encounterIndex);
  if (encounterIndex === 0) {
    const cap = Math.max(
      1,
      Math.min(
        BOSS_CONFIG.firstBossMaxSlamDamage,
        Math.ceil(armySize * BOSS_CONFIG.firstBossMaxArmyFraction),
      ),
    );
    damage = Math.min(damage, cap);
  }
  return Math.max(1, Math.min(damage, armySize));
}
