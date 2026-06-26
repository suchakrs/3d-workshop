# Fundamentals of 3D Development — Workshop Overview

A half-day (~4 hour) interactive workshop. You learn the building blocks of 3D
graphics by *playing with them* — every topic is a live, explorable example you
tweak in the browser — and finish by rendering a **1,000,000-point 3D scan** with
WebGPU.

## Who this is for

Lab interns. Mixed background — the baseline assumes you're comfortable with
JavaScript/web but new to 3D. No linear-algebra, graphics, or React prerequisite.
Each doc has an **Optional advanced** section if you already know the basics and
want depth.

## What you'll be able to do by the end

1. Explain 3D space, transforms (position/rotation/scale, parent-child), and the
   render pipeline.
2. Read and modify a vanilla three.js scene (renderer, scene graph, render loop,
   resize, controls).
3. Recognise the same scene in React Three Fiber and explain the declarative-vs-
   imperative trade-off.
4. Describe why naive point rendering struggles at 1M points and how WebGPU + TSL
   fixes it (the point-cloud module is take-home).

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (default <http://localhost:5173>). The landing page
links every example. Each example is its own standalone page — open it, tweak the
GUI (top-right), read the matching doc here in `workshop-docs/`.

- **Node:** 18+.
- **three.js:** `0.171.0` (pinned; exposes the stable `three/webgpu` + `three/tsl`
  subpaths used by example 08).
- **Browser:** any modern browser for topics 01–07. **Example 08 (point cloud)
  wants a recent Chrome or Edge** for the WebGPU + TSL path; other browsers fall
  back to WebGL automatically.

Other commands: `npm run typecheck` (tsc), `npm run build` (production bundle),
`npm test` (unit tests for the point-cloud generator).

## The mental model: the 3D pipeline

Everything in this workshop is a stage in getting a 3D point onto your 2D screen:

```
  MODEL space  ──(model/world matrix: position·rotation·scale)──▶  WORLD space
       │                                                                │
       │  topic 01 transforms, 02 geometry                              │
       ▼                                                                ▼
  VIEW space  ◀──(camera view matrix: where you stand)──  topic 05 camera
       │
       │  (projection matrix: lens / frustum)
       ▼
  CLIP space ──▶ NDC ──(viewport)──▶  SCREEN pixels
       ▲
       └─ topics 03 material + 04 lighting decide the COLOUR of each pixel
          (the renderer, topic 06/07, runs this whole pipeline every frame)
```

Keep this picture in mind — each topic is "one box in this diagram."

## The thread: one scene, revealed

The examples are independent files, but they tell one story. We start with an
empty canvas and a single object, then at each step we add the next idea to the
*same* scene:

| # | Topic | What we add to the scene |
|---|-------|--------------------------|
| [01](./01-3d-space-and-transforms.md) | 3D space & transforms | place & move the object |
| [02](./02-modeling-and-topology.md) | Modeling & topology | shape the object (geometry) |
| [03](./03-materials.md) | Materials | give its surface a material |
| [04](./04-lighting.md) | Lighting | light it (and cast shadows) |
| [05](./05-cameras.md) | Cameras | choose how we look at it |
| [06](./06-threejs-vanilla.md) | three.js (vanilla) | assemble the full app |
| [07](./07-react-three-fiber.md) | React Three Fiber | rebuild it declaratively |
| [08](./08-pointcloud-webgpu-tsl.md) | Point cloud (WebGPU+TSL) | swap the object for a 1M-point scan |

## Exercises

Three hands-on fill-ins (see [exercises.md](./exercises.md)): **E1** orbit a child
around a parent (topic 01), **E2** build a pyramid from raw vertices (topic 02),
**E3** convert a vanilla snippet to R3F (topic 07). Each has a `*.solution` file.

## Take-home

[08 · Point cloud (WebGPU + TSL)](./08-pointcloud-webgpu-tsl.md) is the deep dive
— demoed live, worked through on your own afterward. It's the closest thing here
to the lab's real rendering work.

Facilitators: see [presenter-guide.md](./presenter-guide.md) for timing and cues.
