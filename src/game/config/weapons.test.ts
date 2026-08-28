import {
  nextUnlockableWeapon,
  pickWeaponForBarrelGate,
  WEAPON_PROGRESSION,
  WEAPONS,
  weaponTier,
} from '../config/weapons';

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

  it('progresses unlock order from pistol to machine gun', () => {
    expect(nextUnlockableWeapon('pistol')).toBe('smg');
    expect(nextUnlockableWeapon('smg')).toBe('shotgun');
    expect(nextUnlockableWeapon('shotgun')).toBe('machineGun');
    expect(nextUnlockableWeapon('machineGun')).toBeNull();
  });

  it('ranks weapons by tier', () => {
    expect(weaponTier('pistol')).toBeLessThan(weaponTier('smg'));
    expect(weaponTier('smg')).toBeLessThan(weaponTier('shotgun'));
    expect(weaponTier('shotgun')).toBeLessThan(weaponTier('machineGun'));
  });

  it('keeps offering weapons after all tiers are unlocked', () => {
    const all = ['pistol', 'smg', 'shotgun', 'machineGun'] as const;
    const picked = pickWeaponForBarrelGate(all, () => 0.5);
    expect(['smg', 'shotgun', 'machineGun']).toContain(picked);
  });

  it('prioritizes unowned weapons in order', () => {
    expect(pickWeaponForBarrelGate(['pistol'], () => 0)).toBe('smg');
    expect(pickWeaponForBarrelGate(['pistol', 'smg'], () => 0)).toBe('shotgun');
    expect(pickWeaponForBarrelGate(['pistol', 'smg', 'shotgun'], () => 0)).toBe('machineGun');
  });

  it('gives shotgun multiple pellets', () => {
    expect(WEAPONS.shotgun.projectileCount).toBeGreaterThan(1);
    expect(WEAPONS.shotgun.spread).toBeGreaterThan(0);
  });

  it('keeps each unlock tier stronger than the previous at equal army size', () => {
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
});
