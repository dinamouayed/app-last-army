import { describe, expect, it } from '@jest/globals';

import { GATE_CONFIG } from '../config/gates';
import { failedWeaponUnlockSoldierLoss } from './weaponGate';

describe('failedWeaponUnlockSoldierLoss', () => {
  it('loses nothing once the barrel is unlocked', () => {
    expect(failedWeaponUnlockSoldierLoss(80, 0, 50)).toBe(0);
  });

  it('wipes the army below 10 soldiers', () => {
    expect(failedWeaponUnlockSoldierLoss(9, 40, 40)).toBe(9);
    expect(failedWeaponUnlockSoldierLoss(1, 12, 25)).toBe(1);
  });

  it('loses about one third of the army from 10 soldiers when the barrel was not damaged', () => {
    expect(failedWeaponUnlockSoldierLoss(10, 25, 25)).toBe(3);
    expect(failedWeaponUnlockSoldierLoss(30, 50, 50)).toBe(10);
    expect(failedWeaponUnlockSoldierLoss(80, 85, 85)).toBe(27);
  });

  it('loses fewer soldiers when more of the barrel was shot', () => {
    const untouched = failedWeaponUnlockSoldierLoss(90, 50, 50);
    const almost = failedWeaponUnlockSoldierLoss(90, 5, 50);
    expect(almost).toBeLessThan(untouched);
    expect(untouched).toBe(30);
  });

  it('treats leftover HP as progress against the initial barrel number', () => {
    const cheapLeftover = failedWeaponUnlockSoldierLoss(90, 10, 25);
    const expensiveLeftover = failedWeaponUnlockSoldierLoss(90, 10, 85);
    expect(cheapLeftover).toBeGreaterThan(expensiveLeftover);
  });

  it('never exceeds one third of the army at 10+ soldiers', () => {
    const maxFraction = GATE_CONFIG.weaponGate.failArmyFraction;
    for (const size of [10, 11, 24, 100]) {
      const loss = failedWeaponUnlockSoldierLoss(size, 999, 999);
      expect(loss).toBeLessThanOrEqual(Math.round(size * maxFraction));
      expect(loss).toBeLessThan(size);
    }
  });
});
