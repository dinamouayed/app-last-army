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

export interface BossTapStrike {
  charge: number;
  chargeVisual: number;
  idleT: number;
  lastTapElapsed: number;
  pulse: number;
  hintT: number;
  hasTapped: boolean;
  fireballActive: boolean;
  fireballT: number;
  fireballX: number;
  fireballZ: number;
  fireballFromX: number;
  fireballFromZ: number;
  fireballToX: number;
  fireballToZ: number;
  impactT: number;
}

export interface BossRuntimeState {
  boss: Boss;
  nextBossDistance: number;
  nextBossKillThreshold: number;
  bossEncounterCount: number;
  tapStrike: BossTapStrike;
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

export function createEmptyTapStrike(): BossTapStrike {
  return {
    charge: 0,
    chargeVisual: 0,
    idleT: 0,
    lastTapElapsed: -1,
    pulse: 0,
    hintT: 0,
    hasTapped: false,
    fireballActive: false,
    fireballT: 0,
    fireballX: 0,
    fireballZ: 0,
    fireballFromX: 0,
    fireballFromZ: 0,
    fireballToX: 0,
    fireballToZ: 0,
    impactT: 0,
  };
}

export function resetTapStrike(strike: BossTapStrike): void {
  strike.charge = 0;
  strike.chargeVisual = 0;
  strike.idleT = 0;
  strike.lastTapElapsed = -1;
  strike.pulse = 0;
  strike.hintT = 0;
  strike.hasTapped = false;
  strike.fireballActive = false;
  strike.fireballT = 0;
  strike.fireballX = 0;
  strike.fireballZ = 0;
  strike.fireballFromX = 0;
  strike.fireballFromZ = 0;
  strike.fireballToX = 0;
  strike.fireballToZ = 0;
  strike.impactT = 0;
}

export function createBossRuntimeState(): BossRuntimeState {
  return {
    boss: createEmptyBoss(),
    nextBossDistance: 0,
    nextBossKillThreshold: 0,
    bossEncounterCount: 0,
    tapStrike: createEmptyTapStrike(),
  };
}

export function isBossPresent(boss: Boss): boolean {
  return boss.active;
}
