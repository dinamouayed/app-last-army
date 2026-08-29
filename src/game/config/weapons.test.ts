import {
  getEffectiveWeapon,
  nextUnlockableWeapon,
  pickNextBarrelWeapon,
  nextBarrelUpgradeTier,
  WEAPON_PROGRESSION,
  WEAPONS,
  weaponTier,
} from './weapons';

describe('weapons config', () => {
  it('defines all four weapon tiers', () => {
    expect(WEAPON_PROGRESSION).toEqual(['pistol', 'smg', 'shotgun', 'machineGun']);
    for (const id of WEAPON_PROGRESSION) {
      expect(WEAPONS[id].id).toBe(id);
      expect(WEAPONS[id].name.length).toBeGreaterThan(0);
      expect(WEAPONS[id].damage).toBeGreaterThan(0);
      expect(WEAPONS[id].fireRate).toBeGreaterThan(0);
      expect(WEAPONS[id].projectileSpeed).toBeGreaterThan(0);
      expect(WEAPONS[id].projectileCount).toBeGreaterThan(0);
    }
  });

  it('cycles unlock order and wraps back to pistol', () => {
    expect(nextUnlockableWeapon('pistol')).toBe('smg');
    expect(nextUnlockableWeapon('smg')).toBe('shotgun');
    expect(nextUnlockableWeapon('shotgun')).toBe('machineGun');
    expect(nextUnlockableWeapon('machineGun')).toBe('pistol');
  });

  it('offers the next weapon based on the equipped weapon', () => {
    expect(pickNextBarrelWeapon('pistol')).toBe('smg');
    expect(pickNextBarrelWeapon('machineGun')).toBe('pistol');
  });

  it('ranks weapons by tier', () => {
    expect(weaponTier('pistol')).toBeLessThan(weaponTier('smg'));
    expect(weaponTier('smg')).toBeLessThan(weaponTier('shotgun'));
    expect(weaponTier('shotgun')).toBeLessThan(weaponTier('machineGun'));
  });

  it('computes the upgrade tier a barrel will grant', () => {
    const tiers = { pistol: 0, smg: 0, shotgun: 0, machineGun: 0 };
    expect(nextBarrelUpgradeTier(['pistol'], tiers, 'smg')).toBe(0);
    expect(nextBarrelUpgradeTier(['pistol', 'smg'], tiers, 'smg')).toBe(1);
    expect(nextBarrelUpgradeTier(['pistol', 'smg', 'shotgun', 'machineGun'], tiers, 'pistol')).toBe(1);
  });

  it('scales weapon stats on upgrade tiers', () => {
    const base = WEAPONS.smg;
    const upgraded = getEffectiveWeapon('smg', 2);
    expect(upgraded.damage).toBeGreaterThan(base.damage);
    expect(upgraded.fireRate).toBeGreaterThan(base.fireRate);
  });

  it('gives shotgun multiple pellets', () => {
    expect(WEAPONS.shotgun.projectileCount).toBeGreaterThan(1);
    expect(WEAPONS.shotgun.spread).toBeGreaterThan(0);
  });

  it('keeps each base unlock tier stronger than the previous at equal army size', () => {
    const origins = 2;
    const dps = (id: (typeof WEAPON_PROGRESSION)[number]) => {
      const weapon = WEAPONS[id];
      const pellets = weapon.projectileCount > 1 ? weapon.projectileCount : origins;
      return weapon.damage * pellets * weapon.fireRate;
    };

    for (let i = 1; i < WEAPON_PROGRESSION.length; i += 1) {
      const prev = WEAPON_PROGRESSION[i - 1]!;
      const next = WEAPON_PROGRESSION[i]!;
      expect(dps(next)).toBeGreaterThan(dps(prev));
    }
  });

  it('keeps an upgraded weapon stronger than its base version', () => {
    const base = getEffectiveWeapon('pistol', 0);
    const upgraded = getEffectiveWeapon('pistol', 1);
    expect(upgraded.damage * upgraded.fireRate).toBeGreaterThan(base.damage * base.fireRate);
  });
});
