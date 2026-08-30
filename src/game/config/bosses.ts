export const BOSS_CONFIG = {
  /** Kills required before the first boss is armed. */
  firstBossKills: 28,
  /** Additional kills required between later boss encounters. */
  bossKillInterval: 40,
  /** World meters of BossApproach after the kill threshold is met. */
  approachDistance: 48,
  /** HP scaling reference distance — spawn is kill-gated, not this value. */
  firstBossDistance: 320,
  /** Starting HP — scales with run distance only, not army size. */
  baseMaxHp: 1200,
  hpPerDistance: 3.8,
  spawnDepthOffset: 48,
  /** Dev spawn — close enough to see the Brute immediately on screen. */
  devSpawnDepthOffset: 16,
  /** Minimum army size when using the dev spawn button. */
  devSpawnMinArmy: 30,
  /** World meters ahead of the army tip — keep the slam on the front ranks. */
  fightDepthOffset: 1.05,
  closureSpeed: 10,
  collisionRadius: 0.85,
  attackInterval: 1.7,
  firstBossAttackInterval: 2.6,
  /** Static pose before the attack sequence — no damage. */
  holdBeforeAttack: 0.7,
  /** Fast wind-up frames (arms raised). */
  windupRaiseDuration: 0.42,
  /** Skip the arms-up hold — wind-up flows straight into the slam. */
  windupHoldDuration: 0,
  /** Fast slam descent — visual only, no damage until slamHold. */
  slamDuration: 0.24,
  /** Brief freeze on the ground pose before soldiers are hit. */
  slamImpactPause: 0.07,
  /** Total time held in the ground slam pose (includes impact pause). */
  slamHoldDuration: 0.28,
  /** Fast recovery frames back to standing. */
  recoverDuration: 0.36,
  /** Standing pause after recovering, before the next idle wait. */
  recoverHoldDuration: 0.4,
  /** Screen explosion burst when the slam lands. */
  slamBurstDuration: 0.48,
  hitFlashDuration: 0.1,
  hitKnockback: 0.12,
  deathDuration: 0.55,
  deathParticleCount: 18,
  unlockPulseDuration: 0.55,
  slamShakeDuration: 0.22,
  /** Screen scale for boss display cells (atlas is 1024px, drawn at 256 logical). */
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
  minGateDistanceSeparation: 56,
  /** World-depth clearance — gates/barrels within this range of the boss are removed. */
  gateClearanceZ: 48,
  /** Charge added by one valid tap (~24 fast taps fill the circle). */
  tapChargePerTap: 0.042,
  /** Charge lost per second after the idle grace — a pause dumps the circle. */
  tapChargeDecay: 1.7,
  /** Must stay above tapMaxGap so a valid mash does not leak charge. */
  tapChargeIdleGrace: 0.205,
  /** Next tap must arrive within this window or it does not add charge. */
  tapMaxGap: 0.185,
  /** Longer than this, or a swipe, is not a tap. */
  tapMaxDuration: 0.26,
  /** Horizontal move that cancels the tap candidate — below swipeThresholdPx. */
  tapCancelDxPx: 36,
  /** Fireball damage as a share of the boss's initial max HP. Never a kill. */
  tapFireballHpFraction: 0.25,
  tapFireballFlight: 0.4,
  tapFireballImpact: 0.42,
  tapPulseDuration: 0.16,
  tapHintDuration: 2.8,
  tapChargeVisualLerp: 14,
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

export function bossTapFireballDamage(maxHp: number): number {
  return Math.max(1, Math.round(maxHp * BOSS_CONFIG.tapFireballHpFraction));
}

/** 25% of initial max HP, but the fireball cannot finish the boss. */
export function bossTapFireballAppliedDamage(hp: number, maxHp: number): number {
  if (hp <= 1) {
    return 0;
  }
  return Math.min(bossTapFireballDamage(maxHp), hp - 1);
}
