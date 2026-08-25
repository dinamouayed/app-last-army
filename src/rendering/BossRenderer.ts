import { Skia, matchFont, type SkCanvas } from '@shopify/react-native-skia';

import { pickBossSprite } from '../game/boss/bossAnimation';
import { BOSS_CELL } from '../game/assets/bossAsset';
import { BOSS_CONFIG } from '../game/config/bosses';
import { GAME_CONFIG } from '../game/config/game';
import type { Boss } from '../game/entities/boss';
import { worldToScreen } from '../game/math/camera';
import type { GameState } from '../game/types';
import type { RenderResources } from './paints';
import type { BossFrameRect } from '../game/assets/bossAsset';

const bossHpFont = matchFont({
  fontFamily: 'System',
  fontSize: 20,
  fontWeight: 'bold',
  fontStyle: 'italic',
});

function drawAtlasFrame(
  canvas: SkCanvas,
  atlas: NonNullable<RenderResources['bossAtlas']>,
  frame: BossFrameRect,
  feetX: number,
  feetY: number,
  screenScale: number,
  alpha: number,
): { headX: number; headY: number; width: number; height: number } {
  const drawScale = screenScale * BOSS_CONFIG.visualScale;
  const width = BOSS_CELL.w * drawScale;
  const height = BOSS_CELL.h * drawScale;
  const x = feetX - width * 0.5;
  const y = feetY - height;

  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setAlphaf(alpha);

  canvas.drawImageRect(
    atlas,
    Skia.XYWHRect(frame.x, frame.y, frame.w, frame.h),
    Skia.XYWHRect(x, y, width, height),
    paint,
  );
  paint.dispose();

  return {
    headX: feetX,
    headY: y + 10 * screenScale,
    width,
    height,
  };
}

function drawBossHealthBar(
  canvas: SkCanvas,
  resources: RenderResources,
  headX: number,
  headY: number,
  barWidth: number,
  scale: number,
  hp: number,
  maxHp: number,
  alpha: number,
): void {
  if (maxHp <= 0 || alpha <= 0.02) {
    return;
  }

  const ratio = Math.max(0, Math.min(1, hp / maxHp));
  const barH = Math.max(5, 6 * scale);
  const barW = Math.max(56, barWidth);
  const barX = headX - barW * 0.5;
  const barY = headY - 10 * scale;
  const hpLabel = String(Math.max(0, Math.ceil(hp)));
  const labelY = barY - 6 * scale;

  resources.paints.bossHpShadow.setAlphaf(alpha * 0.85);
  canvas.drawText(
    hpLabel,
    headX - hpLabel.length * 5.8 + 1.5,
    labelY + 1.5,
    resources.paints.bossHpShadow,
    bossHpFont,
  );
  resources.paints.bossHpShadow.setAlphaf(1);

  resources.paints.bossHpText.setAlphaf(alpha);
  canvas.drawText(
    hpLabel,
    headX - hpLabel.length * 5.8,
    labelY,
    resources.paints.bossHpText,
    bossHpFont,
  );
  resources.paints.bossHpText.setAlphaf(1);

  resources.paints.hpBack.setAlphaf(alpha * 0.92);
  canvas.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(barX, barY, barW, barH), barH * 0.5, barH * 0.5),
    resources.paints.hpBack,
  );
  resources.paints.hpBack.setAlphaf(1);

  if (ratio > 0.001) {
    resources.paints.bossHpFill.setAlphaf(alpha);
    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(barX, barY, barW * ratio, barH),
        barH * 0.5,
        barH * 0.5,
      ),
      resources.paints.bossHpFill,
    );
    resources.paints.bossHpFill.setAlphaf(1);
  }
}

function drawFallbackBossBody(
  canvas: SkCanvas,
  resources: RenderResources,
  feetX: number,
  feetY: number,
  screenScale: number,
  alpha: number,
): { headX: number; headY: number; width: number; height: number } {
  const width = 72 * screenScale;
  const height = 96 * screenScale;
  const x = feetX - width * 0.5;
  const y = feetY - height;

  resources.paints.bossPants.setAlphaf(alpha);
  canvas.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(x + width * 0.12, y + height * 0.18, width * 0.76, height * 0.72), 6, 6),
    resources.paints.bossPants,
  );
  resources.paints.bossMuscle.setAlphaf(alpha);
  canvas.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(x + width * 0.22, y + height * 0.04, width * 0.56, height * 0.22), 4, 4),
    resources.paints.bossMuscle,
  );
  resources.paints.bossPants.setAlphaf(1);
  resources.paints.bossMuscle.setAlphaf(1);

  return {
    headX: feetX,
    headY: y + 10 * screenScale,
    width,
    height,
  };
}

function drawOneBoss(
  canvas: SkCanvas,
  resources: RenderResources,
  boss: Boss,
  state: GameState,
  width: number,
  height: number,
): void {
  const atlas = resources.bossAtlas;

  const death = boss.dying ? Math.min(1, boss.deathT / BOSS_CONFIG.deathDuration) : 0;
  const point = worldToScreen(
    boss.x,
    boss.z,
    state.distance,
    width,
    height,
    GAME_CONFIG.camera,
  );
  const alpha = 1 - death * 0.92;
  const screenScale = point.scale * (1 - death * 0.35);

  if (alpha <= 0.02) {
    return;
  }

  const sprite = pickBossSprite(boss);
  const drawScale = screenScale * BOSS_CONFIG.visualScale;
  const bodyWidth = BOSS_CELL.w * drawScale;
  const bodyHeight = BOSS_CELL.h * drawScale;

  resources.paints.bossShadow.setAlphaf(alpha * 0.35);
  canvas.drawOval(
    {
      x: point.screenX - bodyWidth * 0.34,
      y: point.screenY - bodyHeight * 0.04,
      width: bodyWidth * 0.68,
      height: bodyHeight * 0.08,
    },
    resources.paints.bossShadow,
  );
  resources.paints.bossShadow.setAlphaf(1);

  const layout = atlas
    ? drawAtlasFrame(
        canvas,
        atlas,
        sprite.body,
        point.screenX,
        point.screenY,
        screenScale,
        alpha,
      )
    : drawFallbackBossBody(
        canvas,
        resources,
        point.screenX,
        point.screenY,
        screenScale,
        alpha,
      );

  if (boss.hitFlash > 0 && !boss.dying) {
    const flash = Math.min(1, boss.hitFlash / BOSS_CONFIG.hitFlashDuration);
    resources.paints.hitFlash.setAlphaf(alpha * 0.28 * flash);
    canvas.drawOval(
      {
        x: point.screenX - layout.width * 0.28,
        y: layout.headY,
        width: layout.width * 0.56,
        height: layout.height * 0.72,
      },
      resources.paints.hitFlash,
    );
    resources.paints.hitFlash.setAlphaf(1);
  }

  if (!boss.dying) {
    drawBossHealthBar(
      canvas,
      resources,
      layout.headX,
      layout.headY,
      layout.width * 0.72,
      screenScale,
      boss.hp,
      boss.maxHp,
      alpha,
    );
  }
}

export function drawBoss(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  if (!state.boss.active) {
    return;
  }
  drawOneBoss(canvas, resources, state.boss, state, width, height);
}
