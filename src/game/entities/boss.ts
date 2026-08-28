export type BossBehaviorState = 'approaching' | 'fighting';
export type BossAttackPhase =
  | 'idle'
  | 'hold'
  | 'windup'
  | 'windupHold'
  | 'slam'
  | 'slamHold'
  | 'recover'
  | 'recoverHold';

export interface Boss {
  active: boolean;
  id: number;
  x: number;
  z: number;
  /** Distance ahead of army front — boss Z is derived from this each frame. */
  depthOffset: number;
  hp: number;
  maxHp: number;
  radius: number;
  hitFlash: number;
  deathT: number;
  dying: boolean;
  behavior: BossBehaviorState;
  attackPhase: BossAttackPhase;
  attackPhaseT: number;
  attackCooldown: number;
  slamDamage: number;
  /** True once the current slamHold has already dealt damage. */
  slamDamageApplied: boolean;
  animTime: number;
}

export interface BossRuntimeState {
  boss: Boss;
  nextBossDistance: number;
  nextBossKillThreshold: number;
  bossEncounterCount: number;
}

export function createEmptyBoss(): Boss {
  return {
    active: false,
    id: 0,
    x: 0,
    z: 0,
    depthOffset: 0,
    hp: 0,
    maxHp: 0,
    radius: 0,
    hitFlash: 0,
    deathT: 0,
    dying: false,
    behavior: 'approaching',
    attackPhase: 'idle',
    attackPhaseT: 0,
    attackCooldown: 0,
    slamDamage: 0,
    slamDamageApplied: false,
    animTime: 0,
  };
}

export function createBossRuntimeState(): BossRuntimeState {
  return {
    boss: createEmptyBoss(),
    nextBossDistance: 0,
    nextBossKillThreshold: 0,
    bossEncounterCount: 0,
  };
}

export function isBossPresent(boss: Boss): boolean {
  return boss.active;
}
