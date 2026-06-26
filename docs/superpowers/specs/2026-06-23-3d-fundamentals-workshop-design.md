# Fundamentals of 3D Development — Workshop Design

**Date:** 2026-06-23
**Author:** Workshop facilitator (lab internship program)
**Status:** Approved design — ready for implementation plan

## Purpose

A half-day (~4 hour) interactive workshop teaching the fundamentals of 3D
development to lab interns, culminating in a preview of high-performance point
cloud rendering (the lab's real work: rendering ~1M points from 3D scans using
WebGPU + TSL).

## Audience

Mixed skill level. Design target = **JS-comfortable but new to 3D**. Strong
interns are served by clearly-marked "optional advanced" notes in each topic
rather than separate tracks. No assumed background in linear algebra, graphics,
or React.

## Success criteria

By the end, an intern can:

1. Explain the 3D coordinate space, transforms (position/rotation/scale,
   parent-child), and the render pipeline mental model.
2. Read and modify a vanilla three.js scene (renderer, scene graph, render loop,
   resize, controls).
3. Recognize the same scene expressed in React Three Fiber and explain the
   declarative vs imperative trade-off.
4. Describe why naive point rendering struggles at 1M points and how WebGPU +
   TSL addresses it (conceptually; full build is take-home).

## Constraints / decisions (locked during brainstorming)

- **Format:** half-day live session, ~4 hours, even coverage of fundamentals.
- **Depth split:** fundamentals get even live time; point cloud is a *working
  demo* live, with TSL/WebGPU internals documented as a take-home deep dive.
- **Interactivity:** explorable GUI playgrounds (live param tweaking) + live
  demo, plus 3 focused fill-in exercises.
- **Language:** TypeScript.
- **Build:** Vite, **multi-page (MPA)** — one `npm install`, one dev server, but
  each example is an independent standalone page (the sane implementation of
  "separate mini-examples": readable in isolation, no N installs / N servers).
- **GUI:** vanilla examples use **lil-gui** (authentic three.js); R3F example
  uses **leva**.
- **Point cloud:** vanilla TS using `three/webgpu` + `three/tsl` (avoids R3F +
  WebGPU canvas-config complexity). ~1M points generated **procedurally**
  (scan-like: sampled surface + noise + height-based color) so no large data
  file ships; doc shows how to swap in a real `.ply` / `.las`.

## Narrative spine — "one scene, revealed"

Although example files are independent, the docs walk them **in order as one
evolving scene**, reusing the same hero object so interns see cumulative
cause-and-effect:

empty canvas → add object (transform) → reshape geometry (topology) → material →
lighting → camera framing → full assembled vanilla scene → rebuilt in R3F → hero
object swapped for a 1M-point scan.

The spine lives in the docs and a consistent scene motif, **not** a router.

## Topics and playgrounds

| # | Topic | Playground (GUI controls → what to observe) |
|---|-------|---------------------------------------------|
| 01 | 3D space & transforms | position/rotation/scale sliders; parent-group toggle; axes + grid helpers; quaternion-vs-Euler toggle |
| 02 | Modeling & topology | wireframe toggle; vertex/normal helpers; indexed-vs-non-indexed; segment count; flat-vs-smooth normals; **build-a-geometry fill-in** |
| 03 | Materials | swap Basic/Lambert/Standard/Physical; metalness/roughness/emissive/opacity; texture maps on/off |
| 04 | Lighting | add/remove ambient/directional/point/spot; intensity/color/position; shadow toggle; environment/IBL |
| 05 | Cameras | perspective↔orthographic; FOV/near/far with frustum helper; OrbitControls |
| 06 | three.js (vanilla) | full assembled scene: renderer, scene graph, render loop, resize, controls, loader — the "putting it together" file |
| 07 | React Three Fiber | same scene declaratively; `useFrame`, drei helpers, leva controls; mental model vs vanilla |
| 08 | Point cloud (WebGPU+TSL) | generate ~1M scan-like points; WebGPU render; GUI for point size / distance-fade / color mode (height/intensity); FPS counter. Live preview; internals in take-home doc |

## Project structure

```
3d-workshop/
  package.json  vite.config.ts  tsconfig.json
  index.html                       # landing menu linking all examples
  examples/
    01-space-transforms/  index.html  main.ts       # vanilla three + lil-gui
    02-topology/          index.html  main.ts        # + build-geometry exercise
    03-materials/         index.html  main.ts
    04-lighting/          index.html  main.ts
    05-cameras/           index.html  main.ts
    06-threejs-vanilla/   index.html  main.ts        # full scene
    07-react-three-fiber/ index.html  main.tsx App.tsx  # React + R3F + leva
    08-pointcloud-webgpu/ index.html  main.ts        # three/webgpu + TSL
  src/shared/
    generatePointCloud.ts            # synth ~1M-point scan-like data
workshop-docs/
  00-overview.md
  01-3d-space-and-transforms.md
  02-modeling-and-topology.md
  03-materials.md
  04-lighting.md
  05-cameras.md
  06-threejs-vanilla.md
  07-react-three-fiber.md
  08-pointcloud-webgpu-tsl.md        # take-home deep dive (longest)
  presenter-guide.md
  exercises.md
docs/superpowers/specs/
  2026-06-23-3d-fundamentals-workshop-design.md   # this file
```

### Vite MPA config

`vite.config.ts` declares one `rollupOptions.input` entry per example
`index.html` plus the root `index.html`. Plain-TS pages (vanilla examples) import
no React; the R3F page imports `react`, `react-dom`, `@react-three/fiber`. WebGPU
page imports from `three/webgpu` and `three/tsl`.

### Dependencies

Runtime: `three` (recent version with stable `three/tsl` + `three/webgpu`),
`@react-three/fiber`, `@react-three/drei`, `leva`, `lil-gui`, `react`,
`react-dom`. Dev: `vite`, `typescript`, `@vitejs/plugin-react`, `@types/three`,
`@types/react`, `@types/react-dom`, `@webgpu/types` (if not provided by three).
Exact three version pinned and verified at build time.

## Per-example code conventions

Each vanilla example file is **self-contained and readable in isolation**: it
includes the full renderer/scene/camera/loop/resize boilerplate inline (this is
pedagogically valuable for the fundamentals) rather than importing a shared
helper. The only shared module is `src/shared/generatePointCloud.ts`, imported
solely by example 08 (heavy data generation, justifies its own module).

Each example mounts to a single `<canvas>` (or container) in its `index.html`,
adds its GUI panel, and runs its own animation loop.

## Docs format

Each topic doc follows the same shape:

1. **Concept** — analogy + an ASCII/diagram explanation.
2. **The playground** — what each GUI control does and what to look for.
3. **Try this** — 2-4 guided prompts ("set FOV to 10, then 120 — what happens to
   perspective?").
4. **Gotchas** — common mistakes and confusions.
5. **Optional advanced** — depth for strong interns.
6. **Next** — link to the next topic, tying back to the scene spine.

Supporting docs:

- `00-overview.md` — agenda, setup/run instructions, prerequisites, the 3D
  pipeline mental model (model space → world → view → clip → screen).
- `presenter-guide.md` — per-topic timing, talking points, live-demo cues, common
  questions and answers, WebGPU browser-support notes and fallback plan.
- `exercises.md` — the 3 fill-in exercises with instructions and solution
  pointers.

## Flow / timing (~4 hours)

| Segment | Time |
|---------|------|
| Welcome + setup + 3D pipeline mental model | 15m |
| 01 Space & transforms | 30m |
| 02 Modeling & topology | 30m |
| 03 Materials | 25m |
| 04 Lighting | 25m |
| **Break** | 10m |
| 05 Cameras | 20m |
| 06 three.js vanilla (assemble) | 30m |
| 07 React Three Fiber | 30m |
| 08 Point cloud demo + WebGPU/TSL preview | 25m |
| Wrap, take-home pointer, Q&A | 10m |
| **Total** | **~4h10m** (buffer noted; cut to fit) |

## Exercises (3 fill-ins, solution siblings)

- **E1 — transforms (in 01):** make a child object orbit a parent (group +
  per-frame rotation). Fill in the TODO in the group/rotation block.
- **E2 — topology (in 02):** build a custom `BufferGeometry` (a square-based
  pyramid) by filling vertex positions, face indices, and computing normals.
- **E3 — R3F (in 07):** convert one vanilla snippet into an R3F component.

Each exercise ships with a `*.solution.ts` sibling (or a clearly-marked solution
block in `exercises.md`). The default example file contains the TODO gaps; the
solution file is complete.

## Point cloud take-home module (doc 08) — outline

1. **Why point clouds** — 3D scan output (LiDAR / photogrammetry) = millions of
   XYZ (+ color/intensity) points.
2. **Naive approach** — `THREE.Points` + `BufferGeometry` + `PointsMaterial`
   (WebGL). Works to ~100k; struggles at 1M (CPU bottlenecks, no depth-aware
   sizing, overdraw).
3. **WebGPU + TSL** — `WebGPURenderer`, node materials
   (`PointsNodeMaterial` / sprite-based), TSL for per-point size attenuation,
   color from height/intensity, distance/frustum fade. Storage/instanced buffers
   for 1M points.
4. **Performance** — upload attributes once, avoid per-frame CPU work, GPU-driven
   sizing, optional compute pass.
5. **Loading real data** — swap the procedural generator for `PLYLoader` / LAS;
   note formats (`.ply` / `.las` / `.laz` / `.pcd`).
6. **Live demo recap** — the example 08 route, with FPS counter and GUI.

## Out of scope (YAGNI)

- Full R3F build of the WebGPU point cloud (vanilla is cleaner for the renderer).
- Real scan-data files shipped in the repo (procedural generation + swap-in docs
  instead).
- Animation/rigging, physics, post-processing, XR — not 3D fundamentals.
- A unified routed single-page app (rejected in favor of independent MPA pages).

## Risks / notes

- **WebGPU availability:** requires a recent Chromium or Safari. Presenter guide
  documents browser check + a WebGL `THREE.Points` fallback so the demo never
  hard-fails.
- **three.js / TSL API churn:** TSL and `three/webgpu` paths evolve across
  versions. Pin a known-good `three` version and verify the example builds before
  the workshop.
- **1M-point generation cost:** generate in a typed-array loop (and/or a Web
  Worker if startup is slow) so the page doesn't jank on load.
```
