import * as THREE from "three";

// EXERCISE E2: build a square-based pyramid from raw vertex data.
export function buildPyramid(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  // TODO(E2): define 5 vertices — 4 base corners (y=0) + 1 apex (above centre).
  const positions = new Float32Array([
    // x, y, z   (fill these in)
  ]);
  // TODO(E2): define triangle indices — 4 side faces + 2 base triangles (CCW so faces point outward).
  const indices: number[] = [];
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  // TODO(E2): compute normals so lighting works.
  return geometry;
}
