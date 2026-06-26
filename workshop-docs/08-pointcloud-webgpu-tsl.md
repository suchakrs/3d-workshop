# 08 · Point clouds — WebGPU + TSL (take-home deep dive)

> **This is the take-home module.** In the live session we *demo* example 08
> and skim this doc. The detail below is for you to work through afterward — it
> is the bridge from "I can render a cube" to the lab's real job: rendering a
> million-point 3D scan at interactive frame rates.
>
> Live demo: open `examples/08-pointcloud-webgpu/` → 1,000,000 points, orbit
> around, tweak point size / colour mode / distance fade, watch the FPS counter.

---

## 1. Why point clouds

A 3D scanner (LiDAR, photogrammetry, structured light, depth camera) does not
give you a tidy mesh. It gives you a **point cloud**: a flat list of points, each
with a position and usually a colour and/or intensity.

```
point 0:  x y z   r g b   [intensity]
point 1:  x y z   r g b   [intensity]
...
point 999,999: ...
```

- No faces, no topology, no normals (unless you estimate them later).
- Counts are huge: a single room scan is millions of points; a building or
  outdoor LiDAR sweep is hundreds of millions to billions.
- Formats you'll meet: **`.ply`**, **`.pcd`**, **`.las`/`.laz`** (LiDAR),
  **`.e57`**, **`.xyz`**.

Our generator (`src/shared/generatePointCloud.ts`) synthesises a scan-like
terrain so the workshop ships no huge data file. It returns exactly the buffers
a real loader would: `positions: Float32Array` and `colors: Float32Array`, both
length `count * 3`, plus a bounding box. It is deterministic (seeded PRNG) so the
demo is reproducible.

## 2. The naive approach — and where it breaks

The textbook three.js way:

```ts
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
const material = new THREE.PointsMaterial({ size: 2, vertexColors: true, sizeAttenuation: true });
const points = new THREE.Points(geo, material);
scene.add(points);
```

This is exactly example 08's **WebGL fallback path**, and it works — up to a
point. Where it strains at ~1M+ on WebGL:

- **Fixed-function point sizing.** `PointsMaterial` gives you one `size` and a
  boolean `sizeAttenuation`. No per-point logic, no depth-aware falloff, no
  fade — anything fancier means patching the shader by hand
  (`onBeforeCompile`), which is fragile.
- **Overdraw + no real depth cue.** A million sprites stacked front-to-back
  blow the fill rate; without distance-based sizing/opacity the cloud reads as a
  flat smear.
- **CPU-side bottlenecks.** Any per-frame work touching the points (re-colour,
  re-filter, LOD on the CPU) is a million-iteration JS loop every frame.
- **WebGL is single-queue.** No compute shaders; culling/LOD/processing all
  fight the draw on one timeline.

The buffers upload fine. The ceiling is **how much per-point control you have
and where that work runs.**

## 3. WebGPU + TSL — the high-performance path

This is example 08's preferred path. Two pieces:

**`WebGPURenderer`** (`three/webgpu`) — talks to the browser's WebGPU API
(modern Chrome/Edge; Safari is arriving). Explicit GPU pipelines, compute-shader
support, better multi-pass scheduling. It initialises asynchronously:

```ts
const { WebGPURenderer, PointsNodeMaterial } = await import("three/webgpu");
const renderer = new WebGPURenderer({ canvas });
await renderer.init();           // <-- async, unlike WebGLRenderer
// ...
renderer.setAnimationLoop(tick); // tick calls renderer.renderAsync(scene, camera)
```

**TSL — Three Shading Language** (`three/tsl`) — you write shader logic as
*composable JavaScript node expressions* instead of raw WGSL/GLSL strings. Three
compiles the node graph to WGSL (WebGPU) or GLSL (WebGL) for you. You attach
nodes to a **node material**'s slots: `sizeNode`, `colorNode`, `opacityNode`,
`positionNode`.

### The TSL nodes in example 08

```ts
import { uniform, attribute, positionView, color, float, mix, clamp, vec3 } from "three/tsl";

// Live, GUI-updatable uniforms (change .value without recompiling):
const uSize  = uniform(params.pointSize);
const uAtten = uniform(params.sizeAttenuation ? 1 : 0);
const uFade  = uniform(params.distanceFade);

// View-space distance from camera to this point (evaluated per vertex):
const dist = positionView.xyz.length();
```

**Size — depth-aware attenuation (the key win over fixed-function):**

```ts
// Far points shrink: base size scaled by 1/distance. mix() toggles it live.
const attenuated = uSize.mul(float(120).div(dist.max(1.0)));
material.sizeNode  = mix(uSize, attenuated, uAtten);
```

**Colour — per-point, mode-switchable:**

```ts
const heightColor = attribute("color", "vec3");   // the generator's per-point colour
// "uniform" → a single colour; "grayscale" → luminance; "height" → the attribute.
material.colorNode = heightColor;                  // (rebuilt on mode change)
```

**Opacity — distance fade:**

```ts
// near → 1, far → (1 - fade); uFade in [0,1] blends the effect in.
const farFactor   = clamp(float(1).sub(dist.div(220.0)), 0.0, 1.0);
material.opacityNode = mix(float(1.0), farFactor, uFade);
material.transparent = true;
```

Because size/colour/opacity are evaluated **on the GPU per point**, a million
points cost you almost nothing on the CPU — you upload the buffers once and the
node graph does the rest each frame.

> **Updating without recompiling:** changing a `uniform`'s `.value` (point size,
> fade) is free. Changing the *graph* (swapping `colorNode` for a different mode)
> sets `material.needsUpdate = true` and recompiles — fine for an occasional GUI
> toggle, not something to do per frame.

## 4. Performance principles

1. **Upload once.** Build the `BufferGeometry` attributes a single time; never
   rebuild per frame. Re-colour/re-size via uniforms and node logic instead.
2. **Push per-point work to the GPU.** Anything you'd loop over a million times
   in JS belongs in a node (or a compute pass).
3. **Give a real depth cue.** Size attenuation + distance fade are not just
   pretty — they cut overdraw of distant points and make structure readable.
4. **Measure.** Example 08 shows live FPS. Step the count 100k → 500k → 1M and
   watch where your machine bends.
5. **Static beats dynamic.** Mark geometry that never changes so the engine
   doesn't re-validate it.

## 5. Loading a real scan

Swap the procedural generator for a loader; everything downstream is identical
(same `position` + `color` attributes feed the same node material):

```ts
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";

new PLYLoader().load("/scan.ply", (geometry) => {
  geometry.computeBoundingBox();
  const points = new THREE.Points(geometry, material); // same TSL material
  scene.add(points);
});
```

- **`.ply`** → `PLYLoader` (ships with three's addons). Good first target.
- **`.pcd`** → `PCDLoader` (addons).
- **`.las`/`.laz`** → LiDAR; needs a third-party loader (e.g. `loaders.gl`), and
  `.laz` is compressed (decode in a worker).
- **Big files:** decode/parse in a **Web Worker** so the main thread doesn't
  stall, then transfer the typed arrays.

## 6. Demo recap + browser support

- Example 08 detects WebGPU (`"gpu" in navigator`). Present → TSL path; absent →
  WebGL `THREE.Points` fallback with a banner.
- **Fallback feature parity:** the WebGL path supports point size, size
  attenuation, and all three colour modes (height / uniform / grayscale). The
  **distance fade** control is a TSL/WebGPU feature and is a no-op on the
  fallback — fading every point per frame on the CPU is exactly the work the GPU
  path avoids.
- **For the live demo:** pre-flight the room's browser. Use a recent
  **Chrome/Edge**. If WebGPU is unavailable you still get the WebGL fallback, but
  the TSL story is the point — have a backup machine/screenshot.

## Try this

1. **Toggle size attenuation at 1M points.** Watch the depth cue appear/vanish —
   the cloud goes from flat smear to readable terrain.
2. **Step the count 100k → 500k → 1M.** Note the FPS curve. Where does *your*
   GPU start to drop frames?
3. **Crank distance fade to 1.0.** The far terrain dissolves into the
   background — overdraw drops, foreground reads cleaner.
4. **Swap in a real `.ply`** (section 5) and reuse the same material.

## Optional advanced

- **LOD / chunking:** split the cloud into spatial tiles (octree); draw
  high-detail near the camera, sparse far away.
- **Frustum + occlusion culling** in a **compute pass** — skip points the camera
  can't see before they ever rasterise.
- **EDL (Eye-Dome Lighting):** a screen-space shading trick that makes
  unlit point clouds read as 3D (used by Potree).
- **Gaussian splatting:** the modern successor — each "point" is an oriented
  3D Gaussian; photorealistic novel-view rendering from scans.

## Back to the start

This closes the arc: the empty canvas from topic 01 → transforms → geometry →
material → light → camera → a full scene → React → and now a million-point scan
rendered on the GPU. Same fundamentals, scaled up.

← [07 · React Three Fiber](./07-react-three-fiber.md) ·
[00 · Overview](./00-overview.md)
