import { createGameState } from '../engine/GameState';
import { registerWeaponUnlock } from './weaponGate';
import { applyProjectileGateHit } from './GateSystem';
import { playerWorldZ } from '../math/camera';
import { GAME_CONFIG } from '../config/game';
import { createEmptyGate, type Gate } from '../entities/gates';

function makeWeaponGate(groupId: number, weaponId: Gate['weaponId'], hp: number, z: number): Gate {
  const gate = createEmptyGate();
  gate.active = true;
  gate.groupId = groupId;
  gate.z = z;
  gate.kind = 'weapon';
  gate.weaponId = weaponId;
  gate.weaponHp = hp;
  gate.weaponMaxHp = hp;
  gate.weaponReady = false;
  return gate;
}

describe('weapon upgrade cycle', () => {
  it('increments upgrade tier when re-unlocking an owned weapon', () => {
    const state = createGameState();
    registerWeaponUnlock(state, 'smg');
    registerWeaponUnlock(state, 'smg');
    expect(state.weaponUpgradeTiers.smg).toBe(1);
    expect(state.unlockedWeapons.filter((id) => id === 'smg')).toHaveLength(1);
  });

  it('equips an upgraded pistol after the machine gun cycle completes', () => {
    const state = createGameState();
    state.weaponId = 'machineGun';
    state.unlockedWeapons.push('smg', 'shotgun', 'machineGun');

    state.gates.push(
      makeWeaponGate(1, 'pistol', 1, playerWorldZ(state.distance, GAME_CONFIG.camera) + 5),
    );

    applyProjectileGateHit(state, 0, 0);

    expect(state.weaponId).toBe('pistol');
    expect(state.weaponUpgradeTiers.pistol).toBe(1);
  });
});
