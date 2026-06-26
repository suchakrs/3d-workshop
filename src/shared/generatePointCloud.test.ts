import { describe, it, expect } from "vitest";
import { generatePointCloud } from "./generatePointCloud";

describe("generatePointCloud", () => {
  it("returns positions and colors of length count*3", () => {
    const { positions, colors } = generatePointCloud(1000, { seed: 1 });
    expect(positions.length).toBe(3000);
    expect(colors.length).toBe(3000);
  });

  it("is deterministic for a given seed", () => {
    const a = generatePointCloud(500, { seed: 42 });
    const b = generatePointCloud(500, { seed: 42 });
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
  });

  it("differs for different seeds", () => {
    const a = generatePointCloud(500, { seed: 1 });
    const b = generatePointCloud(500, { seed: 2 });
    expect(Array.from(a.positions)).not.toEqual(Array.from(b.positions));
  });

  it("colors are within 0..1", () => {
    const { colors } = generatePointCloud(500, { seed: 1 });
    expect(Math.min(...colors)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...colors)).toBeLessThanOrEqual(1);
  });

  it("bounds enclose all points", () => {
    const { positions, bounds } = generatePointCloud(2000, { seed: 7 });
    for (let i = 0; i < positions.length; i += 3) {
      expect(positions[i]).toBeGreaterThanOrEqual(bounds.min[0]);
      expect(positions[i]).toBeLessThanOrEqual(bounds.max[0]);
      expect(positions[i + 1]).toBeGreaterThanOrEqual(bounds.min[1]);
      expect(positions[i + 1]).toBeLessThanOrEqual(bounds.max[1]);
      expect(positions[i + 2]).toBeGreaterThanOrEqual(bounds.min[2]);
      expect(positions[i + 2]).toBeLessThanOrEqual(bounds.max[2]);
    }
  });
});
