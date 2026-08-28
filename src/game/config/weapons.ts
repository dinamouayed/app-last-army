export type WeaponId = 'pistol' | 'smg' | 'shotgun' | 'machineGun';

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

export const STARTING_WEAPON: WeaponId = 'pistol';

export function getWeapon(id: WeaponId): WeaponConfig {
  return WEAPONS[id];
}

export function weaponTier(id: WeaponId): number {
  return WEAPON_PROGRESSION.indexOf(id);
}

export function nextUnlockableWeapon(current: WeaponId): WeaponId | null {
  const tier = weaponTier(current);
  if (tier < 0 || tier >= WEAPON_PROGRESSION.length - 1) {
    return null;
  }
  return WEAPON_PROGRESSION[tier + 1] ?? null;
}

const BARREL_WEAPON_POOL = WEAPON_PROGRESSION.filter((id) => id !== 'pistol');

/** Next weapon gate offer — unowned weapons first, then repeats for endless upgrades. */
export function pickWeaponForBarrelGate(
  unlocked: readonly WeaponId[],
  rng: () => number = Math.random,
): WeaponId {
  for (let i = 0; i < WEAPON_PROGRESSION.length; i += 1) {
    const id = WEAPON_PROGRESSION[i]!;
    if (id !== 'pistol' && !unlocked.includes(id)) {
      return id;
    }
  }
  const index = Math.floor(rng() * BARREL_WEAPON_POOL.length);
  return BARREL_WEAPON_POOL[Math.min(index, BARREL_WEAPON_POOL.length - 1)] ?? 'smg';
}

export function isRepeatWeaponUnlock(unlocked: readonly WeaponId[], weaponId: WeaponId): boolean {
  return unlocked.includes(weaponId);
}
