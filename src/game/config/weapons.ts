export type WeaponId = 'pistol';

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  projectileCount: number;
  spread: number;
}

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
} as const satisfies Record<WeaponId, WeaponConfig>;

export const STARTING_WEAPON: WeaponId = 'pistol';

export function getWeapon(id: WeaponId): WeaponConfig {
  return WEAPONS[id];
}
