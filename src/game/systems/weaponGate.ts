import { GATE_CONFIG } from '../config/gates';
import type { WeaponId } from '../config/weapons';
import type { GameState } from '../types';

/**
 * Soldiers lost when the army crosses an unfinished weapon barrel.
 *
 * Below `failLethalBelow`, the barrel is still lethal.
 * From that size up, the army loses up to about one third of its soldiers,
 * scaled by remaining HP / initial barrel number (how far they still were).
 */
export function failedWeaponUnlockSoldierLoss(
  armySize: number,
  remainingHp: number,
  maxHp: number,
): number {
  if (armySize <= 0 || remainingHp <= 0 || maxHp <= 0) {
    return 0;
  }
  if (armySize < GATE_CONFIG.weaponGate.failLethalBelow) {
    return armySize;
  }
  const remainingRatio = Math.min(1, remainingHp / maxHp);
  const maxLoss = Math.max(
    1,
    Math.round(armySize * GATE_CONFIG.weaponGate.failArmyFraction),
  );
  const loss = Math.round(armySize * GATE_CONFIG.weaponGate.failArmyFraction * remainingRatio);
  return Math.min(maxLoss, Math.max(1, loss));
}

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
