import type { SkImage, SkPaint, SkPath, SkPictureRecorder } from '@shopify/react-native-skia';

import { PaintStyle, Skia, StrokeCap, StrokeJoin, TileMode } from './skia';

import { PALETTE } from '../game/config/palette';

export interface Paints {
  sky: SkPaint;
  skyWarm: SkPaint;
  haze: SkPaint;
  cloud: SkPaint;
  cloudDark: SkPaint;
  ground: SkPaint;
  groundDark: SkPaint;
  groundLight: SkPaint;
  gravel: SkPaint;
  roadShoulder: SkPaint;
  road: SkPaint;
  roadDark: SkPaint;
  asphaltWorn: SkPaint;
  asphaltPatch: SkPaint;
  asphaltGrain: SkPaint;
  tireMark: SkPaint;
  crack: SkPaint;
  roadEdge: SkPaint;
  laneLine: SkPaint;
  barrier: SkPaint;
  barrierDark: SkPaint;
  sandbag: SkPaint;
  crate: SkPaint;
  crateGreen: SkPaint;
  barrel: SkPaint;
  rubble: SkPaint;
  container: SkPaint;
  pole: SkPaint;
  metal: SkPaint;
  concrete: SkPaint;
  fence: SkPaint;
  signBoard: SkPaint;
  smoke: SkPaint;
  skyline: SkPaint;
  silhouette: SkPaint;
  soldierShadow: SkPaint;
  soldierBoot: SkPaint;
  soldierPants: SkPaint;
  soldierUniform: SkPaint;
  soldierUniformDark: SkPaint;
  soldierSkin: SkPaint;
  soldierHelmet: SkPaint;
  soldierGun: SkPaint;
  soldierGunMetal: SkPaint;
  enemyUniform: SkPaint;
  enemyUniformDark: SkPaint;
  enemyHelmet: SkPaint;
  enemyPants: SkPaint;
  muzzleFlash: SkPaint;
  muzzleCore: SkPaint;
  tracer: SkPaint;
  tracerCore: SkPaint;
  hpBack: SkPaint;
  hpFill: SkPaint;
  bossHpFill: SkPaint;
  bossHpText: SkPaint;
  bossHpShadow: SkPaint;
  bossSkin: SkPaint;
  bossSkinDark: SkPaint;
  bossSkinShadow: SkPaint;
  bossMuscle: SkPaint;
  bossWound: SkPaint;
  bossWoundDark: SkPaint;
  bossPants: SkPaint;
  bossPantsDark: SkPaint;
  bossMustache: SkPaint;
  bossBrow: SkPaint;
  bossEye: SkPaint;
  bossWristband: SkPaint;
  bossShadow: SkPaint;
  hitFlash: SkPaint;
  particle: SkPaint;
  contact: SkPaint;
  gatePositive: SkPaint;
  gatePositiveGlow: SkPaint;
  gatePositiveFrame: SkPaint;
  gateNegative: SkPaint;
  gateNegativeGlow: SkPaint;
  gateNegativeFrame: SkPaint;
  gateMultiply: SkPaint;
  gateMultiplyGlow: SkPaint;
  gateMultiplyFrame: SkPaint;
  gateLabel: SkPaint;
  gateLabelShadow: SkPaint;
  gateParticlePositive: SkPaint;
  gateParticleNegative: SkPaint;
  weaponGlow: SkPaint;
  weaponGlowOuter: SkPaint;
  weaponCrate: SkPaint;
  weaponCrateDark: SkPaint;
  barrelWood: SkPaint;
  barrelWoodDark: SkPaint;
  barrelHoop: SkPaint;
  weaponMetal: SkPaint;
  weaponLabel: SkPaint;
  accent: SkPaint;
  hint: SkPaint;
}

export interface RenderResources {
  recorder: SkPictureRecorder;
  paints: Paints;
  path: SkPath;
  layout: { width: number; height: number };
  bossAtlas: SkImage | null;
}

function fillPaint(color: string): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));
  return paint;
}

function strokePaint(color: string, width: number): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeJoin(StrokeJoin.Round);
  return paint;
}

export function createRenderResources(): RenderResources {
  return {
    recorder: Skia.PictureRecorder(),
    path: Skia.Path.Make(),
    layout: { width: 0, height: 0 },
    paints: {
      sky: fillPaint(PALETTE.skyTop),
      skyWarm: fillPaint(PALETTE.skyWarm),
      haze: fillPaint(PALETTE.haze),
      cloud: fillPaint(PALETTE.cloud),
      cloudDark: fillPaint(PALETTE.cloudDark),
      ground: fillPaint(PALETTE.ground),
      groundDark: fillPaint(PALETTE.groundDark),
      groundLight: fillPaint(PALETTE.groundLight),
      gravel: fillPaint(PALETTE.gravel),
      roadShoulder: fillPaint(PALETTE.roadShoulder),
      road: fillPaint(PALETTE.road),
      roadDark: fillPaint(PALETTE.roadDark),
      asphaltWorn: fillPaint(PALETTE.asphaltWorn),
      asphaltPatch: fillPaint(PALETTE.asphaltPatch),
      asphaltGrain: fillPaint(PALETTE.asphaltGrain),
      tireMark: fillPaint(PALETTE.tireMark),
      crack: strokePaint(PALETTE.crack, 1.6),
      roadEdge: fillPaint(PALETTE.roadEdge),
      laneLine: fillPaint(PALETTE.laneLine),
      barrier: fillPaint(PALETTE.barrier),
      barrierDark: fillPaint(PALETTE.barrierDark),
      sandbag: fillPaint(PALETTE.sandbag),
      crate: fillPaint(PALETTE.crate),
      crateGreen: fillPaint(PALETTE.crateGreen),
      barrel: fillPaint(PALETTE.barrel),
      rubble: fillPaint(PALETTE.rubble),
      container: fillPaint(PALETTE.container),
      pole: fillPaint(PALETTE.pole),
      metal: fillPaint(PALETTE.metal),
      concrete: fillPaint(PALETTE.concrete),
      fence: fillPaint(PALETTE.fence),
      signBoard: fillPaint(PALETTE.signBoard),
      smoke: fillPaint(PALETTE.smoke),
      skyline: fillPaint(PALETTE.skyline),
      silhouette: fillPaint(PALETTE.silhouette),
      soldierShadow: fillPaint(PALETTE.soldierShadow),
      soldierBoot: fillPaint(PALETTE.soldierBoot),
      soldierPants: fillPaint(PALETTE.soldierPants),
      soldierUniform: fillPaint(PALETTE.soldierUniform),
      soldierUniformDark: fillPaint(PALETTE.soldierUniformDark),
      soldierSkin: fillPaint(PALETTE.soldierSkin),
      soldierHelmet: fillPaint(PALETTE.soldierHelmet),
      soldierGun: fillPaint(PALETTE.soldierGun),
      soldierGunMetal: fillPaint(PALETTE.soldierGunMetal),
      enemyUniform: fillPaint(PALETTE.enemyUniform),
      enemyUniformDark: fillPaint(PALETTE.enemyUniformDark),
      enemyHelmet: fillPaint(PALETTE.enemyHelmet),
      enemyPants: fillPaint(PALETTE.enemyPants),
      muzzleFlash: fillPaint(PALETTE.muzzleFlash),
      muzzleCore: fillPaint(PALETTE.muzzleCore),
      tracer: strokePaint(PALETTE.tracer, 4.2),
      tracerCore: strokePaint(PALETTE.tracerCore, 2.1),
      hpBack: fillPaint(PALETTE.hpBack),
      hpFill: fillPaint(PALETTE.hpFill),
      bossHpFill: fillPaint(PALETTE.bossHpFill),
      bossHpText: fillPaint(PALETTE.bossHpText),
      bossHpShadow: fillPaint(PALETTE.bossHpShadow),
      bossSkin: fillPaint(PALETTE.bossSkin),
      bossSkinDark: fillPaint(PALETTE.bossSkinDark),
      bossSkinShadow: fillPaint(PALETTE.bossSkinShadow),
      bossMuscle: fillPaint(PALETTE.bossMuscle),
      bossWound: fillPaint(PALETTE.bossWound),
      bossWoundDark: fillPaint(PALETTE.bossWoundDark),
      bossPants: fillPaint(PALETTE.bossPants),
      bossPantsDark: fillPaint(PALETTE.bossPantsDark),
      bossMustache: fillPaint(PALETTE.bossMustache),
      bossBrow: fillPaint(PALETTE.bossBrow),
      bossEye: fillPaint(PALETTE.bossEye),
      bossWristband: fillPaint(PALETTE.bossWristband),
      bossShadow: fillPaint(PALETTE.bossShadow),
      hitFlash: fillPaint(PALETTE.hitFlash),
      particle: fillPaint(PALETTE.particle),
      contact: fillPaint(PALETTE.contact),
      gatePositive: fillPaint(PALETTE.gatePositive),
      gatePositiveGlow: fillPaint(PALETTE.gatePositiveGlow),
      gatePositiveFrame: strokePaint(PALETTE.gatePositiveFrame, 4),
      gateNegative: fillPaint(PALETTE.gateNegative),
      gateNegativeGlow: fillPaint(PALETTE.gateNegativeGlow),
      gateNegativeFrame: strokePaint(PALETTE.gateNegativeFrame, 4),
      gateMultiply: fillPaint(PALETTE.gateMultiply),
      gateMultiplyGlow: fillPaint(PALETTE.gateMultiplyGlow),
      gateMultiplyFrame: strokePaint(PALETTE.gateMultiplyFrame, 4),
      gateLabel: fillPaint(PALETTE.gateLabel),
      gateLabelShadow: fillPaint(PALETTE.gateLabelShadow),
      gateParticlePositive: fillPaint(PALETTE.gatePositiveGlow),
      gateParticleNegative: fillPaint(PALETTE.gateNegativeGlow),
      weaponGlow: fillPaint(PALETTE.weaponGlow),
      weaponGlowOuter: fillPaint(PALETTE.weaponGlowOuter),
      weaponCrate: fillPaint(PALETTE.weaponCrate),
      weaponCrateDark: fillPaint(PALETTE.weaponCrateDark),
      barrelWood: fillPaint(PALETTE.barrelWood),
      barrelWoodDark: fillPaint(PALETTE.barrelWoodDark),
      barrelHoop: fillPaint(PALETTE.barrelHoop),
      weaponMetal: fillPaint(PALETTE.weaponMetal),
      weaponLabel: fillPaint(PALETTE.weaponLabel),
      accent: fillPaint(PALETTE.accent),
      hint: fillPaint(PALETTE.hint),
    },
    bossAtlas: null,
  };
}

export function applySkyGradient(paint: SkPaint, horizonY: number): void {
  paint.setShader(
    Skia.Shader.MakeLinearGradient(
      { x: 0, y: 0 },
      { x: 0, y: horizonY },
      [
        Skia.Color(PALETTE.skyTop),
        Skia.Color('#8fa3b5'),
        Skia.Color(PALETTE.skyHorizon),
      ],
      [0, 0.55, 1],
      TileMode.Clamp,
    ),
  );
}

export function applyGroundGradient(
  paint: SkPaint,
  horizonY: number,
  height: number,
): void {
  paint.setShader(
    Skia.Shader.MakeLinearGradient(
      { x: 0, y: horizonY },
      { x: 0, y: height },
      [Skia.Color(PALETTE.groundFar), Skia.Color(PALETTE.ground)],
      null,
      TileMode.Clamp,
    ),
  );
}
