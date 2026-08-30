import { FEEL_CONFIG, type FeedbackKind } from '../config/feel';
import type { WeaponId } from '../config/weapons';

export interface FeedbackEvent {
  kind: FeedbackKind;
  weaponId: WeaponId;
  positive: boolean;
}

export interface FloatingText {
  active: boolean;
  x: number;
  z: number;
  life: number;
  maxLife: number;
  text: string;
  positive: boolean;
}

export interface FeelRuntimeState {
  cameraShakeMag: number;
  timeScale: number;
  slowMoT: number;
  feedbackCount: number;
  feedback: FeedbackEvent[];
  floatingTexts: FloatingText[];
}

function createEmptyFeedbackEvent(): FeedbackEvent {
  return {
    kind: 'enemyHit',
    weaponId: 'pistol',
    positive: false,
  };
}

function createEmptyFloatingText(): FloatingText {
  return {
    active: false,
    x: 0,
    z: 0,
    life: 0,
    maxLife: FEEL_CONFIG.floatingTextLife,
    text: '',
    positive: true,
  };
}

export function createFeelRuntimeState(): FeelRuntimeState {
  const feedback: FeedbackEvent[] = [];
  for (let i = 0; i < FEEL_CONFIG.maxFeedbackEvents; i += 1) {
    feedback.push(createEmptyFeedbackEvent());
  }
  const floatingTexts: FloatingText[] = [];
  for (let i = 0; i < FEEL_CONFIG.maxFloatingTexts; i += 1) {
    floatingTexts.push(createEmptyFloatingText());
  }
  return {
    cameraShakeMag: 0,
    timeScale: 1,
    slowMoT: 0,
    feedbackCount: 0,
    feedback,
    floatingTexts,
  };
}

export function pushFeedback(
  state: FeelRuntimeState,
  kind: FeedbackKind,
  extras?: { weaponId?: WeaponId; positive?: boolean },
): void {
  if (state.feedbackCount >= state.feedback.length) {
    return;
  }
  const event = state.feedback[state.feedbackCount];
  if (!event) {
    return;
  }
  event.kind = kind;
  event.weaponId = extras?.weaponId ?? 'pistol';
  event.positive = extras?.positive ?? false;
  state.feedbackCount += 1;
}

export function clearFeedback(state: FeelRuntimeState): void {
  state.feedbackCount = 0;
}

export function addCameraShake(state: FeelRuntimeState, magnitude: number): void {
  if (magnitude <= 0) {
    return;
  }
  state.cameraShakeMag = Math.max(state.cameraShakeMag, magnitude);
}

export function triggerSlowMo(state: FeelRuntimeState, duration = FEEL_CONFIG.slowMoDuration): void {
  state.slowMoT = Math.max(state.slowMoT, duration);
}

export function spawnFloatingText(
  state: FeelRuntimeState,
  x: number,
  z: number,
  text: string,
  positive: boolean,
): void {
  let slot = state.floatingTexts.find((item) => !item.active);
  if (!slot) {
    let oldest = state.floatingTexts[0];
    for (let i = 1; i < state.floatingTexts.length; i += 1) {
      const item = state.floatingTexts[i];
      if (!item || !oldest) {
        continue;
      }
      if (item.life < oldest.life) {
        oldest = item;
      }
    }
    slot = oldest;
  }
  if (!slot) {
    return;
  }
  slot.active = true;
  slot.x = x;
  slot.z = z;
  slot.life = FEEL_CONFIG.floatingTextLife;
  slot.maxLife = FEEL_CONFIG.floatingTextLife;
  slot.text = text;
  slot.positive = positive;
}
