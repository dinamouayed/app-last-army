/**
 * Closest point on segment AB to circle center C, then radius test.
 * Returns parametric t in [0, 1] on hit, otherwise null.
 */
export function segmentCircleHitT(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  cx: number,
  cz: number,
  radius: number,
): number | null {
  const abx = bx - ax;
  const abz = bz - az;
  const acx = cx - ax;
  const acz = cz - az;
  const abLenSq = abx * abx + abz * abz;
  let t = 0;
  if (abLenSq > 0) {
    t = (acx * abx + acz * abz) / abLenSq;
    if (t < 0) {
      t = 0;
    } else if (t > 1) {
      t = 1;
    }
  }
  const px = ax + abx * t;
  const pz = az + abz * t;
  const dx = px - cx;
  const dz = pz - cz;
  if (dx * dx + dz * dz > radius * radius) {
    return null;
  }
  return t;
}

export function segmentCircleHits(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  cx: number,
  cz: number,
  radius: number,
): boolean {
  return segmentCircleHitT(ax, az, bx, bz, cx, cz, radius) !== null;
}

export function circlesOverlap(
  ax: number,
  az: number,
  ar: number,
  bx: number,
  bz: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dz = az - bz;
  const reach = ar + br;
  return dx * dx + dz * dz <= reach * reach;
}

export function worldDistance(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x1 - x2;
  const dz = z1 - z2;
  return Math.sqrt(dx * dx + dz * dz);
}
