/**
 * Procedural point-cloud generator — stands in for a real 3D scan.
 *
 * Real scans (LiDAR / photogrammetry) give you millions of XYZ points, usually
 * with per-point colour or intensity. Shipping a multi-hundred-MB scan in a
 * workshop repo is impractical, so we synthesise a scan-like surface here:
 * a layered-noise terrain, jittered to mimic sensor noise, coloured by height.
 *
 * The output is exactly what example 08 uploads to the GPU: flat Float32Arrays
 * of positions and colours, plus the bounding box.
 *
 * Deterministic: same `seed` → identical output (no Math.random), which keeps
 * the demo reproducible and makes the unit tests meaningful.
 */

export interface PointCloud {
  /** xyz triples, length = count * 3 */
  positions: Float32Array;
  /** rgb triples in 0..1, length = count * 3 */
  colors: Float32Array;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

export interface PointCloudOptions {
  /** PRNG seed for reproducibility. Default 1. */
  seed?: number;
  /** Half-extent of the sampled square in X/Z. Default 50. */
  extent?: number;
}

/** mulberry32 — tiny, fast, deterministic PRNG. Returns a function -> [0,1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Layered sine "terrain" height at (x, z). Cheap, smooth, scan-ish. */
function terrainHeight(x: number, z: number): number {
  return (
    Math.sin(x * 0.12) * 6 +
    Math.cos(z * 0.16) * 4 +
    Math.sin((x + z) * 0.05) * 8 +
    Math.sin(x * 0.4 + z * 0.3) * 1.5
  );
}

/** Map a normalised height t in [0,1] to a blue → green → white ramp. */
function heightColor(t: number, out: [number, number, number]): void {
  if (t < 0.5) {
    // blue -> green
    const k = t / 0.5;
    out[0] = 0.1 * (1 - k) + 0.2 * k;
    out[1] = 0.3 * (1 - k) + 0.7 * k;
    out[2] = 0.7 * (1 - k) + 0.3 * k;
  } else {
    // green -> white
    const k = (t - 0.5) / 0.5;
    out[0] = 0.2 * (1 - k) + 1.0 * k;
    out[1] = 0.7 * (1 - k) + 1.0 * k;
    out[2] = 0.3 * (1 - k) + 1.0 * k;
  }
}

export function generatePointCloud(
  count: number,
  opts: PointCloudOptions = {},
): PointCloud {
  const { seed = 1, extent = 50 } = opts;
  const rand = mulberry32(seed);

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];

  // First pass: positions + track height range for colour normalisation.
  let yMin = Infinity;
  let yMax = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = (rand() * 2 - 1) * extent;
    const z = (rand() * 2 - 1) * extent;
    // sensor-noise jitter on height
    const y = terrainHeight(x, z) + (rand() * 2 - 1) * 0.6;

    const o = i * 3;
    positions[o] = x;
    positions[o + 1] = y;
    positions[o + 2] = z;

    // Read back the float32-rounded values so bounds always enclose the stored
    // points (a double tracked here could be tighter than the float32 readback).
    const sx = positions[o];
    const sy = positions[o + 1];
    const sz = positions[o + 2];
    if (sx < min[0]) min[0] = sx;
    if (sy < min[1]) min[1] = sy;
    if (sz < min[2]) min[2] = sz;
    if (sx > max[0]) max[0] = sx;
    if (sy > max[1]) max[1] = sy;
    if (sz > max[2]) max[2] = sz;
    if (sy < yMin) yMin = sy;
    if (sy > yMax) yMax = sy;
  }

  // Second pass: colour by normalised height.
  const span = yMax - yMin || 1;
  const rgb: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    const o = i * 3;
    const t = (positions[o + 1] - yMin) / span;
    heightColor(t, rgb);
    colors[o] = rgb[0];
    colors[o + 1] = rgb[1];
    colors[o + 2] = rgb[2];
  }

  return { positions, colors, bounds: { min, max } };
}
