import { clearFeedback } from '../game/feel/feedback';
import type { WeaponId } from '../game/config/weapons';
import type { GameState } from '../game/types';
import { playSound } from './GameAudio';
import { playFeedbackHaptic } from './GameHaptics';

export function consumeFeedback(state: GameState): void {
  let weaponId: WeaponId | null = null;
  let playSlam = false;
  let playBossDeath = false;
  let playExplosion = false;
  let playFireball = false;

  for (let i = 0; i < state.feedbackCount; i += 1) {
    const event = state.feedback[i];
    if (!event) {
      continue;
    }
    switch (event.kind) {
      case 'weaponFire':
        weaponId = event.weaponId;
        break;
      case 'bossSlam':
        playSlam = true;
        break;
      case 'bossDeath':
        playBossDeath = true;
        break;
      case 'explosion':
        playExplosion = true;
        break;
      case 'fireballImpact':
        playFireball = true;
        break;
      default:
        break;
    }
    playFeedbackHaptic(event.kind);
  }

  if (weaponId) {
    playSound(weaponId);
  }
  if (playSlam) {
    playSound('slam');
  }
  if (playBossDeath) {
    playSound('bossDeath');
  }
  if (playExplosion) {
    playSound('explosion');
  }
  if (playFireball && !playExplosion) {
    playSound('explosion', 0.72);
  }

  clearFeedback(state);
}
