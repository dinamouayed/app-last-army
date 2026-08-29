import { weaponUnlockCostMultiplier } from './difficulty';
import {
  WEAPON_UPGRADE_CONFIG,
  type WeaponId,
} from './weapons';

export const WEAPON_UNLOCK_CONFIG = {
  maxActive: 2,
  firstUnlockDistance: 110,
  minSpacing: 160,
  maxSpacing: 280,
  spawnAhead: 50,
  minSpawnAhead: 36,
  spawnRetryDelay: 0.5,
  hitRadius: 0.44,
  hitFlashDuration: 0.1,
  unlockPulseDuration: 0.55,
  fadeOutDuration: 0.32,
  messageDuration: 2.2,
  /** Base HP per weapon — each projectile hit removes 1 HP. */
  unlockCosts: {
    pistol: 20,
    smg: 25,
    shotgun: 50,
    machineGun: 85,
  } satisfies Record<WeaponId, number>,
  /** Additional cost multiplier per 100 m traveled. */
  costScalePer100m: 0.02,
} as const;

export type WeaponUnlockConfig = typeof WEAPON_UNLOCK_CONFIG;

export function scaledUnlockCost(weaponId: WeaponId, distance: number): number {
  const base = WEAPON_UNLOCK_CONFIG.unlockCosts[weaponId];
  return Math.max(1, Math.floor(base * weaponUnlockCostMultiplier(distance)));
}

export function scaledBarrelUnlockCost(
  weaponId: WeaponId,
  distance: number,
  upgradeTier: number,
): number {
  let cost = scaledUnlockCost(weaponId, distance);
  if (upgradeTier > 0) {
    cost = Math.floor(cost * (1 + upgradeTier * WEAPON_UPGRADE_CONFIG.barrelCostPerTier));
  }
  return Math.max(1, cost);
}
