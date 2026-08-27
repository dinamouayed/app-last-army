import { BOSS_CONFIG, bossMaxHpForDistance, bossSlamDamage } from './bosses';
import { COMBAT_CONFIG } from './combat';
import { ENEMIES } from './enemies';
import type { GateOperation } from './gates';

export type SegmentKind =
  | 'GateChoice'
  | 'EnemyWave'
  | 'ShootableGate'
  | 'WeaponUnlock'
  | 'MixedEncounter'
  | 'RecoverySection'
  | 'BossApproach';

export interface SegmentLengthRange {
  min: number;
  max: number;
}

/**
 * Central difficulty / world-generation balancing.
 * Tweak these values rather than scattering curves through systems.
 */
export const DIFFICULTY_CONFIG = {
  /** `factor = 1 + distance / distanceUnit`. */
  distanceUnit: 500,
  /** Progress 0→1 used by most lerp curves. Early game stays gentle. */
  fullProgressDistance: 1600,
  enemyHp: {
    maxMultiplier: 3.2,
  },
  enemySpeed: {
    maxApproach: 3.15,
    maxEngaging: 0.72,
  },
  enemyCount: {
    minStart: 1,
    maxStart: 2,
    minLate: 3,
    maxLate: 6,
  },
  spawnInterval: {
    start: 2.6,
    end: 1.28,
  },
  waveGroups: {
    start: 1,
    end: 3,
  },
  gateValue: {
    addMaxMultiplier: 2.2,
    subtractMaxMultiplier: 1.85,
  },
  shootable: {
    initialMaxMultiplier: 1.7,
  },
  weaponCost: {
    /** Additional cost multiplier per 100 m traveled. */
    per100m: 0.02,
  },
  lookaheadDistance: 300,
  recycleBehind: 48,
  maxSegments: 12,
  materializeLead: 0,
  /** Opening encounters preserve the pre-Phase-8 early pacing. */
  opening: [
    { kind: 'EnemyWave' as const, startDistance: 20, length: 28 },
    { kind: 'GateChoice' as const, startDistance: 48, length: 80 },
  ],
  segmentLengths: {
    GateChoice: { min: 72, max: 118 },
    EnemyWave: { min: 52, max: 88 },
    ShootableGate: { min: 74, max: 108 },
    WeaponUnlock: { min: 80, max: 118 },
    MixedEncounter: { min: 86, max: 126 },
    RecoverySection: { min: 58, max: 82 },
    BossApproach: { min: BOSS_CONFIG.minGateDistanceSeparation, max: BOSS_CONFIG.minGateDistanceSeparation },
  } satisfies Record<SegmentKind, SegmentLengthRange>,
  /** Base weights — Recovery / BossApproach are mostly rule-driven. */
  baseWeights: {
    GateChoice: 30,
    EnemyWave: 28,
    ShootableGate: 14,
    WeaponUnlock: 10,
    MixedEncounter: 12,
    RecoverySection: 6,
    BossApproach: 0,
  } satisfies Record<SegmentKind, number>,
  lowArmySize: 5,
  tinyArmySize: 2,
  minWeaponSpacing: 150,
  maxSameKindStreak: 2,
  recoveryAfterBossGap: 18,
  mixedUnlockComplexity: 0.18,
} as const;

export type DifficultyConfig = typeof DIFFICULTY_CONFIG;

export const SEGMENT_KINDS = [
  'GateChoice',
  'EnemyWave',
  'ShootableGate',
  'WeaponUnlock',
  'MixedEncounter',
  'RecoverySection',
  'BossApproach',
] as const satisfies readonly SegmentKind[];

export const GATE_SEGMENT_KINDS: readonly SegmentKind[] = [
  'GateChoice',
  'ShootableGate',
  'WeaponUnlock',
  'MixedEncounter',
  'RecoverySection',
];

export const ENEMY_SEGMENT_KINDS: readonly SegmentKind[] = ['EnemyWave', 'MixedEncounter'];

export interface DifficultySnapshot {
  factor: number;
  progress: number;
  enemyHp: number;
  enemyApproachSpeed: number;
  enemyEngagingSpeed: number;
  enemyGroupMin: number;
  enemyGroupMax: number;
  spawnInterval: number;
  waveGroupCount: number;
  gateAddMultiplier: number;
  gateSubtractMultiplier: number;
  shootableInitialMultiplier: number;
  weaponCostMultiplier: number;
  encounterComplexity: number;
  bossHp: number;
  bossDamage: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function difficultyFactor(distance: number): number {
  return 1 + Math.max(0, distance) / DIFFICULTY_CONFIG.distanceUnit;
}

/** Smooth 0→1 progress. Ease-in keeps the first hundreds of meters easy. */
export function difficultyProgress(distance: number): number {
  const linear = clamp01(Math.max(0, distance) / DIFFICULTY_CONFIG.fullProgressDistance);
  return linear * linear;
}

export function encounterComplexity(distance: number): number {
  return difficultyProgress(distance);
}

export function scaledEnemyHp(distance: number, baseHp = ENEMIES.basic.maxHp): number {
  const t = difficultyProgress(distance);
  const multiplier = lerp(1, DIFFICULTY_CONFIG.enemyHp.maxMultiplier, t);
  return Math.max(1, Math.round(baseHp * multiplier));
}

export function scaledEnemyApproachSpeed(
  distance: number,
  base = ENEMIES.basic.approachSpeed,
): number {
  return lerp(base, DIFFICULTY_CONFIG.enemySpeed.maxApproach, difficultyProgress(distance));
}

export function scaledEnemyEngagingSpeed(
  distance: number,
  base = ENEMIES.basic.engagingForwardSpeed,
): number {
  return lerp(base, DIFFICULTY_CONFIG.enemySpeed.maxEngaging, difficultyProgress(distance));
}

export function enemyGroupBounds(distance: number): { min: number; max: number } {
  const t = difficultyProgress(distance);
  const min = Math.round(
    lerp(DIFFICULTY_CONFIG.enemyCount.minStart, DIFFICULTY_CONFIG.enemyCount.minLate, t),
  );
  const max = Math.round(
    lerp(DIFFICULTY_CONFIG.enemyCount.maxStart, DIFFICULTY_CONFIG.enemyCount.maxLate, t),
  );
  return {
    min: Math.max(1, min),
    max: Math.max(min, Math.min(COMBAT_CONFIG.maxEnemies, max)),
  };
}

export function scaledSpawnInterval(distance: number): number {
  return lerp(
    DIFFICULTY_CONFIG.spawnInterval.start,
    DIFFICULTY_CONFIG.spawnInterval.end,
    difficultyProgress(distance),
  );
}

export function waveGroupCount(distance: number): number {
  const t = difficultyProgress(distance);
  const raw = lerp(DIFFICULTY_CONFIG.waveGroups.start, DIFFICULTY_CONFIG.waveGroups.end, t);
  return Math.max(1, Math.round(raw));
}

export function pickEnemyGroupSize(distance: number, rng: () => number): number {
  const bounds = enemyGroupBounds(distance);
  const span = bounds.max - bounds.min;
  return bounds.min + Math.floor(rng() * (span + 1));
}

export function gateAddMultiplier(distance: number): number {
  return lerp(1, DIFFICULTY_CONFIG.gateValue.addMaxMultiplier, difficultyProgress(distance));
}

export function gateSubtractMultiplier(distance: number): number {
  return lerp(1, DIFFICULTY_CONFIG.gateValue.subtractMaxMultiplier, difficultyProgress(distance));
}

export function shootableInitialMultiplier(distance: number): number {
  return lerp(1, DIFFICULTY_CONFIG.shootable.initialMaxMultiplier, difficultyProgress(distance));
}

export function scaleGateValue(
  operation: GateOperation,
  base: number,
  distance: number,
): number {
  if (operation === 'multiply') {
    return base;
  }
  const multiplier =
    operation === 'add' ? gateAddMultiplier(distance) : gateSubtractMultiplier(distance);
  return Math.max(1, Math.round(base * multiplier));
}

export function scaleShootableInitialValue(base: number, distance: number): number {
  const scaled = Math.round(base * shootableInitialMultiplier(distance));
  return Math.min(-1, scaled);
}

export function weaponUnlockCostMultiplier(distance: number): number {
  return 1 + (Math.max(0, distance) / 100) * DIFFICULTY_CONFIG.weaponCost.per100m;
}

export function scaledBossHp(distance: number): number {
  return bossMaxHpForDistance(distance);
}

export function scaledBossDamage(distance: number, encounterIndex: number): number {
  return bossSlamDamage(distance, encounterIndex);
}

export function getDifficultySnapshot(
  distance: number,
  encounterIndex = 0,
): DifficultySnapshot {
  const bounds = enemyGroupBounds(distance);
  return {
    factor: difficultyFactor(distance),
    progress: difficultyProgress(distance),
    enemyHp: scaledEnemyHp(distance),
    enemyApproachSpeed: scaledEnemyApproachSpeed(distance),
    enemyEngagingSpeed: scaledEnemyEngagingSpeed(distance),
    enemyGroupMin: bounds.min,
    enemyGroupMax: bounds.max,
    spawnInterval: scaledSpawnInterval(distance),
    waveGroupCount: waveGroupCount(distance),
    gateAddMultiplier: gateAddMultiplier(distance),
    gateSubtractMultiplier: gateSubtractMultiplier(distance),
    shootableInitialMultiplier: shootableInitialMultiplier(distance),
    weaponCostMultiplier: weaponUnlockCostMultiplier(distance),
    encounterComplexity: encounterComplexity(distance),
    bossHp: scaledBossHp(distance),
    bossDamage: scaledBossDamage(distance, encounterIndex),
  };
}

export function isGateSegmentKind(kind: SegmentKind): boolean {
  return GATE_SEGMENT_KINDS.includes(kind);
}

export function isEnemySegmentKind(kind: SegmentKind): boolean {
  return ENEMY_SEGMENT_KINDS.includes(kind);
}

export function segmentLengthFor(
  kind: SegmentKind,
  rng: () => number,
): number {
  const range = DIFFICULTY_CONFIG.segmentLengths[kind];
  return range.min + rng() * (range.max - range.min);
}
