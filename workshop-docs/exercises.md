# Exercises

Three short hands-on fill-ins. Each example ships a working page with one
deliberate gap marked `TODO(E…)`, plus a complete `*.solution` file next to it so
you can check your answer (don't peek too early).

How to work: run `npm run dev`, open the example, edit the gapped file, watch the
page hot-reload. Diff against the solution when you're done.

---

## E1 — Orbit a child around a parent (topic 01)

**Goal:** make a child object circle its parent, using the parent-child transform
relationship (a child inherits its parent's transform).

- **File:** `examples/01-space-transforms/main.ts`
- **Solution:** `examples/01-space-transforms/main.solution.ts`
- **Where:** the `TODO (E1)` marker inside the render loop.

**Task:** when the "Parent group" toggle is on, rotate the group every frame so
the offset child sweeps around the parent's origin.

**Hint:** the child already sits at an offset from the group's origin. In the
loop, add `group.rotation.y += dt * groupSpeed`. Because the child is parented to
the group, rotating the group orbits the child — you never touch the child's own
position.

**Done when:** with the parent group enabled, the child traces a circle around
the parent instead of sitting still.

---

## E2 — Build a pyramid from raw vertices (topic 02)

**Goal:** construct a `BufferGeometry` by hand — define the vertices, wire them
into triangles, and compute normals. This is what every loader does under the
hood.

- **File:** `examples/02-topology/pyramid.ts`
- **Solution:** `examples/02-topology/pyramid.solution.ts`
- **Where:** the three `TODO(E2)` markers in `buildPyramid()`.

**Task:** a square-based pyramid has **5 vertices** (4 base corners + 1 apex) and
**6 triangles** (4 sides + 2 for the square base).

1. Fill `positions` with 5 xyz vertices — base corners at `(±1, 0, ±1)`, apex at
   `(0, 1.5, 0)`.
2. Fill `indices` with 6 triangles (18 indices). Wind each triangle
   **counter-clockwise when viewed from outside** so its normal points outward
   (otherwise the face is culled / lit wrong).
3. Call `geometry.computeVertexNormals()` so lighting works.

**Hint:** index your vertices 0–3 for the base (say, going around the square) and
4 for the apex. Each side face is `(apex, cornerA, cornerB)`; the base is two
triangles splitting the square. If a face looks black or vanishes, its winding is
reversed — swap two of its indices.

**Done when:** selecting "Custom pyramid" in the Geometry dropdown shows a solid,
correctly-lit pyramid (not inside-out, not black).

---

## E3 — Convert a vanilla snippet to React Three Fiber (topic 07)

**Goal:** translate imperative three.js into declarative R3F JSX.

- **File:** `examples/07-react-three-fiber/App.tsx`
- **Solution:** `examples/07-react-three-fiber/App.solution.tsx`
- **Where:** the `TODO(E3)` comment containing the vanilla snippet.

**Task:** the comment holds the vanilla code that builds supporting box A:

```ts
const geo = new THREE.BoxGeometry(1, 1, 1);
const mat = new THREE.MeshStandardMaterial({ color: 0xff6688 });
const box = new THREE.Mesh(geo, mat);
box.position.set(-2.5, 0, 0);
box.castShadow = true;
scene.add(box);
```

Replace it with the equivalent JSX so the box appears in the scene.

**Hint:** `new THREE.Mesh(geo, mat)` → `<mesh>`; constructor args go in `args`;
the geometry/material become child elements:

```tsx
<mesh position={[-2.5, 0, 0]} castShadow>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial color={0xff6688} />
</mesh>
```

**Done when:** the pink box appears at the left of the scene, matching the vanilla
version in example 06.

---

### Checking your work

Each solution file is the reference. They're also wired so you can temporarily
point the example's import/render at the `*.solution` version to see the intended
result, then switch back and reproduce it yourself.
