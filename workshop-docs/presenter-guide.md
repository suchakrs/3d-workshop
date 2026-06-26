# Presenter Guide

Facilitator notes for running the half-day workshop. Mixed audience — pace to the
"comfortable-with-JS, new-to-3D" baseline, and pull the **Optional advanced** doc
sections forward only if the room is ahead.

## Before you start (pre-flight)

- [ ] `npm install` and `npm run dev` on the demo machine; open every example
      once so chunks are warm.
- [ ] **Test example 08 in the actual room browser.** It needs recent
      Chrome/Edge for WebGPU. If unavailable you'll see the WebGL fallback banner
      — fine to show, but have a screenshot/recording of the WebGPU path as
      backup.
- [ ] Projector resolution: the GUI sits top-right, overlay top-left — check both
      are readable.
- [ ] Have the repo open in an editor on a second screen for the "read the code"
      moments.

## Timing (~4 hours)

| Segment | Time | Notes |
|---------|------|-------|
| Welcome + setup + pipeline mental model | 15m | Draw the pipeline diagram from `00-overview.md` on the board |
| 01 Space & transforms | 30m | includes E1 |
| 02 Modeling & topology | 30m | includes E2 (the longest exercise) |
| 03 Materials | 25m | |
| 04 Lighting | 25m | |
| **Break** | 10m | |
| 05 Cameras | 20m | |
| 06 three.js vanilla | 30m | the "it all comes together" moment |
| 07 React Three Fiber | 30m | includes E3 |
| 08 Point cloud demo + WebGPU/TSL preview | 25m | demo + skim the take-home doc |
| Wrap, take-home pointer, Q&A | 10m | |

Total ≈ 4h10. **If you're running long, cut here:** shorten E2 (walk the solution
instead of having them write it), and compress 05 cameras to 12m. Protect 06, 07,
and the 08 demo — they're the payoff.

## Per-topic cues

**00 Intro.** Sell the arc: "by the end you'll render a million-point scan." Draw
the model→world→view→clip→screen pipeline; tell them every topic is one box.

**01 Space & transforms.**
- Talking points: right-handed coords; transforms compose (T·R·S, order matters);
  parent-child inheritance.
- Demo cue: open 01, drag rotation X then Y, reset, do Y then X — different result
  = rotation order. Then enable the parent group.
- Exercise: E1 (orbit child). Common Q: *"degrees or radians?"* — three uses
  radians; the GUI converts for you.

**02 Modeling & topology.**
- Talking points: triangles are the only thing the GPU draws; indexed vs
  non-indexed; normals drive shading.
- Demo cue: drop sphere segments to 1–2 (see the facets); toggle smooth/flat
  normals; toggle wireframe.
- Exercise: E2 (build the pyramid). Hardest one — budget time or walk it.
- Common Q: *"why is my face invisible?"* → winding order / back-face culling.

**03 Materials.**
- Talking points: the material ladder Basic→Lambert→Standard→Physical; PBR
  metalness/roughness.
- Demo cue: Standard material, metalness 1 + roughness 0 (mirror) → roughness 1
  (diffuse). Switch to Basic to show it ignores lights.

**04 Lighting.**
- Demo cue: turn everything off, add one directional light, move it, watch the
  shadow swing. Then flip on IBL — "notice realism jump."
- Common Q: *"why is everything black?"* → no lights, or a Basic/Normal material,
  or missing normals.

**05 Cameras.**
- Demo cue: FOV 10 vs 120 (dolly-zoom feel); switch perspective→ortho; push near
  to 0.001 + far to 100000 → z-fighting. Point at the inset frustum view.

**06 three.js vanilla.**
- This is the integration moment. Walk `main.ts` section by section (it's
  numbered 1–11). Emphasise the render loop + delta time + dispose hygiene.

**07 React Three Fiber.**
- Put 06's loop next to 07's JSX. "Same renderer, same scene — different authoring
  model." `useFrame` replaces the manual loop; `<mesh>` = `new THREE.Mesh`.
- Exercise: E3 (convert the box snippet to JSX).
- Common Q: *"when do I use R3F vs vanilla?"* → R3F when the app is React; vanilla
  for tight engine control or non-React hosts.

**08 Point cloud (the climax).**
- Demo cue: open 08, orbit the 1M-point terrain, toggle size attenuation (flat
  smear → readable depth), step 100k→1M and read the FPS counter.
- Frame it as the lab's real work. Skim the take-home doc's TSL section; don't
  try to teach all of TSL live.
- If WebGPU is missing: narrate the fallback, show the backup recording.

## Mixed-audience tips

- Advanced interns racing ahead: point them at the **Optional advanced** section
  in each doc and the exercises' solution files to compare approaches.
- Anyone stuck: the GUI playgrounds mean no one is blocked on typing — they can
  always explore the finished example while you help.
