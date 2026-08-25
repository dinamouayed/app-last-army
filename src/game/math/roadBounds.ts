import type { CameraConfig, LaneIndex } from '../types';

export interface RoadWorldBounds {
  minX: number;
  maxX: number;
}

export interface AsphaltLaneBounds extends RoadWorldBounds {
  centerX: number;
}

/** Valid world X range for entities on the road plane at any depth. */
export function getRoadWorldBounds(
  camera: CameraConfig,
  margin: number,
): RoadWorldBounds {
  return {
    minX: -camera.roadHalfWidth + margin,
    maxX: camera.roadHalfWidth - margin,
  };
}

export function clampWorldXToRoad(
  worldX: number,
  camera: CameraConfig,
  margin: number,
): number {
  const bounds = getRoadWorldBounds(camera, margin);
  return Math.max(bounds.minX, Math.min(bounds.maxX, worldX));
}

/** Alias for depth-aware callers — road half-width is constant in world space. */
export function getRoadWorldBoundsAtDepth(
  _worldZ: number,
  camera: CameraConfig,
  margin: number,
): RoadWorldBounds {
  return getRoadWorldBounds(camera, margin);
}

/** World-space width of one LEFT / CENTER / RIGHT asphalt third. */
export function asphaltLaneWidth(camera: CameraConfig, laneCount = 3): number {
  return (2 * camera.roadHalfWidth) / laneCount;
}

/** Center of a playable asphalt third. World X is depth-independent; perspective is applied in projection. */
export function asphaltLaneCenterX(lane: LaneIndex, camera: CameraConfig): number {
  return (lane - 1) * asphaltLaneWidth(camera);
}

/** Playable lane whose asphalt center is closest to world X. */
export function nearestAsphaltLane(worldX: number, camera: CameraConfig): LaneIndex {
  const width = asphaltLaneWidth(camera);
  const raw = width > 0 ? Math.round(worldX / width + 1) : 1;
  if (raw <= 0) {
    return 0;
  }
  if (raw >= 2) {
    return 2;
  }
  return 1;
}

export function asphaltLaneBounds(
  lane: LaneIndex,
  camera: CameraConfig,
  margin: number,
): AsphaltLaneBounds {
  const laneWidth = asphaltLaneWidth(camera);
  const centerX = asphaltLaneCenterX(lane, camera);
  const road = getRoadWorldBounds(camera, margin);
  const half = laneWidth * 0.5;
  return {
    centerX,
    minX: Math.max(road.minX, centerX - half),
    maxX: Math.min(road.maxX, centerX + half),
  };
}

export function clampWorldXToLane(
  worldX: number,
  lane: LaneIndex,
  camera: CameraConfig,
  margin: number,
): number {
  const laneBounds = asphaltLaneBounds(lane, camera, margin);
  const clamped = Math.max(laneBounds.minX, Math.min(laneBounds.maxX, worldX));
  return clampWorldXToRoad(clamped, camera, margin);
}
