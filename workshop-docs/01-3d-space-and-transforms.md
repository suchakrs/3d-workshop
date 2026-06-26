# 01 · 3D Space & Transforms

## 1. Concepts

### Right-handed coordinate system

Three.js uses a **right-handed** system:

```
        +Y
        |
        |_____ +X
       /
      / +Z  (towards you)
```

Point your right hand's fingers along **+X**, curl them towards **+Y** — your thumb points **+Z** (out of the screen). Rotations follow the right-hand rule: wrap your thumb around the positive axis, fingers curl in the positive rotation direction.

### The transform trio — T · R · S

Every object has three transforms applied in this order:

1. **Scale (S)** — stretch/shrink along local axes
2. **Rotation (R)** — spin around local axes (after scale)
3. **Translation (T)** — move to final position (after rotate)

Three.js composes these into a 4×4 matrix (`object.matrix`). Changing `position`, `rotation`, or `scale` marks the matrix dirty; it is recomposed each frame.

### Local vs world space

- **Local space** — coordinates relative to the object's own origin and axes.
- **World space** — coordinates in the shared scene coordinate system.

`object.position` is always in the **parent's** local space. To get the world position call:

```ts
const worldPos = new THREE.Vector3();
mesh.getWorldPosition(worldPos);
```

### Parent–child matrix chain

When you nest `child` under `parent`:

```
child.matrixWorld = parent.matrixWorld × child.matrix
```

Any rotation/translation/scale applied to the parent propagates automatically to all children. That's why enabling the **Parent Group** toggle and rotating the group makes the cube orbit: the cube's local offset (`x = 2`) is rotated around the group's world origin.

### Euler angles & gimbal lock

Euler angles describe orientation as three sequential rotations around axes. The order matters — `XYZ` means: first rotate around X, then around the new Y, then around the new Z. Different orders produce different results for the same three angles.

**Gimbal lock** occurs when two rotation axes align (after one rotation), collapsing three degrees of freedom into two. Symptom: certain rotations become impossible without a large sudden flip.

### Quaternions

A quaternion (`THREE.Quaternion`) stores orientation as a 4-component unit vector. It has no axis-alignment issue and interpolates smoothly (`slerp`). Three.js keeps `mesh.quaternion` and `mesh.rotation` in sync — change either and the other updates.

---

## 2. The playground

| GUI control | What it does |
|---|---|
| **Position x/y/z** | Translates mesh along world axes (slider −5 … +5) |
| **Rotation x/y/z (deg)** | Sets `mesh.rotation` in degrees; converted to radians internally |
| **Euler order** | Changes `mesh.rotation.order` — try XYZ vs ZYX with the same x/y/z values |
| **Scale x/y/z** | Stretches mesh; notice normals (colour faces) distort with non-uniform scale |
| **Enable parent group** | Nests mesh under a `THREE.Group`; mesh sits at local offset (2, 0, 0) |
| **Group speed** | Sets how fast the group rotates (used once you solve E1) |

**AxesHelper** — red = X, green = Y, blue = Z.  
**GridHelper** — lies flat on the XZ plane (y = 0).

---

## 3. Try this

### 3a · Euler order matters
1. Set **Rotation x = 90°**, leave y = z = 0. Note the result.
2. Reset all to 0.
3. Set **Rotation y = 90°**, then x = 90°.
4. Compare with step 1 — the cube ends up in a different orientation even though "x=90, y=90" is used in both cases. Order of application differs → different result.

### 3b · Solve E1 — child orbits parent
1. Enable **Parent Group**.
2. Open `examples/01-space-transforms/main.ts`.
3. Find the `// TODO (E1)` comment inside `animate()`.
4. Add the one line from the hint: `group.rotation.y += dt * params.groupSpeed;`
5. Save — the cube should orbit around the group origin.
6. Check `main.solution.ts` if stuck.

### 3c · Non-uniform scale & normals
1. Set **Scale x = 3**, leave y = z = 1.
2. Notice the face colours (MeshNormalMaterial visualises vertex normals). With non-uniform scale, normals need a corrected **normal matrix** — `MeshNormalMaterial` handles this, but custom shaders need `mat3(transpose(inverse(modelMatrix)))`.

---

## 4. Gotchas

- **Degrees vs radians** — Three.js `Euler` stores radians. The GUI uses degrees for readability; always convert with `THREE.MathUtils.degToRad()`.
- **Rotation order** — set `mesh.rotation.order` *before* assigning x/y/z; changing order after doesn't reinterpret the stored values.
- **Gimbal lock** — at 90° on one axis you lose a degree of freedom. Switch to quaternion workflow (`mesh.quaternion.setFromEuler(...)`) for smooth programmatic animation.
- **`position` is local** — after nesting under a group, `mesh.position` is relative to the group, not the world. Use `getWorldPosition()` for world coordinates.
- **Matrix auto-update** — by default Three.js calls `updateMatrixWorld()` each frame. If you manually manipulate matrices, set `object.matrixAutoUpdate = false` and call `updateMatrix()` yourself.

---

## 5. Optional advanced — matrix composition

Read the raw world matrix of any object:

```ts
mesh.updateMatrixWorld();
console.log(mesh.matrixWorld.elements); // column-major Float32Array[16]
```

Compose manually from position/quaternion/scale:

```ts
const m = new THREE.Matrix4();
m.compose(mesh.position, mesh.quaternion, mesh.scale);
```

Decompose back:

```ts
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const scl = new THREE.Vector3();
mesh.matrixWorld.decompose(pos, quat, scl);
```

This is exactly what Three.js does internally every frame when `matrixAutoUpdate = true`.

---

## 6. Next

**→ [02 · Modeling & Topology](./02-modeling-and-topology.md)**

Now that you can place and transform objects, the next page explores how 3D geometry is actually built — vertices, faces, normals, and UV coordinates. You'll reshape the cube itself using BufferGeometry manipulation, which is the foundation for procedural meshes and imported models.
