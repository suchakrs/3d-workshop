# 04 · Lighting

## 1. Concepts

### Light types and physical analogues

| Type | Physical analogue | Key trait |
|---|---|---|
| **AmbientLight** | Light bounced so many times direction is lost | No direction, no shadow, flat fill |
| **HemisphereLight** | Open sky — bright above, dim/coloured below | Two-colour gradient: sky ↔ ground |
| **DirectionalLight** | Sun — rays are parallel, source "infinitely" far | Constant intensity, hard shadows |
| **PointLight** | Bare bulb | Radiates all directions; falls off with `distance` and `decay` |
| **SpotLight** | Stage spotlight / flashlight | Cone defined by `angle`; soft edge via `penumbra` |

### Direct light vs ambient/IBL

Direct lights (Directional, Point, Spot) cast from a specific direction and produce specular highlights and shadows. Ambient and Hemisphere lights represent **indirect light** — the sum of bounced light in the scene.

**Image-Based Lighting (IBL)** is a step up: `scene.environment` holds a pre-filtered HDR cube map (generated here from `RoomEnvironment` via `PMREMGenerator`). Both diffuse and specular reflections sample this map, giving PBR materials realistic reflections without placing extra lights.

### Shadow maps

Three.js shadow maps work by doing an extra render pass from the light's point of view, storing depth into a texture. When the main camera renders, each fragment checks whether it's deeper than what the light "saw" — if yes, it's in shadow.

- **`shadow.mapSize`** — larger = crisper shadows, more VRAM.
- **`shadow.bias`** — small negative value (e.g. `-0.001`) corrects shadow acne (self-shadowing artefact caused by floating-point precision).
- **Cost** — every shadow-casting light adds a full render pass. Keep shadow-casters to a minimum in performance-sensitive scenes.

---

## 2. The playground

Open the lil-gui panel (top-right). Each light has its own folder:

| Control | Effect |
|---|---|
| `enabled` | Toggles `light.visible` |
| `intensity` | Brightness multiplier |
| `color` / `skyColor` / `groundColor` | Light colour |
| `position x/y/z` | World-space position (not Directional direction — its shadow camera follows) |
| `cast shadow` | Per-light shadow toggle (only Directional + Spot) |
| `show helper` | Draws a wireframe gizmo for that light |
| `distance` (Point) | Range at which intensity reaches zero |
| `decay` (Point) | Power law falloff — 2 = physically correct |
| `angle` (Spot) | Half-angle of the cone in radians |
| `penumbra` (Spot) | 0 = hard edge, 1 = fully soft |

**Global** folder:
- **shadows enabled** — toggles `renderer.shadowMap.enabled` (+ all per-light `castShadow` flags).
- **environment / IBL** — generates a `PMREMGenerator` texture from `RoomEnvironment` and assigns it to `scene.environment`.

---

## 3. Try this

1. **Shadow anatomy** — disable everything except Directional. Move its `position x/y/z` sliders and watch the shadow swing across the ground plane.

2. **IBL jump** — enable environment/IBL with only Ambient at low intensity. Note how the hero's metallic sheen suddenly reads as reflective — that's the environment map being sampled by `MeshStandardMaterial`.

3. **Spot soft edge** — enable Spot, disable others. Crank `angle` up to ~0.6, then slowly raise `penumbra` from 0 → 1 and watch the cone boundary blur.

4. **Hemisphere gradient** — enable only Hemisphere. Change `sky color` to a warm orange and `ground color` to deep blue. The hero's top/bottom reads completely differently.

5. **Performance cost** — enable both Directional and Spot `cast shadow`. Watch the shadow map texture flicker as you move the lights — two depth passes per frame.

---

## 4. Gotchas

- **MeshBasicMaterial / MeshNormalMaterial ignore lights entirely.** Switch to `MeshStandardMaterial` or `MeshPhongMaterial` to see any direct lighting.
- **Shadow acne** — dark self-shadowing stripes on surfaces facing the light. Fix with `light.shadow.bias = -0.001` (or slightly lower).
- **Each shadow-casting light = one full render pass.** Two shadow lights → three total renders per frame (scene + 2 depth passes). Budget accordingly.
- **Ambient alone looks flat** — it adds equal light to all faces, removing depth cues. Pair it with at least one directional or hemisphere light.
- **SpotLightHelper needs `helper.update()`** after moving the spot or its target — call it every frame when visible.

---

## 5. Optional advanced

- **LightProbe** — samples irradiance from a cube camera in the scene; more accurate than Hemisphere for indoor lighting.
- **RectAreaLight** — rectangular emissive surface (fluorescent panel, TV screen). Requires `RectAreaLightHelper` from addons and `RectAreaLightUniformsLib.init()`.
- **Baked lighting** — pre-compute shadows and GI into lightmap textures offline (Blender, Bakery). Zero runtime cost; no dynamic shadows.
- **Shadow cascades (CSM)** — split the view frustum into zones, each with its own shadow map. Keeps near shadows sharp without inflating map size. See `three/addons/csm/CSM.js`.

---

## 6. Next

Scene is lit — now choose how we look at it.

→ [05 · Cameras](./05-cameras.md)
