import { BOSS_CONFIG } from '../config/bosses';
import { BOSS_FRAMES, type BossFrameRect } from '../assets/bossAsset';
import type { Boss } from '../entities/boss';

export interface BossSpriteLayer {
  body: BossFrameRect;
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length - 1, index));
}

function frameAt(set: readonly BossFrameRect[], index: number): BossFrameRect {
  return set[clampIndex(index, set.length)]!;
}

function phaseProgress(phaseT: number, duration: number): number {
  if (duration <= 0) {
    return 1;
  }
  return Math.max(0, Math.min(1, 1 - phaseT / duration));
}

function frameIndex(progress: number, frameCount: number): number {
  if (frameCount <= 1) {
    return 0;
  }
  return clampIndex(Math.floor(progress * frameCount), frameCount);
}

function staticIdle(): BossSpriteLayer {
  return { body: BOSS_FRAMES.idle[0]! };
}

export function pickBossSprite(boss: Boss): BossSpriteLayer {
  if (boss.dying) {
    const t = Math.min(1, boss.deathT / BOSS_CONFIG.deathDuration);
    const idx = clampIndex(Math.floor(t * BOSS_FRAMES.recover.length), BOSS_FRAMES.recover.length);
    return { body: BOSS_FRAMES.recover[idx]! };
  }

  if (boss.behavior === 'approaching') {
    return staticIdle();
  }

  if (boss.attackPhase === 'idle' || boss.attackPhase === 'hold' || boss.attackPhase === 'recoverHold') {
    return staticIdle();
  }

  if (boss.attackPhase === 'windup') {
    const t = phaseProgress(boss.attackPhaseT, BOSS_CONFIG.windupRaiseDuration);
    const idx = frameIndex(t, BOSS_FRAMES.windup.length);
    return { body: frameAt(BOSS_FRAMES.windup, idx) };
  }

  if (boss.attackPhase === 'windupHold') {
    return { body: BOSS_FRAMES.windup[BOSS_FRAMES.windup.length - 1]! };
  }

  if (boss.attackPhase === 'slam') {
    const t = phaseProgress(boss.attackPhaseT, BOSS_CONFIG.slamDuration);
    const idx = frameIndex(t, BOSS_FRAMES.slam.length);
    return { body: frameAt(BOSS_FRAMES.slam, idx) };
  }

  if (boss.attackPhase === 'slamHold') {
    return { body: BOSS_FRAMES.slam[BOSS_FRAMES.slam.length - 1]! };
  }

  if (boss.attackPhase === 'recover') {
    const t = phaseProgress(boss.attackPhaseT, BOSS_CONFIG.recoverDuration);
    const idx = frameIndex(t, BOSS_FRAMES.recover.length);
    return { body: frameAt(BOSS_FRAMES.recover, idx) };
  }

  return staticIdle();
}
