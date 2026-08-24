import {
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  type SkPaint,
  type SkPath,
  type SkPictureRecorder,
} from '@shopify/react-native-skia';

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
  hitFlash: SkPaint;
  particle: SkPaint;
  contact: SkPaint;
  hint: SkPaint;
}

export interface RenderResources {
  recorder: SkPictureRecorder;
  paints: Paints;
  path: SkPath;
  layout: { width: number; height: number };
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
      hitFlash: fillPaint(PALETTE.hitFlash),
      particle: fillPaint(PALETTE.particle),
      contact: fillPaint(PALETTE.contact),
      hint: fillPaint(PALETTE.hint),
    },
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
