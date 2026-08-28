import type { SkCanvas } from '@shopify/react-native-skia';

import { sortedSlotIndices } from '../game/army/formation';
import { ARMY_CONFIG } from '../game/config/army';
import { GAME_CONFIG } from '../game/config/game';
import { playerWorldZ } from '../game/math/camera';
import { laneIndexToX } from '../game/math/lanes';
import type { GameState } from '../game/types';
import type { RenderResources } from './paints';
import { drawSoldierAt, formationPose } from './SoldierRenderer';

function armyShakeOffset(state: GameState): number {
  if (state.armyShake <= 0) {
    return 0;
  }
  const t = state.armyShake / ARMY_CONFIG.shakeDuration;
  return Math.sin(state.elapsed * 48) * 0.04 * t;
}

function formationScale(state: GameState): number {
  if (state.armyDeathPulse <= 0) {
    return 1;
  }
  const t = state.armyDeathPulse / ARMY_CONFIG.deathPulseDuration;
  return 1 - t * 0.06;
}

function crowdScaleMultiplier(rank: number, frontRank: boolean, depth: number): number {
  if (frontRank) {
    return ARMY_CONFIG.leaderScaleBoost;
  }
  const depthFactor = Math.min(1, depth / 10);
  const rearBoost = 1 + depthFactor * (ARMY_CONFIG.rearScaleBoost - 1);
  const rankFactor = Math.min(1, rank / 12);
  return (ARMY_CONFIG.crowdScaleMin + (1 - ARMY_CONFIG.crowdScaleMin) * (1 - rankFactor * 0.5)) * rearBoost;
}

export function drawArmy(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  if (state.armySize <= 0 && !state.dyingVisuals.some((item) => item.active)) {
    return;
  }

  const targetX = laneIndexToX(state.targetLane, GAME_CONFIG.laneSpacing);
  const lean = (targetX - state.armyX) * 0.85 + armyShakeOffset(state);
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const formationMul = formationScale(state);
  const frontIndices = sortedSlotIndices(state.formationSlots);
  const leaderIndex = frontIndices[0];

  if (state.armyHitFlash > 0) {
    const flash = state.armyHitFlash / ARMY_CONFIG.hitFlashDuration;
    resources.paints.hitFlash.setAlphaf(0.22 * flash);
    canvas.drawRect(
      {
        x: width * 0.22,
        y: height * GAME_CONFIG.camera.playerYRatio - 80,
        width: width * 0.56,
        height: 120,
      },
      resources.paints.hitFlash,
    );
    resources.paints.hitFlash.setAlphaf(1);
  }

  for (let drawOrder = state.formationSlots.length - 1; drawOrder >= 0; drawOrder -= 1) {
    const slot = state.formationSlots[drawOrder];
    if (!slot?.active || slot.dying) {
      continue;
    }

    const isLeader = drawOrder === leaderIndex;
    const rank = frontIndices.indexOf(drawOrder);
    const scaleMul =
      ARMY_CONFIG.visualScale *
      formationMul *
      crowdScaleMultiplier(rank >= 0 ? rank : drawOrder, isLeader, slot.depth);
    const slotLean = lean * (isLeader ? 1 : 0.65);

    drawSoldierAt(
      canvas,
      resources,
      formationPose(
        state.armyX + slot.offsetX,
        playerZ + slot.offsetZ,
        state.elapsed,
        slotLean,
        slot.phase,
        isLeader ? state.muzzleFlash : 0,
      ),
      state.distance,
      width,
      height,
      { scaleMul },
    );
  }

  for (let i = 0; i < state.dyingVisuals.length; i += 1) {
    const visual = state.dyingVisuals[i];
    if (!visual?.active) {
      continue;
    }
    const progress = visual.t / ARMY_CONFIG.soldierDeathDuration;
    const alpha = 1 - progress;
    const scaleMul = ARMY_CONFIG.visualScale * formationMul * (1 - progress * 0.35);

    drawSoldierAt(
      canvas,
      resources,
      formationPose(
        state.armyX + visual.offsetX,
        playerZ + visual.offsetZ,
        state.elapsed,
        lean * 0.5,
        visual.phase,
        0,
      ),
      state.distance,
      width,
      height,
      { alpha, scaleMul },
    );
  }
}
