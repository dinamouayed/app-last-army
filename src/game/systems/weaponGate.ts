import type { WeaponId } from '../config/weapons';
import type { GameState } from '../types';

export function equipWeapon(state: GameState, weaponId: WeaponId): void {
  if (state.weaponId === weaponId) {
    return;
  }
  state.weaponId = weaponId;
  state.fireAccumulator = 0;
}

export function registerWeaponUnlock(state: GameState, weaponId: WeaponId): void {
  if (!state.unlockedWeapons.includes(weaponId)) {
    state.unlockedWeapons.push(weaponId);
  }
}
