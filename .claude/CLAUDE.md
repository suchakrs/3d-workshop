# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An interactive half-day teaching workshop, *not* a product. It is a set of standalone, explorable 3D playgrounds (examples 01–08) each paired with a markdown doc in `workshop-docs/`. The examples deliberately build up *one evolving scene* — place an object → shape it → material → light → camera → assemble in vanilla three.js → rebuild in R3F → swap the object for a 1M-point WebGPU point cloud. Read `workshop-docs/00-overview.md` for the full arc before changing example content.

## Two independent stacks

1. **Web app** — Vite + TypeScript + Three.js (`package.json`, `examples/`, `src/`). This is the workshop itself.
2. **Python notebooks** — uv-managed, Python ≥ 3.12 (`pyproject.toml`, `notebooks/`, `main.py`). Standalone tooling for poking at 3D assets (e.g. reading `public/cube.ply`). `main.py` is a stub; the real content is the notebooks. The two stacks share no code.

## Commands

```bash
npm install
npm run dev        # Vite dev server (multi-page; landing page links every example)
npm run build      # production build -> dist/
npm run preview    # preview the build
npm run typecheck  # tsc --noEmit
npm test           # vitest run (one suite: the point-cloud generator)

# single test
npx vitest run src/shared/generatePointCloud.test.ts
npx vitest run -t "is deterministic"

# notebooks
uv sync
uv run jupyter lab notebooks/read_ply.ipynb
```

## Architecture & conventions

**Multi-page Vite build.** There is no router. Each example is its own `index.html` + entry script, and *every* page is pre-registered in `vite.config.ts` under `build.rollupOptions.input`. **Adding a new example means adding an input entry there** (and a link in the root `index.html`) — example authors otherwise never touch the config, keeping their work in disjoint folders.

**Vanilla examples (01–06, 08)** are imperative TypeScript: a `<canvas id="c">`, `THREE.WebGLRenderer`, `OrbitControls` from `three/addons`, a `lil-gui` panel (top-right) bound to a `params` object, a `resize` listener, and a `requestAnimationFrame`/`setAnimationLoop` render loop. New vanilla examples should mirror this skeleton (see `examples/01-space-transforms/main.ts`).

**Example 07 (R3F)** is the declarative counterpart: `@react-three/fiber` `<Canvas>`, `OrbitControls` from `@react-three/drei`, and `leva`'s `useControls` instead of lil-gui. It is the *same scene* expressed declaratively — that contrast is the teaching point.

**Example 08 (point cloud)** has two render paths chosen at runtime by WebGPU feature detection: a `WebGPURenderer` + `PointsNodeMaterial` driven by TSL nodes (`three/webgpu`, `three/tsl`), and a plain `THREE.Points` WebGL fallback. **three.js is pinned to `0.171.0`** specifically because it exposes the stable `three/webgpu` and `three/tsl` subpaths this example imports — don't bump it casually.

### Exercises — do not "fix" the TODOs

`main.ts` / `App.tsx` files contain intentional gaps marked `TODO (E1)`, `TODO(E3)`, etc. — these are student fill-ins and must stay blank. The completed answers live alongside them as `*.solution.ts` / `*.solution.tsx` (e.g. `pyramid.ts` ↔ `pyramid.solution.ts`, `App.tsx` ↔ `App.solution.tsx`). When editing an example, keep the unsolved/solution pair in sync and **don't complete a TODO in the non-solution file.**

### Shared code

`src/shared/generatePointCloud.ts` is the only shared module and the only unit-tested code. It synthesises a deterministic scan-like terrain (a seeded `mulberry32` PRNG — **no `Math.random`**). Determinism is a tested contract (`generatePointCloud.test.ts` asserts same-seed → identical output); preserve it. The float32 read-back in the bounds pass is also deliberate so bounds always enclose stored points — keep that property.

Styling is one shared stylesheet, `src/styles/base.css`, linked by every page.
