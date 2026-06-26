# 03 · Materials

## 1. Concept

A **material** = a shader + parameters. Three.js ships a ladder of built-in materials, each more expensive but more realistic than the last.

### The material ladder

| Material | Lighting | Cost | Use when |
|---|---|---|---|
| `MeshBasicMaterial` | **None** — ignores all lights | Cheapest | Wireframes, debug, UI quads |
| `MeshLambertMaterial` | Diffuse only (vertex-based) | Low | Stylised / low-poly scenes |
| `MeshStandardMaterial` | Full **PBR** (metalness / roughness) | Medium | Production default |
| `MeshPhysicalMaterial` | PBR + clearcoat / transmission / sheen | Higher | Glass, car paint, fabric |

### PBR intuition

**Metalness** — 0 = dielectric (plastic, stone, skin); 1 = metal. Metals have no diffuse; all energy goes into specular.

**Roughness** — 0 = mirror-perfect surface; 1 = fully diffuse (rough stone). Controls the *spread* of specular reflections.

Try: metalness 1 + roughness 0 → chrome mirror. Roughness 0.5 → brushed metal. Metalness 0 + roughness 1 → matte clay.

### Texture map types

| Map | Property | Color space | Purpose |
|---|---|---|---|
| Albedo | `map` | **sRGB** | Base colour |
| Normal | `normalMap` | Linear | Surface micro-detail |
| Roughness | `roughnessMap` | Linear | Per-texel roughness |
| Metalness | `metalnessMap` | Linear | Per-texel metalness |
| Emissive | `emissiveMap` | sRGB | Self-illumination |
| AO | `aoMap` | Linear | Ambient occlusion |

> **Rule:** albedo and emissive maps live in sRGB space — set `texture.colorSpace = THREE.SRGBColorSpace`. All *data* maps (normal, roughness, metalness, AO) stay linear.

### Transparency

Set `transparent: true` **and** `opacity < 1`. Transparent objects must render *after* opaque ones — use `mesh.renderOrder` or sort manually. `depthWrite: false` on glass helps avoid z-fighting.

---

## 2. The playground

Open the GUI panel (top-right).

| Control | What to watch |
|---|---|
| **Material type** | Switch Basic → Lambert → Standard. Notice lights suddenly matter at Lambert. |
| **Color** | Raw hue of the surface. Basic shows it flat; Standard tints the PBR response. |
| **Metalness** | 0 = paint-like diffuse. 1 = full specular, no diffuse. |
| **Roughness** | 0 → tight bright highlight. 1 → soft even shading. |
| **Emissive** + intensity | Adds glow regardless of lights. Crank intensity past 1 for bloom-ready surfaces. |
| **Opacity + Transparent** | Fade the mesh. Needs `transparent: true` to take effect. |
| **Wireframe** | Reveals the TorusKnot tessellation — why high segment counts matter for smooth PBR. |
| **Clearcoat** (Physical only) | Lacquer layer on top. Stack metalness 1 + roughness 0.3 + clearcoat 1 → car paint. |
| **Albedo map** | Checkerboard replaces flat colour. Watch it interact with PBR shading. |
| **Roughness map** | Checkerboard modulates roughness per-pixel — alternating shiny / matte patches. |

---

## 3. Try this

1. **Chrome vs brushed metal** — Set Standard, metalness 1. Drag roughness from 0 → 1 and watch the reflection sharpen into a mirror, then smear into a diffuse.
2. **Car paint** — Switch to Physical. metalness 0.2, roughness 0.3, color deep red, clearcoat 1, clearcoatRoughness 0.05.
3. **Ghost material** — Set Standard, color white, opacity 0.15, transparent on. Orbit to see the inner surface of the knot showing through.

---

## 4. Gotchas

- **Basic and Normal ignore lights.** MeshBasicMaterial renders the raw `color` with no shading. MeshNormalMaterial visualises normals as RGB. Neither responds to DirectionalLight or AmbientLight.
- **Transparency sorting artifacts.** When two transparent meshes overlap, the draw order matters. Three.js sorts by distance but doesn't split geometries — complex self-intersecting shapes like a torus knot will show artifacts. Use `depthWrite: false` to mitigate.
- **sRGB vs linear color space.** Set `texture.colorSpace = THREE.SRGBColorSpace` only for albedo / emissive maps. Setting it on a roughness or normal map corrupts the data — roughness will look wrong, normals will pop.
- **`needsUpdate = true`** must be set after changing map assignments or `transparent`. Changing a uniform (color, roughness) does not need it — those update automatically.
- **Dispose old materials.** Swapping materials without calling `oldMaterial.dispose()` leaks GPU memory. Same for textures.

---

## 5. Optional advanced

### `onBeforeCompile` — custom GLSL injection

Three.js materials compile to GLSL at runtime. You can intercept and patch the shader:

```ts
const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
mat.onBeforeCompile = (shader) => {
  // Inject a uniform
  shader.uniforms.uTime = { value: 0 };
  // Prepend a declaration to the fragment shader
  shader.fragmentShader = `uniform float uTime;\n` + shader.fragmentShader;
  // Replace a chunk
  shader.fragmentShader = shader.fragmentShader.replace(
    `#include <color_fragment>`,
    `#include <color_fragment>
     diffuseColor.rgb *= 0.5 + 0.5 * sin(uTime + vUv.x * 10.0);`
  );
};
```

> Store `shader.uniforms` reference to update `uTime` each frame in the loop.

### TSL / Node materials (three@r163+)

Example 08 covers **Three.js Shading Language** — a TypeScript-native node graph that replaces GLSL strings with composable JS functions:

```ts
import { MeshStandardNodeMaterial, color, sin, timerLocal } from "three/tsl";
const mat = new MeshStandardNodeMaterial();
mat.colorNode = color(0xff0000).mul(sin(timerLocal()).abs());
```

No GLSL strings, full type safety, tree-shakeable. Forward pointer → `./08-tsl-materials.md`.

---

## 6. Next

**[04 · Lighting →](./04-lighting.md)** — the material reacts to light — now let's control the light.
