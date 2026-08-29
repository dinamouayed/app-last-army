export type WeaponId = 'pistol' | 'smg' | 'shotgun' | 'machineGun';

export type WeaponUpgradeTiers = Record<WeaponId, number>;

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  projectileCount: number;
  /** Max lateral spawn offset in world units — stays inside the selected lane. */
  spread: number;
}

export const WEAPON_PROGRESSION: readonly WeaponId[] = [
  'pistol',
  'smg',
  'shotgun',
  'machineGun',
] as const;

export const WEAPONS = {
  pistol: {
    id: 'pistol',
    name: 'Pistol',
    damage: 12,
    fireRate: 3.2,
    projectileSpeed: 48,
    projectileCount: 1,
    spread: 0,
  },
  smg: {
    id: 'smg',
    name: 'SMG',
    damage: 7,
    fireRate: 8.5,
    projectileSpeed: 52,
    projectileCount: 1,
    spread: 0.04,
  },
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    damage: 9,
    fireRate: 3.6,
    projectileSpeed: 44,
    projectileCount: 5,
    spread: 0.18,
  },
  machineGun: {
    id: 'machineGun',
    name: 'Machine Gun',
    damage: 10,
    fireRate: 12,
    projectileSpeed: 56,
    projectileCount: 1,
    spread: 0.06,
  },
} as const satisfies Record<WeaponId, WeaponConfig>;

/** Per-tier power scaling when cycling back to an already-unlocked weapon. */
export const WEAPON_UPGRADE_CONFIG = {
  damagePerTier: 0.15,
  fireRatePerTier: 0.1,
  /** Extra barrel HP multiplier per upgrade tier offered. */
  barrelCostPerTier: 0.35,
} as const;

export const STARTING_WEAPON: WeaponId = 'pistol';

export function createEmptyWeaponUpgradeTiers(): WeaponUpgradeTiers {
  return {
    pistol: 0,
    smg: 0,
    shotgun: 0,
    machineGun: 0,
  };
}

export function getWeapon(id: WeaponId): WeaponConfig {
  return WEAPONS[id];
}

export function getWeaponUpgradeTier(tiers: WeaponUpgradeTiers, id: WeaponId): number {
  return tiers[id] ?? 0;
}

export function getEffectiveWeapon(id: WeaponId, upgradeTier: number): WeaponConfig {
  const base = WEAPONS[id];
  if (upgradeTier <= 0) {
    return base;
  }
  const damageMul = 1 + upgradeTier * WEAPON_UPGRADE_CONFIG.damagePerTier;
  const fireRateMul = 1 + upgradeTier * WEAPON_UPGRADE_CONFIG.fireRatePerTier;
  return {
    ...base,
    damage: Math.max(1, Math.round(base.damage * damageMul)),
    fireRate: base.fireRate * fireRateMul,
  };
}

export function weaponDisplayName(id: WeaponId, upgradeTier: number): string {
  const base = WEAPONS[id].name;
  if (upgradeTier <= 0) {
    return base;
  }
  return `${base} +${upgradeTier}`;
}

export function weaponTier(id: WeaponId): number {
  return WEAPON_PROGRESSION.indexOf(id);
}

/** Next weapon in the fixed cycle — wraps from machine gun back to pistol. */
export function pickNextBarrelWeapon(currentWeaponId: WeaponId): WeaponId {
  const index = weaponTier(currentWeaponId);
  const nextIndex = (index + 1) % WEAPON_PROGRESSION.length;
  return WEAPON_PROGRESSION[nextIndex] ?? 'smg';
}

export function nextUnlockableWeapon(current: WeaponId): WeaponId {
  return pickNextBarrelWeapon(current);
}

/** Upgrade tier the barrel will grant (0 = first unlock of that weapon). */
export function nextBarrelUpgradeTier(
  unlocked: readonly WeaponId[],
  tiers: WeaponUpgradeTiers,
  weaponId: WeaponId,
): number {
  if (!unlocked.includes(weaponId)) {
    return 0;
  }
  return getWeaponUpgradeTier(tiers, weaponId) + 1;
}

export function isWeaponUpgradeUnlock(unlocked: readonly WeaponId[], weaponId: WeaponId): boolean {
  return unlocked.includes(weaponId);
}

/** @deprecated Use pickNextBarrelWeapon — kept for call-site migration. */
export function pickWeaponForBarrelGate(
  unlocked: readonly WeaponId[],
  _rng: () => number = Math.random,
  currentWeaponId: WeaponId = 'pistol',
): WeaponId {
  void unlocked;
  return pickNextBarrelWeapon(currentWeaponId);
}

/** @deprecated Use isWeaponUpgradeUnlock */
export function isRepeatWeaponUnlock(unlocked: readonly WeaponId[], weaponId: WeaponId): boolean {
  return isWeaponUpgradeUnlock(unlocked, weaponId);
}
