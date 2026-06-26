# 05 · Cameras — Perspective, Orthographic & the View Frustum

## 1 — Concept

### The two transforms every camera applies

When three.js renders a frame, every vertex goes through two sequential transforms:

1. **View transform** (world → view space): positions things relative to the camera.  
   Encoded in `camera.matrixWorldInverse`.

2. **Projection transform** (view → clip space): maps 3-D depth onto the 2-D screen and determines *how* depth affects apparent size.  
   Encoded in `camera.projectionMatrix`.

### Perspective projection

```
PerspectiveCamera(fov, aspect, near, far)
```

Objects shrink as they move away — just like real eyes and lenses. The **field of view** (FOV) is the vertical angle of the frustum in degrees. A wider FOV fits more but distorts the edges; a narrow FOV feels telephoto / "zoomed in".

**The view frustum** (perspective):

```
          near          far
    ┌──────┐          ┌────────────┐
    │      │         /              \
    │      │        /   (scene)      \
    │      │       /                  \
    └──────┘      └────────────────────┘
   (small)                 (large)
```

Anything outside this truncated pyramid is clipped — not rendered.

### Orthographic projection

```
OrthographicCamera(left, right, top, bottom, near, far)
```

All projection rays are **parallel**, so objects keep the same size regardless of depth. No foreshortening. Used in CAD tools, 2-D games, UI elements, and technical drawings. The frustum is a simple rectangular box.

### Key parameters

| Param | Perspective | Orthographic |
|-------|-------------|--------------|
| `near` | min render distance (> 0!) | same |
| `far`  | max render distance | same |
| `fov`  | vertical angle (degrees) | — |
| `aspect` | width / height | — |
| `left/right/top/bottom` | — | world-space extents |

### Depth precision & z-fighting

The GPU stores depth in a fixed-precision buffer. Precision is distributed **non-linearly** across [near, far]:

- near too small (e.g. 0.001) → almost all precision crammed near the camera, zero precision far away.
- far too large (e.g. 1 000 000) → same problem.
- Two surfaces very close together at long range → **z-fighting**: pixels flicker between the two.

Rule of thumb: keep `far / near` ratio as small as your scene allows (< 10 000 is safe; < 1 000 is ideal).

---

## 2 — The Playground

Open `examples/05-cameras/` in the browser. You'll see:

- **Main viewport** — the scene rendered through the *active* camera. Drag to orbit, scroll to zoom.
- **Inset (bottom-right, ~30% size)** — a fixed overview camera looking at the whole scene *plus* a **CameraHelper** (yellow/teal wireframe) visualising the active camera's frustum.

### GUI controls

| Control | What it does |
|---------|-------------|
| **Projection** | Switch between Perspective and Orthographic. OrbitControls retargets. |
| **FOV (deg)** | Perspective only — widens/narrows the frustum angle. Watch the helper pyramid grow/shrink. |
| **Ortho zoom** | Orthographic only — scales the orthographic extents (equivalent to zooming). |
| **near** | Clips geometry closer than this. See the frustum near-plane move in the inset. |
| **far** | Clips geometry beyond this. Pull it in to watch boxes disappear. |

Every change calls `camera.updateProjectionMatrix()` + `cameraHelper.update()` — that's how the frustum wireframe stays in sync.

---

## 3 — Try This

1. **FOV 10 vs 120 (dolly-zoom feel)**  
   Set FOV = 10. The scene is heavily compressed — distant boxes look huge. Now zoom in with scroll until they fill the screen. Set FOV = 120 and back up — classic "dolly zoom" / Vertigo effect. The perspective changes feel very different even at the same apparent size.

2. **Switch to Orthographic — parallel lines stay parallel**  
   Switch Projection → Orthographic. The row of boxes no longer converges to a vanishing point. Parallel lines on the grid remain parallel. This is why architects and engineers prefer ortho views.

3. **Set near = 0.001 and far = 100 000 — watch z-fighting**  
   Pull near down to 0.01 and push far up past 10 000. Orbit close to the ground grid and watch it flicker. That's z-fighting from lost depth precision. Restore sane values to fix it.

4. **Watch the frustum helper**  
   While you change FOV or near/far, keep an eye on the inset — the yellow pyramid updates live. This makes the abstract concept of "clipping plane" concrete.

---

## 4 — Gotchas

- **`camera.updateProjectionMatrix()` is mandatory.**  
  Changing `.fov`, `.near`, `.far`, `.aspect`, `.left`, `.right`, etc. does **nothing** until you call this. A very common bug.

- **Aspect ratio on resize.**  
  When the window resizes, `perspCam.aspect = newWidth / newHeight` then `updateProjectionMatrix()`. Forgetting this gives a squashed/stretched image.

- **`near` must be > 0.**  
  `near = 0` is mathematically invalid for perspective projection (division by zero in the matrix). three.js will produce `NaN` in the matrix and nothing renders.

- **OrbitControls and camera swap.**  
  OrbitControls keeps a reference to its `object` camera. When you swap cameras, update `controls.object = newCamera` before the next render, otherwise controls still manipulate the old camera.

- **CameraHelper lives in the scene.**  
  The helper renders the camera's frustum into the *scene*, so it shows up in any viewport that renders that scene — including the main view if you forget to hide it. Toggle `cameraHelper.visible` per viewport.

---

## 5 — Optional Advanced Topics

- **Logarithmic depth buffer** — pass `logarithmicDepthBuffer: true` to `WebGLRenderer`. Distributes depth precision far more evenly; fixes z-fighting without forcing a tight far/near ratio. Trade-off: can break some materials/extensions.

- **Multiple viewports** — `renderer.setViewport` + `renderer.setScissor` + `setScissorTest(true)` is how this playground draws two views. You can tile as many cameras as you like in a single canvas with this pattern (game split-screen, CAD quad-view, etc.).

- **Raycasting / picking from the camera** — `THREE.Raycaster` uses the camera's projection matrix to convert a 2-D mouse position into a 3-D ray through the scene. Any object the ray intersects is "picked". Core to interactive scenes.

- **Frustum culling** — three.js automatically skips rendering objects whose bounding sphere lies entirely outside the camera frustum. The camera's `projectionMatrix` drives this. Works correctly only after `updateProjectionMatrix()`.

---

## 6 — Next

→ [06 · Three.js Vanilla App](./06-threejs-vanilla.md) — we have all the pieces (renderer, scene, cameras, lights, geometry, materials). Now we assemble a complete, self-contained vanilla three.js application from scratch.
