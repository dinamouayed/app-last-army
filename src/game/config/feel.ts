import type { WeaponId } from './weapons';

export type FeedbackKind =
  | 'weaponFire'
  | 'enemyHit'
  | 'enemyDeath'
  | 'gateActivate'
  | 'weaponUnlock'
  | 'bossSlam'
  | 'bossDeath'
  | 'explosion'
  | 'fireballImpact';

export const FEEL_CONFIG = {
  maxFeedbackEvents: 32,
  maxFloatingTexts: 10,
  floatingTextLife: 0.55,
  hitSparkCount: 3,
  hitSparkSpeed: 5.5,
  hitSparkLife: 0.16,
  cameraShakeDecay: 7.2,
  cameraShakeFloor: 0.35,
  slamShake: 11,
  deathShake: 18,
  explosionShake: 14,
  fireballShake: 10,
  contactShake: 5,
  slowMoDuration: 0.36,
  slowMoScale: 0.46,
  gateBurstCountPositive: 10,
  gateBurstCountNegative: 6,
  muzzleFlashDuration: {
    pistol: 0.07,
    smg: 0.045,
    shotgun: 0.1,
    machineGun: 0.055,
  } satisfies Record<WeaponId, number>,
  projectileWidthScale: {
    pistol: 1,
    smg: 0.88,
    shotgun: 1.35,
    machineGun: 1.08,
  } satisfies Record<WeaponId, number>,
  combatHapticMinInterval: 0.07,
} as const;

export type FeelConfig = typeof FEEL_CONFIG;
