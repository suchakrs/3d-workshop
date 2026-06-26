# 06 · three.js (vanilla) — assembling the full scene

> Topics 01–05 each isolated one idea. Now we wire them into a complete,
> self-contained three.js application — the canonical structure you'll
> reproduce in every project. Next topic rebuilds this *exact* scene in React
> Three Fiber, so study it well.

## Concept — the anatomy of a three.js app

Every three.js app is the same four moving parts plus a loop:

```
                ┌───────────────────────────────────────┐
                │                SCENE                    │
                │   (Object3D tree — the "scene graph")   │
                │                                         │
   ┌────────┐   │   ├─ AmbientLight                       │
   │ CAMERA │──▶│   ├─ DirectionalLight ── shadow         │
   └────────┘   │   ├─ Ground (Mesh)                      │
       │        │   ├─ Hero  (Mesh: geometry + material)  │
       │        │   ├─ Box   (Mesh)                        │
       ▼        │   └─ Sphere(Mesh)                        │
  ┌──────────┐  └───────────────────────────────────────┘
  │ RENDERER │  ── render(scene, camera) ──▶  <canvas> pixels
  └──────────┘
       ▲
       └──── requestAnimationFrame loop (≈60×/sec) ────┐
              update transforms → controls → render ───┘
```

1. **Renderer** — `WebGLRenderer`. Rasterises the scene to the canvas. Owns the
   WebGL context, pixel ratio, and the shadow-map pass.
2. **Scene** — the root `Object3D`. Everything you `.add()` becomes a node in a
   tree. A child's world transform = `parent.matrixWorld × child.matrix` (this
   is the parent-child idea from topic 01, now at app scale).
3. **Camera** — supplies the view + projection transforms (topic 05).
4. **The render loop** — `requestAnimationFrame(animate)` runs ~60×/sec.
   Each frame: advance animation by **delta time**, update controls, then
   `renderer.render(scene, camera)`.

### Walking `main.ts` section by section

The file is numbered 1–11 in comments. The shape to memorise:

| § | What | Why it matters |
|---|------|----------------|
| 1 | Renderer | `setPixelRatio(min(dpr, 2))` caps retina overdraw; `shadowMap.enabled` turns on the shadow pass |
| 2 | Scene + fog | the graph root; `Fog(color, near, far)` fades distance into the background |
| 3 | Camera | `PerspectiveCamera(50, aspect, 0.1, 100)` — fov / aspect / near / far |
| 4 | Controls | `OrbitControls` with `enableDamping` (needs `controls.update()` each frame) |
| 5 | Lights | ambient fill + a directional "sun" that casts shadows |
| 6 | Ground | a plane rotated flat with `receiveShadow` |
| 7 | Meshes | hero TorusKnot + box + sphere — each `geometry + material`, `castShadow` |
| 8 | Helpers | axes + grid, toggleable |
| 9 | GUI | lil-gui binds `params` to controls |
| 10 | Resize | update `camera.aspect` + `updateProjectionMatrix()` + `renderer.setSize()` |
| 11 | Loop | `Clock.getDelta()` → frame-rate-independent motion → render |

**Delta time is the one habit to internalise:** multiply every motion by
`clock.getDelta()`. Without it, your scene spins twice as fast on a 144 Hz
monitor as on a 60 Hz one.

## The playground

The lil-gui panel (top-right) drives the same `params` object the loop reads:

- **animation speed** — multiplier on the hero's per-frame Y rotation. Drag to 0
  to freeze it.
- **show helpers** — toggles the axes + grid together.
- **hero wireframe** — flips `heroMat.wireframe`; see the TorusKnot's topology
  (callback to topic 02).

Orbit/zoom/pan with the mouse (OrbitControls).

## Try this

1. **Swap the hero geometry.** Change `new THREE.TorusKnotGeometry(...)` to
   `new THREE.IcosahedronGeometry(1, 0)`. One line — the rest of the app is
   geometry-agnostic. That separation (geometry vs material vs scene) is the
   point.
2. **Add a second light.** Add a `THREE.PointLight(0xffaa00, 20, 20)` at
   `(-3, 2, 3)` and `scene.add()` it. Watch the warm fill appear on the shaded
   sides.
3. **Break delta time.** Replace `delta * params.speed` with a constant like
   `0.02`. It still works — until you open it on a high-refresh display.

## Gotchas

- **Memory leaks.** Geometries, materials, textures, controls, and the renderer
  all hold GPU/DOM resources. On teardown (SPA route change, HMR) call
  `.dispose()` on each — see the commented `dispose()` block at the bottom of
  `main.ts`. The garbage collector does **not** free GPU memory for you.
- **Retina overdraw.** `devicePixelRatio` can be 3 on phones — rendering 3× the
  pixels in each axis is ~9× the work. Cap it at 2.
- **Forgetting `controls.update()`** with damping on → the camera feels frozen
  or laggy.
- **Color management.** Since r152 the renderer outputs sRGB by default and
  treats your hex colors as sRGB. If you load a *color* texture, set
  `texture.colorSpace = THREE.SRGBColorSpace`; leave data maps (roughness,
  normal) linear (topic 03 gotcha).

## Optional advanced

- **Render targets** — render the scene into a texture instead of the screen
  (mirrors, minimaps, the inset camera trick from topic 05).
- **Post-processing** — `EffectComposer` + passes (bloom, SSAO, outline) run
  after the main render.
- **Instancing** — `InstancedMesh` draws thousands of copies of one geometry in
  a single draw call. (This is the conceptual bridge to topic 08: rendering a
  *million* of something needs GPU-side tricks, not a million `Mesh` objects.)

## Next

→ [07 · React Three Fiber](./07-react-three-fiber.md) — the **exact same scene**,
expressed declaratively in React. Same renderer underneath, very different
authoring model.
