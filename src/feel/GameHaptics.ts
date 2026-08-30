import * as Haptics from 'expo-haptics';

import { FEEL_CONFIG, type FeedbackKind } from '../game/config/feel';

let lastCombatMs = 0;

function combatHaptic(style: Haptics.ImpactFeedbackStyle): void {
  const now = Date.now();
  if (now - lastCombatMs < FEEL_CONFIG.combatHapticMinInterval * 1000) {
    return;
  }
  lastCombatMs = now;
  void Haptics.impactAsync(style);
}

export function playFeedbackHaptic(kind: FeedbackKind): void {
  try {
    switch (kind) {
      case 'enemyDeath':
        combatHaptic(Haptics.ImpactFeedbackStyle.Light);
        return;
      case 'bossSlam':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      case 'bossDeath':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      case 'explosion':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      case 'fireballImpact':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      default:
        return;
    }
  } catch {
    // Simulator / web may not have a haptics engine.
  }
}
