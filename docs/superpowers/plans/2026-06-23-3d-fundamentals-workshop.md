# Fundamentals of 3D Development Workshop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a half-day interactive 3D-development workshop — a Vite/TypeScript multi-page project of 8 explorable example pages plus a `workshop-docs/` doc set — ending in a 1M-point WebGPU+TSL point cloud demo.

**Architecture:** One Vite MPA project (single `npm install`, single dev server). Each example is an independent standalone page under `examples/NN-*/` — vanilla three.js + lil-gui for fundamentals, React Three Fiber + leva for the R3F page, and `three/webgpu` + `three/tsl` for the point cloud. The only shared code module is a procedural point-cloud generator. A root `index.html` is a static landing menu. Markdown docs walk the examples in order as one evolving scene.

**Tech Stack:** TypeScript, Vite (MPA via `rollupOptions.input`), three.js, `@react-three/fiber`, `@react-three/drei`, `leva`, `lil-gui`, React.

## Global Constraints

- **Language:** TypeScript everywhere. `strict: true` in tsconfig.
- **Build:** Vite multi-page. One `npm install`, one `npm run dev`. Each `examples/NN-*/index.html` is a Rollup input plus root `index.html`.
- **Self-contained examples:** every vanilla example file includes full renderer/scene/camera/loop/resize boilerplate inline. Do NOT factor a shared scene helper. The ONLY shared module is `src/shared/generatePointCloud.ts`, imported only by example 08.
- **GUI:** vanilla examples use `lil-gui`; the R3F example uses `leva`.
- **Point cloud:** vanilla TS, `three/webgpu` (`WebGPURenderer`) + `three/tsl`. ~1,000,000 points generated procedurally. No scan data files shipped.
- **three.js version:** pin a version exposing stable `three/webgpu` and `three/tsl` subpath exports; verify at install (Task 1). Record the resolved version in `00-overview.md`.
- **Verification model:** these are visual WebGL/WebGPU programs, not unit-testable UI. Per-task verification = (a) `npm run typecheck` passes, (b) `npm run build` passes, (c) the page loads in the dev server with **zero console errors** and the described controls work. The one genuinely unit-tested unit is `generatePointCloud` (Task 2) — it gets real assertions.
- **No git commits** unless the user explicitly asks (user standing rule). Steps below omit commit steps for this reason; group deliverables are still independently verifiable.
- **Doc shape (every topic doc):** Concept (analogy + diagram) → The playground (each control + what to observe) → Try this (2–4 prompts) → Gotchas → Optional advanced → Next (link, tie to scene spine).

---

### Task 1: Project scaffold + landing page

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html` (root landing menu)
- Create: `src/styles/base.css` (shared minimal page chrome: full-bleed canvas, GUI on top, title overlay)
- Create: `.gitignore` (`node_modules`, `dist`)

**Interfaces:**
- Produces: a working dev server. Each later task adds an `examples/NN-*/index.html` and registers it in `vite.config.ts` `rollupOptions.input`.
- Produces: `src/styles/base.css` with classes `.stage` (canvas container, `position:fixed; inset:0`) and `.overlay` (top-left title/instructions box). All example pages link this.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "3d-workshop",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "three": "^0.171.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@react-three/fiber": "^8.17.10",
    "@react-three/drei": "^9.114.0",
    "leva": "^0.9.35",
    "lil-gui": "^0.20.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "typescript": "^5.6.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@types/three": "^0.171.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@webgpu/types": "^0.1.40",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Install and verify three exposes webgpu/tsl subpaths**

Run: `npm install`
Then verify the subpath exports exist:
Run: `node -e "import('three/webgpu').then(m=>console.log('webgpu ok', !!m.WebGPURenderer)); import('three/tsl').then(m=>console.log('tsl ok', !!m.uniform))"`
Expected: `webgpu ok true` and `tsl ok true`. If either is false, bump `three` to the latest `0.x` and re-run. Record the resolved `three` version (from `npm ls three`) for `00-overview.md`.

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["@webgpu/types", "vite/client"],
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["examples", "src"]
}
```

- [ ] **Step 4: Write `vite.config.ts` (MPA; entries added per task)**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        // Each example registers its index.html here as tasks land:
        // "01": resolve(__dirname, "examples/01-space-transforms/index.html"),
      },
    },
  },
});
```

- [ ] **Step 5: Write `src/styles/base.css`**

```css
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: #0b0e14; color: #e6e6e6;
  font: 14px/1.5 system-ui, sans-serif; }
.stage { position: fixed; inset: 0; }
canvas { display: block; }
.overlay { position: fixed; top: 12px; left: 12px; max-width: 320px;
  padding: 12px 14px; background: rgba(0,0,0,.55); border-radius: 8px;
  pointer-events: none; }
.overlay h1 { margin: 0 0 6px; font-size: 15px; }
.overlay p { margin: 4px 0; opacity: .85; }
.overlay a { color: #7db4ff; pointer-events: auto; }
.menu { max-width: 640px; margin: 48px auto; padding: 0 16px; }
.menu li { margin: 6px 0; }
```

- [ ] **Step 6: Write root `index.html` landing menu**

Link to all 8 example pages (relative paths to each `examples/NN-*/index.html`) and to `workshop-docs/00-overview.md`. Use `.menu` styling. List the topic titles from the spec table.

- [ ] **Step 7: Verify scaffold**

Run: `npm run typecheck` → Expected: passes (no files to error yet).
Run: `npm run build` → Expected: builds `main` entry.
Run: `npm run dev`, open root → Expected: landing menu renders, links present (example links 404 until their tasks land — acceptable now).

---

### Task 2: Shared point-cloud generator (unit-tested)

**Files:**
- Create: `src/shared/generatePointCloud.ts`
- Test: `src/shared/generatePointCloud.test.ts`

**Interfaces:**
- Produces: `generatePointCloud(count: number, opts?: { seed?: number }): { positions: Float32Array; colors: Float32Array; bounds: { min: [number,number,number]; max: [number,number,number] } }` — `positions` length `count*3`, `colors` length `count*3` (RGB 0..1), colored by normalized height (Y). Deterministic given `seed` (use a seeded PRNG, NOT `Math.random` — the runtime forbids it in workflow scripts and determinism makes it testable). Consumed only by Task 10 (example 08).

- [ ] **Step 1: Write the failing test**

```ts
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
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `generatePointCloud` not found.

- [ ] **Step 3: Implement `generatePointCloud.ts`**

Implement: a small seeded PRNG (mulberry32). Generate scan-like points by sampling a terrain surface: for each point pick `x,z` in `[-50,50]` via PRNG, compute `y = layered sine/noise height`, jitter to mimic scan noise. Fill `positions`. Compute color by normalizing `y` between observed min/max into a blue→green→white ramp. Track and return `bounds`. No `Math.random`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck` → Expected: passes.

---

### Task 3: Example 01 — 3D space & transforms (+ exercise E1) + doc

**Files:**
- Create: `examples/01-space-transforms/index.html`
- Create: `examples/01-space-transforms/main.ts`
- Create: `examples/01-space-transforms/main.solution.ts` (E1 complete)
- Create: `workshop-docs/01-3d-space-and-transforms.md`
- Modify: `vite.config.ts` (add `"01"` input)

**Interfaces:**
- Consumes: `src/styles/base.css`, `.stage`/`.overlay` classes (Task 1).
- Produces: the "hero object" motif (a single box mesh + axes + grid) reused conceptually by later docs.

- [ ] **Step 1: Write `index.html`**

A `<div class="stage"><canvas id="c"></canvas></div>`, an `.overlay` with title + one-line instruction, link `../../src/styles/base.css`, and `<script type="module" src="./main.ts"></script>`.

- [ ] **Step 2: Write `main.ts`**

Vanilla three.js, self-contained: `WebGLRenderer` on `#c`, `PerspectiveCamera`, `Scene`, `AxesHelper`, `GridHelper`, a `BoxGeometry` `Mesh` with `MeshNormalMaterial`, `OrbitControls`, resize handler, render loop. Add a `lil-gui` panel with folders: **Position** (x/y/z), **Rotation** (x/y/z in degrees → radians), **Scale** (x/y/z), and a **Rotation mode** dropdown (Euler ↔ Quaternion, demonstrating order effects). Add a **parent group** toggle that nests the mesh under a `Group` and rotates the group, so child inherits parent transform. Leave the orbit-the-parent per-frame rotation as a clearly-marked `// TODO (E1)` gap.

- [ ] **Step 3: Write `main.solution.ts`**

Identical to `main.ts` but with the E1 TODO filled: the child mesh offset from group origin and `group.rotation.y += dt * speed` in the loop so the child orbits the parent.

- [ ] **Step 4: Register entry in `vite.config.ts`**

Add `"01": resolve(__dirname, "examples/01-space-transforms/index.html"),` to `rollupOptions.input`.

- [ ] **Step 5: Write `workshop-docs/01-3d-space-and-transforms.md`**

Follow the global doc shape. Concept: right-handed coordinate system, the transform trio (T·R·S), local vs world space, parent-child matrices, Euler gimbal vs quaternion. Playground: document every GUI control. Try this: "rotate X then Y vs Y then X — why different?", "enable parent group, watch child orbit". Gotchas: degrees vs radians, transform order, gimbal lock. Optional advanced: matrix composition, `object.matrixWorld`. Next → topology.

- [ ] **Step 6: Verify**

Run: `npm run typecheck` && `npm run build` → Expected: pass, `01` in build output.
Dev server: open `examples/01-space-transforms/` → Expected: box + axes + grid, GUI tweaks move/rotate/scale live, parent toggle works, **zero console errors**.

---

### Task 4: Example 02 — Modeling & topology (+ exercise E2) + doc

**Files:**
- Create: `examples/02-topology/index.html`
- Create: `examples/02-topology/main.ts`
- Create: `examples/02-topology/pyramid.ts` (E2 with TODO gaps)
- Create: `examples/02-topology/pyramid.solution.ts` (E2 complete)
- Create: `workshop-docs/02-modeling-and-topology.md`
- Modify: `vite.config.ts` (add `"02"`)

**Interfaces:**
- Consumes: Task 1 styles.
- Produces: `buildPyramid(): THREE.BufferGeometry` in `pyramid.solution.ts` (and the gapped `pyramid.ts`), used by `main.ts` when "custom geometry" is selected.

- [ ] **Step 1: Write `index.html`** (same pattern as Task 3).

- [ ] **Step 2: Write `main.ts`**

Self-contained vanilla scene. `lil-gui`: **Geometry** dropdown (Box / Sphere / Torus / Custom pyramid), **segments** slider (rebuilds geometry), **wireframe** toggle, **flat vs smooth normals** toggle (`geometry.computeVertexNormals()` vs flat), **show normals** toggle (`VertexNormalsHelper`), **indexed vs non-indexed** toggle (`geometry.toNonIndexed()`), and a vertex/edge/face count readout. Selecting "Custom pyramid" calls `buildPyramid()`.

- [ ] **Step 3: Write `pyramid.ts` (E2, gapped)**

```ts
import * as THREE from "three";

// EXERCISE E2: build a square-based pyramid from raw vertex data.
export function buildPyramid(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  // TODO(E2): define 5 vertices — 4 base corners + 1 apex.
  const positions = new Float32Array([
    // x, y, z  (fill these in)
  ]);
  // TODO(E2): define face indices (triangles): 4 sides + 2 base triangles.
  const indices: number[] = [];
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  // TODO(E2): compute normals so lighting works.
  return geometry;
}
```

- [ ] **Step 4: Write `pyramid.solution.ts`**

Complete: 5 vertices (base corners at ±1 in X/Z, y=0; apex at 0,1.5,0), 6 triangles with correct CCW winding (4 sides + 2 base), `geometry.computeVertexNormals()`.

- [ ] **Step 5: Register `"02"` in `vite.config.ts`.**

- [ ] **Step 6: Write `workshop-docs/02-modeling-and-topology.md`**

Concept: vertices/edges/faces, triangles as the GPU primitive, `BufferGeometry` + attributes, indexed vs non-indexed (vertex sharing), winding order & normals, flat vs smooth shading. Reference E2. Playground + Try this ("toggle indexed — watch vertex count change", "build the pyramid") + Gotchas (winding/back-face culling, missing normals = black) + Optional advanced (interleaved buffers, `BufferGeometryUtils.mergeVertices`) + Next → materials.

- [ ] **Step 7: Verify** (typecheck, build, load, zero console errors; pyramid renders when solution logic is in place).

---

### Task 5: Example 03 — Materials + doc

**Files:**
- Create: `examples/03-materials/index.html`, `examples/03-materials/main.ts`
- Create: `workshop-docs/03-materials.md`
- Modify: `vite.config.ts` (add `"03"`)

**Interfaces:** Consumes Task 1 styles. Self-contained.

- [ ] **Step 1: `index.html`** (standard pattern).

- [ ] **Step 2: `main.ts`**

Self-contained scene with the hero object (a high-segment sphere or the torus knot) plus one directional + ambient light (so non-Basic materials are visible) and an environment map for reflections. `lil-gui`: **Material type** dropdown (MeshBasic / MeshLambert / MeshStandard / MeshPhysical), **color**, **metalness**, **roughness**, **emissive** + intensity, **opacity** + transparent toggle, **wireframe**, and a **texture maps** group toggling a procedurally-generated `CanvasTexture` checker as `map` / `roughnessMap`. Rebuild material on type change; only expose properties valid for the chosen type.

- [ ] **Step 3: Register `"03"`.**

- [ ] **Step 4: `workshop-docs/03-materials.md`**

Concept: what a material is (shader + params), the material ladder (unlit Basic → Lambert → PBR Standard/Physical), PBR metalness/roughness intuition, texture map types (albedo/normal/roughness/metalness/emissive/ao), transparency & render order. Playground + Try this ("metalness 1 + roughness 0 → mirror; roughness 1 → diffuse") + Gotchas (Basic ignores lights; transparency sorting) + Optional advanced (`onBeforeCompile`, custom shaders, preview of TSL node materials in topic 08) + Next → lighting.

- [ ] **Step 5: Verify** (typecheck/build/load/zero errors; material swaps update live).

---

### Task 6: Example 04 — Lighting + doc

**Files:**
- Create: `examples/04-lighting/index.html`, `examples/04-lighting/main.ts`
- Create: `workshop-docs/04-lighting.md`
- Modify: `vite.config.ts` (add `"04"`)

**Interfaces:** Consumes Task 1 styles. Self-contained.

- [ ] **Step 1: `index.html`** (standard pattern).

- [ ] **Step 2: `main.ts`**

Self-contained scene: hero object on a ground plane (to show shadows), `MeshStandardMaterial`, `renderer.shadowMap.enabled = true`. `lil-gui` folders per light type — **Ambient** (on/off, intensity, color), **Hemisphere** (sky/ground colors, intensity), **Directional** (on/off, intensity, position, castShadow), **Point** (on/off, intensity, position, distance/decay), **Spot** (on/off, intensity, angle, penumbra, position) — each with a matching light helper toggle. Global **shadows** toggle and an **environment/IBL** toggle (`RoomEnvironment` or generated env).

- [ ] **Step 3: Register `"04"`.**

- [ ] **Step 4: `workshop-docs/04-lighting.md`**

Concept: light types and their physical analogues, direct vs ambient/IBL, intensity & color, shadow maps (and their cost/bias artifacts). Playground + Try this ("disable all but one directional light; move it; watch shadow", "add IBL — note ambient realism") + Gotchas (Basic/Normal materials ignore lights; shadow acne/bias; perf of many shadow-casters) + Optional advanced (light probes, area lights, baked lighting) + Next → cameras.

- [ ] **Step 5: Verify** (typecheck/build/load/zero errors; lights + shadows respond live).

---

### Task 7: Example 05 — Cameras + doc

**Files:**
- Create: `examples/05-cameras/index.html`, `examples/05-cameras/main.ts`
- Create: `workshop-docs/05-cameras.md`
- Modify: `vite.config.ts` (add `"05"`)

**Interfaces:** Consumes Task 1 styles. Self-contained.

- [ ] **Step 1: `index.html`** (standard pattern).

- [ ] **Step 2: `main.ts`**

Self-contained scene with several objects at varying depths (to show projection). Two cameras: a `PerspectiveCamera` and an `OrthographicCamera`. Render the active camera; render a **second viewport** (small inset, `renderer.setViewport`/`setScissor`) from a fixed overview camera showing the active camera's `CameraHelper` frustum. `lil-gui`: **Projection** dropdown (perspective/ortho), **FOV** (perspective), **ortho zoom**, **near**, **far** (with live frustum-helper update), and OrbitControls on the main camera.

- [ ] **Step 3: Register `"05"`.**

- [ ] **Step 4: `workshop-docs/05-cameras.md`**

Concept: the view + projection transforms, perspective vs orthographic, FOV/aspect/near/far, the view frustum, near/far precision (z-fighting). Playground + Try this ("FOV 10 vs 120 — dolly-zoom feel", "switch to ortho — parallel lines stay parallel", "near 0.001 far 100000 → z-fighting") + Gotchas (aspect on resize; near too small) + Optional advanced (logarithmic depth buffer, multiple viewports, picking/raycasting) + Next → assembling it all in vanilla three.js.

- [ ] **Step 5: Verify** (typecheck/build/load/zero errors; projection + frustum inset update live).

---

### Task 8: Example 06 — three.js vanilla (full assembled scene) + doc

**Files:**
- Create: `examples/06-threejs-vanilla/index.html`, `examples/06-threejs-vanilla/main.ts`
- Create: `workshop-docs/06-threejs-vanilla.md`
- Modify: `vite.config.ts` (add `"06"`)

**Interfaces:** Consumes Task 1 styles. Self-contained. This is the reference vanilla scene the R3F task (Task 9) mirrors — keep the object set and lighting identical so the two pages compare 1:1.

- [ ] **Step 1: `index.html`** (standard pattern).

- [ ] **Step 2: `main.ts`**

The "putting it together" file, heavily commented as the canonical vanilla pipeline: renderer setup (antialias, pixel ratio, color space, shadow map), scene + fog, perspective camera, OrbitControls, a lighting rig (ambient + directional with shadow), a ground plane, the hero object (a `TorusKnotGeometry` with `MeshStandardMaterial`) plus a couple of supporting meshes, an `AxesHelper`/`GridHelper` toggle via lil-gui, a clock-driven animation (`mesh.rotation.y += dt`), resize handler, and the render loop. Minimal lil-gui: animation speed, helpers toggle, wireframe.

- [ ] **Step 3: Register `"06"`.**

- [ ] **Step 4: `workshop-docs/06-threejs-vanilla.md`**

Concept: the anatomy of a three.js app (renderer/scene/camera/loop), the scene graph, the render loop & `requestAnimationFrame`, handling resize, the lifecycle (create → animate → dispose). Walk the file section by section. Try this ("change the hero geometry", "add a second light"). Gotchas (memory: dispose geometries/materials/textures; pixel ratio; color management). Optional advanced (render targets, post-processing pipeline, instancing). Next → the same scene in React Three Fiber.

- [ ] **Step 5: Verify** (typecheck/build/load/zero errors; scene animates, controls work).

---

### Task 9: Example 07 — React Three Fiber (+ exercise E3) + doc

**Files:**
- Create: `examples/07-react-three-fiber/index.html`
- Create: `examples/07-react-three-fiber/main.tsx`
- Create: `examples/07-react-three-fiber/App.tsx` (E3 with a TODO gap)
- Create: `examples/07-react-three-fiber/App.solution.tsx` (E3 complete)
- Create: `workshop-docs/07-react-three-fiber.md`
- Modify: `vite.config.ts` (add `"07"`)

**Interfaces:** Consumes Task 1 styles. Mirrors Task 8's scene declaratively (same objects/lighting) so docs can show vanilla vs R3F side by side.

- [ ] **Step 1: `index.html`**

Standard pattern but mount React: `<div id="root"></div>` and `<script type="module" src="./main.tsx"></script>`.

- [ ] **Step 2: `main.tsx`**

`createRoot(document.getElementById("root")!).render(<App />)`.

- [ ] **Step 3: `App.tsx` (E3, gapped)**

`<Canvas shadows camera={{ position: [...] }}>` containing `<OrbitControls/>` (drei), lights, ground, and a `<HeroKnot/>` component. `HeroKnot` uses `useRef` + `useFrame` to rotate. `leva` `useControls` for animation speed / wireframe. **E3 gap:** leave one supporting mesh as a `// TODO(E3): convert this vanilla snippet to JSX` comment block containing the vanilla code to translate.

- [ ] **Step 4: `App.solution.tsx`**

Same with the E3 TODO converted to the equivalent `<mesh>`/`<meshStandardMaterial>` JSX.

- [ ] **Step 5: Register `"07"`.**

- [ ] **Step 6: `workshop-docs/07-react-three-fiber.md`**

Concept: R3F = a React renderer for three.js; JSX maps to the scene graph (`<mesh>` = `new THREE.Mesh`); `attach`, args, the reconciler; `useFrame`/`useThree`/`useLoader`; drei helpers; leva controls. Side-by-side: the Task 8 vanilla loop vs the R3F declarative tree. Reference E3. Try this ("add a `<mesh>` and watch it appear", "do the E3 conversion"). Gotchas (don't recreate objects each render; `useMemo` geometries; refs for imperative escapes). Optional advanced (`extend` for custom/WebGPU, instancing via `<Instances>`, when NOT to use R3F). Next → point clouds at scale.

- [ ] **Step 7: Verify** (typecheck/build/load/zero errors; R3F scene matches the vanilla one, leva controls work).

---

### Task 10: Example 08 — Point cloud (WebGPU + TSL, ~1M points) + take-home doc

**Files:**
- Create: `examples/08-pointcloud-webgpu/index.html`
- Create: `examples/08-pointcloud-webgpu/main.ts`
- Create: `workshop-docs/08-pointcloud-webgpu-tsl.md` (the long take-home deep dive)
- Modify: `vite.config.ts` (add `"08"`)

**Interfaces:**
- Consumes: `generatePointCloud` (Task 2), Task 1 styles.
- Produces: a WebGPU point-cloud demo with a WebGL `THREE.Points` fallback path.

- [ ] **Step 1: `index.html`** (standard pattern; add an FPS readout element in the overlay).

- [ ] **Step 2: `main.ts`**

Detect WebGPU (`navigator.gpu`). If present: `WebGPURenderer` from `three/webgpu`; build a `BufferGeometry` from `generatePointCloud(1_000_000)` (`position` + `color` attributes); use a node material from `three/webgpu` (`PointsNodeMaterial` or sprite-based points) with TSL (`three/tsl`) driving per-point **size attenuation** (size / view-space distance), **color mode** (height ramp from the color attribute vs uniform), and **distance fade** (opacity falloff). If WebGPU absent: fall back to `THREE.Points` + `PointsMaterial` (WebGL) and show a banner in the overlay. `OrbitControls`, resize, render loop, and a per-second FPS counter writing to the overlay. `lil-gui`: point size, size-attenuation on/off, color mode (height/intensity/uniform), distance-fade amount, and a point-count selector (100k / 500k / 1M) that rebuilds the geometry.

- [ ] **Step 3: Register `"08"`.**

- [ ] **Step 4: `workshop-docs/08-pointcloud-webgpu-tsl.md`** (longest doc; follow the spec's 6-part outline)

(1) Why point clouds — 3D scan output, XYZ + color/intensity, scale (millions). (2) Naive `THREE.Points` + `PointsMaterial` WebGL approach — and where it breaks at 1M (CPU bottlenecks, no depth-aware sizing, overdraw). (3) WebGPU + TSL — `WebGPURenderer`, node materials, TSL nodes for size attenuation / color-from-height / distance fade, storage/instanced buffers; annotated excerpts from `main.ts`. (4) Performance — upload attributes once, no per-frame CPU work, GPU-driven sizing, optional compute pass. (5) Loading real data — swap the generator for `PLYLoader`/LAS; formats (`.ply`/`.las`/`.laz`/`.pcd`). (6) Demo recap + browser-support caveat + the WebGL fallback. Try this ("toggle size attenuation at 1M — watch the depth cue", "step 100k→1M, watch FPS"). Optional advanced (LOD/chunking, octree culling, EDL shading, splatting/Gaussian preview). This doc is explicitly the take-home; link it from `00-overview.md`.

- [ ] **Step 5: Verify**

Run: `npm run typecheck` && `npm run build` → Expected: pass, `08` in build output.
Dev server (WebGPU-capable browser): open `examples/08-pointcloud-webgpu/` → Expected: ~1M points render, orbit is smooth, GUI controls respond, FPS shows, **zero console errors**. In a non-WebGPU browser: fallback banner + WebGL points render.

---

### Task 11: Supporting docs (overview, presenter guide, exercises)

**Files:**
- Create: `workshop-docs/00-overview.md`
- Create: `workshop-docs/presenter-guide.md`
- Create: `workshop-docs/exercises.md`

**Interfaces:** Consumes all prior tasks (links to every example + doc; references resolved `three` version from Task 1, E1/E2/E3 from Tasks 3/4/9).

- [ ] **Step 1: `00-overview.md`**

Workshop goals + success criteria (from spec), audience note, prerequisites, **setup/run instructions** (`npm install`, `npm run dev`, open root menu; record the resolved `three` version; WebGPU browser note), the **3D pipeline mental model** (model → world → view → clip → screen), the topic list with doc links, and the "one scene, revealed" narrative framing. Link the point-cloud doc as the take-home.

- [ ] **Step 2: `presenter-guide.md`**

The timing table (from spec: 15/30/30/25/25/break/20/30/30/25/10). Per topic: 2–3 talking points, the live-demo cue ("open example NN, do X"), and 1–2 common questions + answers. A WebGPU pre-flight check (test example 08 in the room's browser beforehand) and the fallback plan. Tips for the mixed audience (when to invoke the "optional advanced" notes).

- [ ] **Step 3: `exercises.md`**

Describe E1 (orbit child around parent — file `examples/01-space-transforms/main.ts`, solution `main.solution.ts`), E2 (build the pyramid — `pyramid.ts` → `pyramid.solution.ts`), E3 (convert vanilla snippet to R3F — `App.tsx` → `App.solution.tsx`). For each: goal, the exact TODO location, a hint, and how to check success. Point to solution files rather than duplicating full solutions.

- [ ] **Step 4: Verify**

Run: `npm run build` → Expected: passes.
Manually open each doc; confirm every example/doc link resolves and the run instructions match the actual scripts.

---

## Self-Review

**Spec coverage:**
- Audience / success criteria → `00-overview.md` (Task 11). ✓
- Half-day, even fundamentals, point-cloud demo + take-home → Tasks 3–10 + timing in presenter guide (Task 11). ✓
- Explorable GUI playgrounds → lil-gui in Tasks 3–8/10, leva in Task 9. ✓
- 3 fill-in exercises → E1 (Task 3), E2 (Task 4), E3 (Task 9), aggregated in Task 11. ✓
- TypeScript + Vite MPA, single install/server → Task 1. ✓
- lil-gui (vanilla) / leva (R3F) split → Tasks 3–10 / Task 9. ✓
- Point cloud vanilla `three/webgpu` + `three/tsl`, ~1M procedural, fallback, swap-in-real-data docs → Tasks 2 + 10. ✓
- Narrative spine "one scene, revealed" → reused hero object Tasks 3/5/6/8/9; framed in `00-overview.md`. ✓
- All 8 topic docs + overview + presenter + exercises → Tasks 3–11. ✓
- Out-of-scope items (no R3F WebGPU build, no shipped scan files, no routed SPA) → respected. ✓

**Placeholder scan:** Intentional `TODO(E1/E2/E3)` markers exist only inside exercise files by design (paired with `.solution` siblings). No plan-level placeholders.

**Type consistency:** `generatePointCloud(count, opts)` signature is defined in Task 2 and consumed identically in Task 10. `buildPyramid()` defined and consumed in Task 4. Example entry keys `"01".."08"` are unique in `vite.config.ts`.

**Verification model note:** Visual examples are verified by typecheck + build + zero-console-error load (stated in Global Constraints), not fake unit tests; only `generatePointCloud` has real assertions. This is a deliberate adaptation of TDD for visual WebGL/WebGPU code.
```
