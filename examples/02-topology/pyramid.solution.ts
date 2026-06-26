import * as THREE from "three";

// SOLUTION E2: square-based pyramid.
// 5 vertices: indices 0-3 = base corners (y=0), index 4 = apex (y=1.5).
//
//   top-down base (y=0):
//     3 --- 2
//     |     |
//     0 --- 1
//
//   apex: index 4, at (0, 1.5, 0)
//
// CCW winding viewed from outside:
//   Front  side: 0,1,4
//   Right  side: 1,2,4
//   Back   side: 2,3,4
//   Left   side: 3,0,4
//   Base   tri1: 0,3,2
//   Base   tri2: 0,2,1
export function buildPyramid(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // 5 vertices  (x, y, z)
  const positions = new Float32Array([
    -1, 0,  1,   // 0 front-left
     1, 0,  1,   // 1 front-right
     1, 0, -1,   // 2 back-right
    -1, 0, -1,   // 3 back-left
     0, 1.5, 0,  // 4 apex
  ]);

  // 6 triangles × 3 indices = 18 values
  const indices: number[] = [
    // 4 side faces (CCW from outside)
    0, 1, 4,  // front
    1, 2, 4,  // right
    2, 3, 4,  // back
    3, 0, 4,  // left
    // base (2 tris, CCW looking up from below = CW from above = outward downward normal)
    0, 3, 2,
    0, 2, 1,
  ];

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
