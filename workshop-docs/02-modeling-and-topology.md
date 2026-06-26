# 02 · Modeling & Topology

## 1. Concepts

### Vertices, edges, faces

A 3D mesh is a collection of **vertices** (points in space) connected by **edges** (lines) forming **faces** (polygons). GPUs only rasterise **triangles** — every quad or polygon the modeller draws gets split before reaching the GPU.

```
Quad → 2 triangles
+---+       +---+
|   |  →   |\ |
|   |       | \|
+---+       +--+
```

### BufferGeometry = typed arrays

Three.js `BufferGeometry` holds geometry as flat typed arrays (attributes):

| Attribute | Type | Values per vertex |
|-----------|------|-------------------|
| `position` | `Float32Array` | 3 (x, y, z) |
| `normal`   | `Float32Array` | 3 (nx, ny, nz) |
| `uv`       | `Float32Array` | 2 (u, v) |

Access via `geometry.attributes.position`, etc.

### Indexed vs non-indexed

**Indexed** — a separate `index` array (`Uint16Array` / `Uint32Array`) lists which vertices form each triangle. Vertices are *shared* between adjacent faces. Memory-efficient for closed meshes.

```
positions: [A, B, C, D]        (4 unique vertices)
index:     [0,1,2,  0,2,3]    (6 index values = 2 triangles)
```

**Non-indexed** — no index array; vertices are duplicated one-per-corner. Each triangle owns all 3 of its vertices. Doubles memory for a closed mesh but required for per-face (flat) normals.

Convert: `geometry.toNonIndexed()`.

### Winding order & back-face culling

The order vertices appear in a triangle (counter-clockwise / CCW when viewed from the visible side) determines the **face normal direction**. By default the GPU culls back faces (the `MeshStandardMaterial` default is `side: THREE.FrontSide`), so wrong winding = face invisible.

> Note: this example deliberately ships `side: THREE.DoubleSide` so a mis-wound pyramid (exercise E2) stays visible while you debug it. To *see* back-face culling, switch the material to `THREE.FrontSide` (try-this #5 below) — then wrong-wound faces vanish.

```
CCW from front = outward normal = visible
CW from front  = inward normal  = culled
```

### Normals

Normals are unit vectors perpendicular to the surface at each vertex. They drive diffuse + specular lighting. Call `geometry.computeVertexNormals()` after setting positions/index.

### Flat vs smooth shading

| Mode | How | Result |
|------|-----|--------|
| Smooth | One normal per vertex, shared across adjacent faces | Edges look curved/rounded |
| Flat | One normal per triangle corner (non-indexed, each face owns 3 verts) | Hard edges, faceted look |

Three.js path: smooth = `computeVertexNormals()` on indexed geo; flat = `toNonIndexed()` then `computeVertexNormals()`.

---

## 2. The Playground

Open `examples/02-topology/` in the dev server. Controls:

| Control | What to watch |
|---------|---------------|
| **Geometry** | Swap between Box / Sphere / Torus / Custom pyramid. Pyramid uses your E2 code. |
| **Segments** | Higher = more triangles, rounder silhouette. Watch vertex + tri count update. |
| **Wireframe** | Reveals triangle topology underneath the shaded surface. |
| **Smooth normals** | Toggle smooth ↔ flat. On low-segment Sphere the faceting becomes obvious. |
| **Show normals** | Red arrows per vertex. Flat mode = all arrows in a face point the same direction. Smooth = they fan out. |
| **Indexed** | Uncheck → `toNonIndexed()`. Vertex count jumps (3× tris) while tri count stays same. |
| **Auto-rotate** | Slow spin to see all faces under directional light. |

The overlay shows live **vertex count** and **triangle count**.

---

## 3. Try This

1. Set **Sphere**, **Segments = 1** → minimal UV sphere. Toggle wireframe — see the actual triangles.
2. Toggle **Indexed** on/off while watching the vertex count. On a 4-segment box: indexed ≈ 24 verts, non-indexed = 3 × tri_count.
3. **Smooth normals OFF** (flat) + **Show normals ON** → each face's three normals are identical and perpendicular to that face.
4. Switch to **Custom pyramid** — scene shows a placeholder (empty geometry from the gapped exercise). Open `examples/02-topology/pyramid.ts` and complete **Exercise E2**:
   - Define 5 vertices (base corners + apex).
   - Define 6 triangles (4 sides + 2 base), CCW winding for outward normals.
   - Call `geometry.computeVertexNormals()`.
   - Reload — your pyramid should appear lit and solid.
   - Compare your solution against `pyramid.solution.ts`.
5. Try `side: THREE.DoubleSide` vs `THREE.FrontSide` in the material to see back-face culling in action.

---

## 4. Gotchas

- **Wrong winding → invisible / black faces.** Back-face culling removes triangles whose normal points away from the camera. Use `THREE.DoubleSide` temporarily to diagnose, then fix the index order.
- **Missing normals → black under lights.** `MeshStandardMaterial` needs normals for lighting. Always call `computeVertexNormals()` after setting positions/index.
- **Non-indexed doubles memory.** On a 64-segment sphere: ~8 k shared verts (indexed) vs ~24 k duplicated verts (non-indexed). Only go non-indexed when you need per-face normals or unique per-corner UVs.
- **`toNonIndexed()` returns a new geometry** — the original is unchanged. Dispose the old one to avoid GPU memory leaks.
- **Segment slider has no effect on Custom pyramid** — `buildPyramid()` ignores the `segments` param (fixed topology). The slider is disabled for that selection.

---

## 5. Optional Advanced

- **Interleaved buffers** — pack position + normal + uv into one `InterleavedBuffer` for better GPU cache locality.
- **`BufferGeometryUtils.mergeVertices`** — re-index a non-indexed geometry (weld coincident vertices). Useful after procedural generation.
- **Custom UVs** — add a `uv` attribute (`Float32Array`, 2 values/vertex) and supply a texture to `map`. Non-indexed geometry lets you set unique UV seams per face.
- **MorphAttributes** — per-vertex deltas for blend-shape animation without re-uploading the full buffer.

---

## 6. Next

Shape in hand — now give its surface a material.

→ [03 · Materials](./03-materials.md)
