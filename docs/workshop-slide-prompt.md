# Workshop Slide Deck — Generation Prompt

> **What this file is.** A self-contained brief for an AI slide designer (e.g. Claude
> with a slide/design tool). Read the whole thing, then generate the full slide deck
> for the *Fundamentals of 3D Development* workshop. Everything you need — content,
> speaker notes, demo cues, diagrams, technical background — is inlined here. You do
> **not** need to open any other file in the repo to build the deck.

---

## 0. Instructions to the slide designer

**Your job:** produce a presentation deck (~80–95 slides) for a half-day (~4 hour),
hands-on, in-person workshop that teaches the fundamentals of **realtime 3D
development** to lab interns.

**Audience:** comfortable with JavaScript / the web, **new to 3D graphics**. No
linear-algebra, GPU, or React prerequisite. Mixed level — some will be ahead, so each
topic has an *optional advanced* aside the presenter can pull forward or skip.

**Throughline / the big message:** this is a **realtime** rendering workshop. Every
technique exists to get a 3D scene onto the screen *fast enough to be interactive*
(≤ ~16 ms/frame). The arc builds one evolving scene from "place a cube" up to a
**live 1,000,000-point 3D scan rendered with WebGPU** — i.e. the lab's real workload.
Keep tying each topic back to "what does this cost per frame, and how do we make it
cheap enough?"

### Per-slide format (follow for every content slide)

Each slide in your output should carry these fields so the deck is consistent:

- **Title** — short, one idea per slide.
- **On-slide content** — terse bullets, a code snippet, or a diagram. Never a wall of
  text. Max ~6 bullets. Prefer a visual over prose.
- **Speaker notes** — what the presenter says out loud (the depth lives here, not on
  the slide).
- **Demo cue** *(when applicable)* — which example to open and exactly what to tweak
  live.
- **Visual** *(when applicable)* — diagram / screenshot / code-highlight to render.

### Deck conventions & visual style

- **Theme:** dark. Background `#0b0e14` (matches the app's canvas). Light text. One
  accent (electric blue `#66ccff`) for highlights and the "live demo" badge.
- **One idea per slide.** Break dense topics across multiple slides rather than
  cramming.
- **Code:** monospace, syntax-highlighted, ≤ ~12 lines per slide, highlight the line
  that matters. Strip boilerplate.
- **Diagrams over bullets** wherever a concept is spatial (coordinate spaces,
  pipeline, frustum, parent-child).
- **"LIVE DEMO" badge** (accent colour) on every slide that drives an example in the
  browser — these are the heart of the workshop.
- **Section dividers** between the 11 segments, each showing where we are on the
  pipeline diagram (see §2) so learners always know which "box" we're in.
- **Exercise slides** get a distinct treatment (e.g. a "✏️ YOUR TURN" banner).

### Slide budget per segment (target; adjust ±2)

| Segment | Slides | Live time |
|---|---|---|
| 00 Intro: realtime vs pre-render + the pipeline | 12 | 15m |
| 01 3D space & transforms (+ matrix view, E1) | 11 | 30m |
| 02 Modeling & topology (+ E2) | 11 | 30m |
| 03 Materials | 9 | 25m |
| 04 Lighting | 9 | 25m |
| *Break* | 1 | 10m |
| 05 Cameras | 7 | 20m |
| 06 three.js (vanilla) | 9 | 30m |
| 07 React Three Fiber (+ E3) | 8 | 30m |
| 08 Point cloud — WebGPU + TSL (climax) | 9 | 25m |
| Wrap: where realtime 3D goes next + Q&A | 5 | 10m |

---

## 1. Workshop facts (for title + setup slides)

- **Title:** Fundamentals of 3D Development.
- **Subtitle:** From a single cube to a million-point realtime scan.
- **Format:** half-day, ~4h, hands-on. Every topic is a live, explorable browser
  playground with a GUI you tweak; a docs page accompanies each.
- **Stack:** Vite + TypeScript + **Three.js 0.171** (pinned for the stable
  `three/webgpu` + `three/tsl` paths used in topic 08). Topic 07 adds React Three
  Fiber (`@react-three/fiber`, `drei`, `leva`).
- **Setup slide content:**
  ```bash
  npm install
  npm run dev      # Vite dev server; landing page links every example
  ```
  Open the printed URL (default http://localhost:5173). GUI sits **top-right**,
  info overlay **top-left**. Browser: any modern browser for 01–07; **topic 08
  wants recent Chrome/Edge** for the WebGPU path (auto-falls back to WebGL).

### Learning outcomes (put on an "by the end you can…" slide)

1. Explain 3D space, transforms, and the realtime render pipeline (model → screen).
2. Read and modify a vanilla three.js scene (renderer, scene graph, render loop,
   resize, controls).
3. Recognise the same scene in React Three Fiber and explain the
   declarative-vs-imperative trade-off.
4. Explain why naive point rendering struggles at 1M points and how WebGPU + TSL
   fixes it.

---

## 2. Reusable assets (use across the whole deck)

### The realtime pipeline diagram (the spine of the deck)

Render this once as a hero diagram, then reuse a mini version on every section
divider with the current topic's box highlighted.

```
  MODEL space  ──(model/world matrix: position·rotation·scale)──▶  WORLD space
       │                                                                │
       │  ① transforms (01)   ② geometry (02)                           │
       ▼                                                                ▼
  VIEW space  ◀──(camera view matrix: where you stand)──  ⑤ camera (05)
       │
       │  (projection matrix: the lens / frustum)
       ▼
  CLIP space ──▶ NDC ──(viewport)──▶  SCREEN pixels
       ▲
       └─ ③ material (03) + ④ lighting (04) decide the COLOUR of each pixel
          (the renderer ⑥/⑦ runs this whole chain every single frame)
```

Tagline for the diagram slide: **"Every topic today is one box in this picture. The
renderer runs the whole chain 60 times a second."**

### "One scene, revealed" table (intro + recurring progress marker)

| # | Topic | What we add to the scene |
|---|-------|--------------------------|
| 01 | 3D space & transforms | place & move the object |
| 02 | Modeling & topology | shape the object (geometry) |
| 03 | Materials | give its surface a material |
| 04 | Lighting | light it (and cast shadows) |
| 05 | Cameras | choose how we look at it |
| 06 | three.js (vanilla) | assemble the full app |
| 07 | React Three Fiber | rebuild it declaratively |
| 08 | Point cloud (WebGPU+TSL) | swap the object for a 1M-point scan |

### Recurring conventions to mention once and reuse

- Every example: a full-screen `<canvas id="c">`, an `OrbitControls` camera (drag to
  orbit, scroll to zoom), a GUI panel top-right bound to a `params` object.
- Helpers in early scenes: **AxesHelper** (red=X, green=Y, blue=Z), **GridHelper**
  (flat on the XZ plane, y=0).

---

## 3. Technical background the learner needs (NOT in the example code)

This is the conceptual layer that makes the demos make sense. Weave these into the
relevant segments (most into the 00 intro; the rest as "why does this work" asides).
**These are the facts a learner must carry away even though they never appear as code
in the examples.**

### 3.1 Pre-rendered vs realtime 3D — the framing of the whole day

Put this *early* (intro), as a side-by-side slide. This is the mental fork that
defines everything we do.

| | **Pre-rendered (offline)** | **Realtime** |
|---|---|---|
| How light is handled | *Simulated* — ray/path tracing follows light physics, many bounces | *Approximated* — rasterise triangles, fake the light with tricks |
| Time per frame | Seconds → **hours**; render farms | **≤ ~16 ms** (60 fps); one machine |
| Interactive? | No — fixed, baked output (a video/image) | **Yes** — responds to input every frame |
| Where you see it | Film/VFX (Pixar, Marvel), arch-viz, product shots | Games, web 3D, AR/VR, CAD, **digital twins / 3D scans** |
| Quality ceiling | "As good as you'll wait for" | "As good as fits the frame budget" |

**Speaker note:** The same scene can be rendered either way. The difference is the
*constraint*. Offline trades time for physical accuracy. Realtime trades accuracy for
**latency** — it must answer "what does the screen look like *right now*" 60 times a
second. **This entire workshop is about the realtime side**, and almost every
technique you'll see is a clever approximation that exists only because we can't
afford the honest calculation. The lines are blurring (realtime ray tracing / RTX,
path tracing in modern engines), but the budget mindset is what defines realtime.

### 3.2 The frame budget — the realtime mental model

- 60 fps → **16.7 ms/frame**. 30 fps → 33 ms. VR → 90+ fps → ~11 ms.
- That budget covers *everything*: input, animation/physics, scene-graph update,
  culling, and the GPU draw. Miss it → stutter / dropped frames.
- Mantra for the deck: **"In realtime, the question is never 'is this correct?' — it's
  'can I fake this convincingly inside the budget?'"**

### 3.3 GPU vs CPU — why 3D runs on the GPU

- **CPU:** a few powerful cores, great at serial/branchy logic.
- **GPU:** *thousands* of small cores running the *same* program in lockstep (SIMD) —
  built for "do this one operation to millions of vertices / pixels."
- Rendering is embarrassingly parallel (every pixel is independent), so it lives on
  the GPU. You hand the GPU **data** (vertex buffers) + **programs** (shaders); it
  runs them massively in parallel.

### 3.4 The rasterization pipeline (what three.js drives under the hood)

This is the *implementation* of the §2 pipeline. Show as a flow diagram.

```
vertex data ─▶ VERTEX SHADER ─▶ assemble ─▶ RASTERIZER ─▶ FRAGMENT SHADER ─▶ depth test ─▶ framebuffer ─▶ screen
 (positions,   (transform each   triangles  (which pixels   (compute each      (z-buffer:    (the image)
  normals,      vertex to                    does each        pixel's colour)    nearest
  uvs, colours) clip space)                  triangle cover?)                    wins)
```

- **Triangles are the only thing the GPU draws.** Everything — spheres, characters,
  terrain — is triangles. Quads/n-gons from modelling tools get triangulated on
  import.
- **Vertex shader** runs once per vertex: applies the model·view·projection matrices
  (topics 01 + 05) to move the vertex into clip space.
- **Rasterizer** (fixed hardware) decides which screen pixels a triangle covers.
- **Fragment (pixel) shader** runs once per covered pixel: computes its colour from
  material + lights (topics 03 + 04).
- **Depth test / z-buffer:** per-pixel depth; the nearest fragment wins, so closer
  objects hide farther ones.

### 3.5 Shaders & TSL

- **Shaders** = small programs that run on the GPU, in parallel, per-vertex or
  per-pixel. Written in GLSL (WebGL) or WGSL (WebGPU).
- three.js **generates shaders for you** from its materials — you usually never write
  one. Topic 08 is where we peek under the hood.
- **TSL (Three Shading Language):** author shader logic as a graph of JS **nodes**
  (`uniform`, `attribute`, `mix`, `clamp`…). three compiles the node graph to GLSL
  *or* WGSL, so the same code runs on WebGL or WebGPU. Used in topic 08 to drive
  per-point size/colour/opacity on the GPU.

### 3.6 Draw calls — the cost the GPU hates

- A **draw call** = the CPU telling the GPU "draw this geometry with this material."
  Each one has fixed overhead.
- **Many small draw calls** (1000 separate cubes) starves the GPU on overhead.
  **One big draw call** (1000 cubes in one buffer, or 1M points in one buffer) is
  cheap. Hence *instancing* and *batching*.
- This is exactly why **1M points in a single buffer renders fine** but 1M individual
  objects would not — set this up in intro, pay it off in topic 08.

### 3.7 Scene graph: retained mode & the render loop

- three.js is **retained-mode**: you build a *tree* of objects (the scene graph), and
  the renderer walks it and draws everything **every frame**. (Contrast: immediate
  mode, where you issue draw commands yourself each frame.)
- The **render loop** uses `requestAnimationFrame` (synced to the display refresh,
  ~60 Hz). Use a **delta time** (seconds since last frame) so motion is
  frame-rate-independent. WebGPU/WebXR use `renderer.setAnimationLoop` instead.

### 3.8 Coordinate spaces & matrices (reinforce in topic 01 + 05)

- A 3D transform (position+rotation+scale) is stored as a **4×4 matrix**. Multiplying
  matrices **composes** transforms; order matters.
- Pipeline of spaces: **local → world** (model matrix) **→ view** (camera matrix)
  **→ clip** (projection matrix) **→ NDC** (after the perspective "w-divide")
  **→ screen** (viewport). Topic 01-2 lets learners watch a live 4×4 matrix as they
  drag a gizmo.

### 3.9 Colour correctness (mention in materials/lighting)

- Monitors are **sRGB** (non-linear); light maths must happen in **linear** space.
  Get this wrong → washed-out or muddy colours.
- **Tone mapping** squeezes high-dynamic-range lighting into the 0–1 display range.
  three handles both via `renderer.outputColorSpace` and `renderer.toneMapping` —
  worth one slide so learners know the knob exists.

### 3.10 Where realtime 3D scales (sets up topic 08 + the wrap)

- **Culling** — skip what the camera can't see (frustum culling; occlusion culling).
- **LOD** — use cheaper geometry for distant objects.
- **Instancing** — one draw call for many copies.
- **Overdraw** — drawing the same pixel many times (transparency, dense points) burns
  fill-rate; a real cost for point clouds.
- **CPU-bound vs GPU-bound** — know which half is your bottleneck before optimising.
- **WebGL vs WebGPU** — WebGL ≈ OpenGL ES in the browser: mature, but no compute
  shaders and higher driver overhead. **WebGPU** maps to modern native APIs
  (Vulkan/Metal/DX12): **compute shaders**, lower overhead, better parallelism — the
  future of realtime on the web, and what makes the 1M-point demo smooth.

---

## 4. Segment-by-segment slide content

> For each slide below: the heading is the **slide title**, the bullets are
> **on-slide content** unless prefixed, and *Notes:* / *Demo:* / *Visual:* give the
> speaker notes, demo cue, and visual. Generate one slide per entry (split if it gets
> dense).

### Segment 00 — Intro: realtime vs pre-render + the pipeline (12 slides, 15m)

1. **Title** — "Fundamentals of 3D Development" + subtitle "From a single cube to a
   million-point realtime scan." *Visual:* a still of the topic-08 point cloud as the
   hook. *Notes:* "By the end of today you'll render a 1M-point 3D scan, live, in your
   browser."
2. **Who this is for** — comfortable with JS/web, new to 3D; mixed level, optional
   advanced asides; nobody gets blocked because every example is a finished
   playground.
3. **What you'll be able to do** — the 4 learning outcomes (§1).
4. **Two ways to render 3D** — the pre-render vs realtime table (§3.1). *Notes:* the
   defining fork of the day; offline trades time for accuracy, realtime trades
   accuracy for latency. *Visual:* side-by-side — a film frame vs a game/scan frame.
5. **The realtime constraint: the frame budget** — 60 fps = 16.7 ms; that covers
   *everything* (§3.2). *Notes:* the mantra — "can I fake this inside the budget?"
6. **Why the GPU** — CPU few big cores vs GPU thousands of tiny ones; rendering is
   massively parallel (§3.3). *Visual:* CPU (4 big squares) vs GPU (grid of tiny
   squares).
7. **The pipeline (hero diagram)** — the §2 diagram. *Notes:* every topic = one box;
   the renderer runs the whole chain every frame.
8. **The pipeline, for real: rasterization** — the §3.4 flow (vertex shader →
   rasterizer → fragment shader → depth test). *Notes:* triangles are the only thing
   the GPU draws; introduce "shader" lightly.
9. **One scene, revealed** — the §2 table. *Notes:* the examples are independent files
   but tell one story; we add one idea per topic.
10. **Setup** — the `npm install` / `npm run dev` slide (§1); GUI top-right, overlay
    top-left; topic 08 wants Chrome/Edge.
11. **How today works** — tweak the live GUI, read the matching doc, 3 hands-on
    exercises (E1–E3) with solution files to check against.
12. **Section divider template** — show the mini-pipeline with box ① lit. *Notes:*
    "Let's place an object in space."

### Segment 01 — 3D space & transforms (11 slides, 30m) · pipeline box ①

1. **Divider** — transforms; mini-pipeline box ① lit.
2. **Right-handed coordinates** — +X right, +Y up, +Z toward you; right-hand rule for
   rotation direction. *Visual:* the axes hand diagram. *Demo:* open
   `01-space-transforms`, point at the AxesHelper (R/G/B = X/Y/Z).
3. **The transform trio: T · R · S** — every object = Scale, then Rotate, then
   Translate, composed into one 4×4 matrix. *Notes:* order matters; changing
   position/rotation/scale recomposes the matrix each frame.
4. **Rotation order matters (Euler angles)** — XYZ ≠ ZYX for the same angles.
   *Demo:* set rotX=90 (note result), reset, set rotY=90 then rotX=90 → different
   orientation. *Notes:* introduce **gimbal lock** (two axes align → lose a DOF);
   quaternions avoid it and interpolate smoothly (advanced aside).
5. **Degrees vs radians (gotcha)** — three stores radians; the GUI shows degrees and
   converts via `THREE.MathUtils.degToRad()`. Common student question.
6. **Local vs world space** — `object.position` is always in the *parent's* space; get
   world coords with `mesh.getWorldPosition(v)`.
7. **Parent–child chain** — `child.matrixWorld = parent.matrixWorld × child.matrix`; a
   parent's transform propagates to all children. *Visual:* nested-box diagram.
8. **Demo: the parent group** — *Demo:* enable "Parent group" toggle; the cube sits at
   local offset (2,0,0); rotating the group orbits the cube around the group origin.
   *Notes:* the child never changes its own position — the parent moves the frame.
9. **Non-uniform scale & normals (advanced aside)** — scale x=3 distorts the
   normal-material colours; non-uniform scale needs a corrected normal matrix
   `mat3(transpose(inverse(modelMatrix)))`. Keep brief; flag as advanced.
10. **✏️ E1 — orbit a child around a parent** — file
    `examples/01-space-transforms/main.ts`, the `TODO (E1)` in the render loop. Task:
    rotate the group each frame so the offset child sweeps a circle. Hint:
    `group.rotation.y += dt * groupSpeed`. Solution: `main.solution.ts`. *Notes:* "the
    child already has the offset — you only spin the parent."
11. **Aside: read the matrix (topic 01-2)** — *Demo:* open
    `01-2-transform-matrix`, drag the gizmo, watch the live 4×4 matrix change; the
    bottom row / translation column is the position. *Notes:* this *is* what the GPU's
    vertex shader multiplies every vertex by.

### Segment 02 — Modeling & topology (11 slides, 30m) · pipeline box ②

1. **Divider** — geometry; box ② lit. *Notes:* "now we shape the object."
2. **Everything is triangles** — the GPU only rasterises triangles; spheres/terrain
   are just lots of them (§3.4 callback). *Demo:* open `02-topology`, drop sphere
   segments to 1–2 to see the facets.
3. **Anatomy of a mesh** — geometry (the shape) + material (the look). Geometry =
   **vertices** + how they connect into triangles.
4. **A vertex is more than a position** — position + **normal** + **uv** + optional
   colour/tangent; stored as parallel typed-array **attributes** (a
   `BufferGeometry`). *Visual:* a labelled vertex.
5. **Indexed vs non-indexed** — indexed geometry stores each shared vertex once and
   reuses it via an index list → smaller, faster, fewer vertex-shader runs. *Visual:*
   a quad as 4 verts + 6 indices vs 6 duplicated verts.
6. **Normals drive shading** — a normal is the surface's "which way am I facing"
   vector; lighting uses it. **Smooth** (shared normals) vs **flat** (per-face
   normals = split vertices). *Demo:* toggle smooth/flat normals; toggle wireframe.
7. **Winding order & back-face culling** — triangle vertex order (CCW-from-outside)
   defines the front face; back faces are culled for speed. *Notes:* "why is my face
   invisible / black?" → reversed winding. Common question.
8. **UVs (brief)** — 2D coordinates that map a texture image onto the surface; sets up
   materials. Keep to one slide.
9. **Where geometry comes from** — primitives (box/sphere/torus), procedural (built in
   code), or **loaded** (glTF/OBJ/PLY from modelling tools or 3D scans). A loader just
   fills the same vertex/index buffers by hand.
10. **✏️ E2 — build a pyramid from raw vertices** *(the longest exercise)* — file
    `examples/02-topology/pyramid.ts`, three `TODO(E2)` markers. A square pyramid = 5
    vertices (4 base + apex), 6 triangles (4 sides + 2 base), 18 indices. Wind each
    triangle CCW-from-outside; then `geometry.computeVertexNormals()`. Solution:
    `pyramid.solution.ts`. *Notes:* black/missing face = flip two indices.
11. **What you just did** — "you wrote, by hand, exactly what every model loader does
    under the hood." Tie back to topic 08's point buffers.

### Segment 03 — Materials (9 slides, 25m) · pipeline box ③ (pixel colour)

1. **Divider** — materials; box ③ (colour) lit. *Notes:* "the fragment shader decides
   each pixel's colour — the material is its recipe."
2. **What a material is** — the per-pixel colour recipe; three compiles it into a
   fragment shader for you.
3. **The material ladder** — Basic → Lambert → **Standard** → Physical, cheap→costly,
   fake→physically-based. *Demo:* open `03-materials`, switch through them.
4. **Basic ignores light** — MeshBasicMaterial shows a flat colour regardless of
   lights (great for UI/unlit, debugging). *Demo:* switch to Basic — lights stop
   mattering. *Notes:* "everything black?" is often a Basic/Normal material or missing
   lights/normals.
5. **PBR: metalness / roughness** — physically based rendering = energy-conserving,
   looks right under any lighting; the modern standard shared by film *and* realtime
   (§3.x). *Demo:* Standard, metalness=1 + roughness=0 (mirror) → roughness=1
   (diffuse).
6. **Texture maps** — colour/albedo, normal map (fake surface detail without geometry),
   roughness/metalness, AO; all sampled via the mesh's UVs. *Visual:* a brick with/
   without a normal map.
7. **Transparency** — `transparent` + `opacity`, blending, and why transparent objects
   are tricky (draw order, depth). Foreshadow point-cloud overdraw.
8. **Colour space & tone mapping (aside)** — work in linear, output sRGB; tone-map HDR
   lighting to the display (§3.9). One slide: "the knob exists, mismanage it → washed
   out."
9. **Recap** — same geometry, different material = different surface. Next: light it.

### Segment 04 — Lighting (9 slides, 25m) · pipeline box ④

1. **Divider** — lighting; box ④ lit.
2. **Realtime lighting is faked** — we can't trace every bounce in 16 ms; realtime is a
   *bag of tricks* approximating offline light transport (§3.1 callback).
3. **Light types** — ambient (flat fill), directional (sun, parallel rays), point
   (bulb), spot (cone). *Demo:* open `04-lighting`, turn all off, add one directional
   light, move it.
4. **Shadows = shadow maps** — render scene depth from the light's point of view, then
   test each pixel against it. Costs an extra pass; has resolution/bias artifacts.
   *Demo:* enable shadows, swing the directional light, watch the shadow move.
5. **Why is everything black? (gotcha)** — no lights, or a Basic/Normal material, or
   missing normals. The #1 lighting question.
6. **Ambient is a cheat** — flat ambient fakes bounced light crudely; real indirect
   light is expensive.
7. **IBL / environment maps** — light the scene from an environment image → instant
   realistic ambient + reflections. *Demo:* toggle IBL — "notice the realism jump."
8. **The realtime GI toolbox (aside)** — baked lightmaps, SSAO, screen-space
   reflections, approximate GI; all tricks to fake what path tracing computes
   honestly. Name-drop, don't teach.
9. **Recap** — material + lights = final pixel colour; that's box ③+④ done.

*(Insert the BREAK slide here — 10m.)*

### Segment 05 — Cameras (7 slides, 20m) · pipeline box ⑤

1. **Divider** — cameras; box ⑤ lit. *Notes:* "the camera is the view + projection
   matrices — where you stand and the lens you look through."
2. **View vs projection** — view matrix = camera position/orientation (the inverse of
   the camera's transform); projection matrix = the lens (frustum → clip space).
3. **Perspective vs orthographic** — perspective = things shrink with distance (games,
   real life); ortho = no foreshortening (CAD, 2D/iso). *Demo:* open `05-cameras`,
   switch perspective ↔ ortho.
4. **FOV & the frustum** — field of view = how wide the lens; the frustum is the
   visible pyramid. *Demo:* FOV 10 vs 120 (dolly-zoom feel). *Visual:* inset frustum
   view.
5. **Near & far planes / z-fighting** — only geometry between near and far is drawn;
   the depth buffer has limited precision, so a tiny near + huge far ratio causes
   **z-fighting** (§3.4 depth callback). *Demo:* push near to 0.001 + far to 100000 →
   flickering. *Notes:* keep near/far as tight as you can.
6. **Frustum culling (perf aside)** — objects outside the frustum are skipped entirely
   — a free, automatic realtime optimisation (§3.10).
7. **Recap** — we can now place, shape, colour, light, and *look at* the object.
   Everything's been pieces — next we assemble the whole app.

### Segment 06 — three.js vanilla: the full app (9 slides, 30m) · boxes ⑥

1. **Divider** — "it all comes together." *Notes:* the integration moment — every box
   of the pipeline in one file.
2. **The four things every three.js app needs** — Renderer, Scene, Camera, and a
   render Loop. *Demo:* open `06-threejs-vanilla`.
3. **Renderer** — `new THREE.WebGLRenderer({ canvas, antialias })`, `setSize`,
   `setPixelRatio(min(dpr, 2))` (cap DPR so retina doesn't 4× the pixel work — a
   realtime cost).
4. **Scene = the retained-mode graph** — you build a tree once; the renderer walks it
   every frame (§3.7). *Visual:* scene-graph tree.
5. **The render loop** — `requestAnimationFrame`, **delta time** for frame-rate
   independence, `controls.update()`, `renderer.render(scene, camera)`. *Notes:* this
   loop is the realtime heartbeat; it runs the whole pipeline each tick.
6. **Resize handling** — on window resize, update `camera.aspect`,
   `camera.updateProjectionMatrix()`, `renderer.setSize()`. Easy to forget; squashes
   the image if missed.
7. **Dispose hygiene** — geometries/materials/textures hold GPU memory; `dispose()`
   them when you swap or remove objects (matters a lot at 1M points). *Notes:* topic
   08's rebuild disposes the old geometry every time.
8. **Walk the file** — `main.ts` is numbered in sections; walk renderer → scene →
   camera → controls → mesh → loop. *Demo:* scroll the real file on a second screen.
9. **Recap** — that's a complete realtime 3D app in ~one file. Next: the same scene,
   declaratively.

### Segment 07 — React Three Fiber (8 slides, 30m) · same boxes, declarative

1. **Divider** — R3F. *Notes:* "same renderer, same scene — different authoring
   model."
2. **Imperative vs declarative** — vanilla: you *issue commands* (`scene.add(mesh)`);
   R3F: you *describe* the scene as JSX and React reconciles it. *Visual:* 06 loop
   next to 07 JSX, side by side.
3. **The mapping** — `new THREE.Mesh` → `<mesh>`; constructor args → `args={[...]}`;
   children = geometry + material; properties = props (`position`, `castShadow`).
   *Demo:* open `07-react-three-fiber`.
4. **`<Canvas>` sets up everything** — renderer + scene + camera + loop, created for
   you; you just declare children. drei adds helpers (`<OrbitControls>`), leva adds
   the GUI (`useControls`).
5. **`useFrame` replaces the manual loop** — per-frame callback with delta; React
   handles mounting/unmounting objects (no manual `add`/`remove`/`dispose`).
6. **✏️ E3 — convert a vanilla snippet to JSX** — file
   `examples/07-react-three-fiber/App.tsx`, the `TODO(E3)` comment holds vanilla code
   building a box. Convert to:
   ```tsx
   <mesh position={[-2.5, 0, 0]} castShadow>
     <boxGeometry args={[1, 1, 1]} />
     <meshStandardMaterial color={0xff6688} />
   </mesh>
   ```
   Solution: `App.solution.tsx`.
7. **When R3F vs vanilla?** — R3F when the app is already React (composition, state,
   ecosystem); vanilla for tight engine control or non-React hosts. Same Three.js
   underneath either way.
8. **Recap** — two authoring models, one engine. Now the climax: scale to a million
   points.

### Segment 08 — Point cloud: WebGPU + TSL (9 slides, 25m) · the climax

1. **Divider** — "the lab's real workload." *Visual:* the 1M-point terrain.
2. **What a point cloud is** — a 3D scan (LiDAR/photogrammetry) = millions of XYZ
   points, often + colour/intensity. **No surface, no connectivity** — just points.
   (We synthesise a scan-like terrain so the repo stays small.)
3. **Why points are hard** — millions of them; no triangles to cull/LOD against;
   heavy **overdraw**; transparency/sorting issues (§3.10). Naive per-point work on
   the CPU can't keep the frame budget.
4. **The fix: push per-point work to the GPU** — one big buffer (one draw call,
   §3.6), and a shader computes each point's size/colour/opacity in parallel.
5. **WebGL vs WebGPU** — WebGL: mature, no compute, more overhead. **WebGPU**: compute
   shaders, lower overhead, modern API — what keeps 1M points smooth (§3.10). The
   example auto-detects and falls back to WebGL.
6. **TSL — shaders as node graphs** — author GPU logic in JS nodes; compiles to GLSL
   *or* WGSL (§3.5). *Visual:* show the size node:
   ```ts
   const dist = positionView.xyz.length();          // view-space distance
   const attenuated = uSize.mul(float(120).div(dist.max(1.0)));
   const sizeNode = mix(uSize, attenuated, uAtten);  // toggle attenuation live
   ```
7. **Live demo** — *Demo:* open `08-pointcloud-webgpu`; orbit the terrain; toggle
   **size attenuation** (flat smear → readable depth); step **100k → 500k → 1M** and
   read the **FPS** counter; switch colour mode (height/uniform/grayscale); pull
   **distance fade**. *Notes:* watch the backend badge (WebGPU+TSL vs WebGL fallback).
8. **Reproducible data (aside)** — the generator uses a seeded PRNG (no `Math.random`),
   so the same seed → identical cloud; that's what makes the unit tests meaningful.
   Real swap-in: a `.ply`/`.las` loader fills the same position/colour buffers.
9. **Recap** — from one cube to 1M points: same pipeline, same render loop, the
   difference is doing the per-point work on the GPU within the frame budget.

### Segment 09 — Wrap: where realtime 3D goes next + Q&A (5 slides, 10m)

1. **What we built** — recap the §2 "one scene revealed" table, all rows ticked.
2. **The realtime mindset to keep** — frame budget; fake it convincingly; fewer/bigger
   draw calls; push work to the GPU; measure before optimising.
3. **Where realtime 3D is going** — WebGPU everywhere; realtime ray/path tracing;
   **Gaussian splatting / neural rendering (NeRF)** for scans; digital twins; AR/VR /
   spatial computing — and the lab's scan-rendering work sits right here.
4. **Your direction from here** — these fundamentals transfer to game engines
   (Unity/Unreal/Godot) and native graphics (Vulkan/Metal/DX12). The take-home: work
   through the topic-08 WebGPU+TSL deep dive on your own.
5. **Q&A / thanks** — links: the landing page, `workshop-docs/`, the exercises &
   solution files.

---

## 5. Quick reference — demos & exercises (for the presenter, optional appendix slides)

**Demos by topic:** 01 rotation-order + parent group · 01-2 live matrix · 02 sphere
segments + smooth/flat normals + wireframe · 03 material ladder + metalness/roughness ·
04 single directional light + shadows + IBL · 05 FOV 10↔120 + ortho + near/far
z-fighting · 06 walk `main.ts` · 07 06-loop vs 07-JSX side by side · 08 attenuation +
100k→1M FPS + colour modes.

**Exercises:** E1 orbit child (topic 01) · E2 build pyramid (topic 02, longest) · E3
vanilla→JSX (topic 07). Each has a `*.solution` file to diff against.

**If running long, cut:** shorten E2 (walk the solution instead of writing it),
compress cameras to ~12m. **Protect 06, 07, and the 08 demo — they're the payoff.**
