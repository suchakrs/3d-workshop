# 01-2 · Transform matrices — drag the gizmo, read the matrix

> A companion to [01 · 3D space & transforms](./01-3d-space-and-transforms.md).
> Topic 01 used sliders; here you grab the object directly with a **gizmo** and
> watch the underlying **4×4 matrix** change in real time. The goal: make the
> matrix concrete instead of scary.

## Concept — one matrix holds the whole transform

Position, rotation, and scale aren't stored separately on the GPU — they're
**baked into a single 4×4 matrix** per object. That matrix transforms every
vertex of the object from its own local space into its parent's space.

Its anatomy (conventional math layout, row × column):

```
        col0  col1  col2   col3
       ┌                        ┐
 row0  │  .     .     .   │  Tx │   ← upper-left 3×3  = rotation · scale
 row1  │     3×3 block    │  Ty │     (the "linear" part: how axes are
 row2  │  .     .     .   │  Tz │      rotated and stretched)
 row3  │  0     0     0      1  │   ← 4th column = translation (Tx,Ty,Tz)
       └                        ┘
```

- **Translate** the object → only the **4th column** changes.
- **Rotate or scale** → only the **upper-left 3×3 block** changes.
- The bottom row stays `0 0 0 1` for an ordinary (affine) transform.

The single matrix is the composition **M = T · R · S** — translation times
rotation times scale, applied right-to-left to a vertex (scale first, then
rotate, then translate). That ordering is *why* the slider order in topic 01
mattered.

### Column-major storage (a gotcha worth knowing)

three.js (like OpenGL/WebGPU) stores the matrix **column-major** in a flat array:
`matrix.elements[col * 4 + row]`. So `elements[12]`, `[13]`, `[14]` are the
translation `Tx, Ty, Tz` — *not* `[3], [7], [11]`. The panel in this example
displays the matrix in the readable row-major layout above, reading
`element(row, col) = elements[col*4 + row]`.

## The playground

A **TransformControls gizmo** is attached to the cube. Drag its arrows / rings /
handles to move, rotate, or scale. The bottom-left panel shows:

- The live **local matrix** (4×4). The cells the current mode drives are
  highlighted — blue for the translation column (move), green for the 3×3
  (rotate/scale).
- The **decomposition**: position, Euler rotation (degrees), quaternion, scale —
  the same transform read three different ways.

GUI controls (top-right) and keyboard shortcuts:

| Control | Key | What it does |
|---------|-----|--------------|
| gizmo mode | `W` / `E` / `R` | translate / rotate / scale |
| space | `Q` | world axes vs the object's local axes |
| snapping | — | quantise to 0.5 unit / 15° / 0.25 scale steps |
| nest under parent | — | re-parent the cube under a moved + rotated group |
| show world matrix | — | display `matrixWorld` instead of the local `matrix` |
| reset transform | — | back to identity (pos 0, rot 0, scale 1) |

OrbitControls automatically pauses while you drag the gizmo, so the camera and
the gizmo never fight.

## Try this

1. **Watch the translation column.** In translate mode, drag the cube along X.
   Only the top-right cell (`Tx`) moves. Switch to rotate mode (`E`) and twist —
   now the 3×3 block churns and the translation column sits still.
2. **Identity vs transformed.** Hit *reset*. The matrix becomes the identity
   (1s on the diagonal, 0s elsewhere) — "do nothing." Every transform is a
   departure from identity.
3. **Scale shows up on the diagonal.** Reset, scale mode (`R`), scale uniformly.
   Watch the 3×3 diagonal grow from 1 toward your scale factor.
4. **Euler vs quaternion.** Rotate and compare the two rotation readouts — the
   degrees are human-readable; the quaternion is what three actually stores
   (no gimbal lock). Same rotation, two encodings.
5. **World = parent · local.** Toggle *show world matrix*, then toggle *nest
   under parent*. The local matrix is unchanged, but the world matrix now folds
   in the parent's offset and 45° rotation: `M_world = M_parent · M_local`.
   This is the parent-child composition from topic 01, shown in numbers.
6. **Local vs world space.** Rotate the cube ~45°, then press `Q` to switch the
   gizmo to *local* space. The arrows now follow the cube's tilted axes instead
   of the world axes.

## Gotchas

- **Column-major indexing.** Translation is `elements[12..14]`. Reaching for
  `[3]`,`[7]`,`[11]` is the classic mistake.
- **`matrixWorld` is stale until updated.** It's refreshed during render (or via
  `object.updateMatrixWorld()`); reading it right after setting `position`
  without an update gives last frame's value.
- **Order matters.** `M = T·R·S`. Building it as `S·R·T` (or applying rotation
  after translation) puts the object somewhere you didn't intend — the same
  "rotate-then-move vs move-then-rotate" lesson from topic 01.
- **Non-uniform scale + rotation** can shear normals; that's why lighting can
  look wrong on stretched-then-rotated objects (relevant later in
  [04 · lighting](./04-lighting.md)).

## Optional advanced

- **`Matrix4.compose(position, quaternion, scale)`** builds the matrix from the
  three parts; **`.decompose(...)`** splits it back. That round-trip is exactly
  what the panel visualises.
- **`object.matrix` vs `object.matrixWorld`** — local (relative to parent) vs
  world (absolute). The scene graph multiplies them down the tree every frame.
- **`matrixAutoUpdate`** — on by default, three rebuilds `matrix` from
  position/quaternion/scale each frame. Turn it off and call `updateMatrix()`
  yourself for static objects to save work.
- The same machinery scales up: the camera's **view** and **projection** are
  also 4×4 matrices (see [05 · cameras](./05-cameras.md)).

## Next

→ Back to [02 · modeling & topology](./02-modeling-and-topology.md) — now that you
can place and orient an object precisely, we shape the object itself.
