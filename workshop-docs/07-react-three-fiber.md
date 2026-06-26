# 07 · React Three Fiber

## 1. Concept

R3F is a React renderer for three.js. JSX elements map directly to three.js objects:

```jsx
<mesh>              →  new THREE.Mesh()
<boxGeometry />     →  new THREE.BoxGeometry()   (auto-attached as .geometry)
<meshStandardMaterial /> → new THREE.MeshStandardMaterial()  (auto-attached as .material)
```

**Key ideas:**

- **`args`** — constructor arguments array: `<boxGeometry args={[1,2,3]} />` ≡ `new BoxGeometry(1,2,3)`.
- **`attach`** — override which property is assigned: `<color attach="background" />` sets `scene.background`.
- **`useFrame((_state, delta) => { ... })`** — runs every frame inside the reconciler. Replaces the manual `requestAnimationFrame` loop.
- **`useThree()`** — access `{ scene, camera, renderer, gl }` from any component inside `<Canvas>`.
- **drei** — utility components built on R3F: `<OrbitControls>`, `<Environment>`, `<Text>`, loaders, helpers.
- **leva** — drop-in GUI for R3F apps. `useControls()` returns reactive values; no imperative `gui.add()` calls.

## 2. Vanilla vs R3F

**Vanilla (example 06 — imperative):**
```js
const mesh = new THREE.Mesh(geo, mat);
mesh.position.set(-2.5, 0, 0);
scene.add(mesh);

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
```

**R3F (this example — declarative):**
```jsx
function SpinningMesh() {
  const ref = useRef();
  useFrame((_, delta) => { ref.current.rotation.y += speed * delta; });
  return (
    <mesh ref={ref} position={[-2.5, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={0xff6688} />
    </mesh>
  );
}
```

**When to use which:**
- R3F: React apps, component reuse, reactive state, complex UIs alongside 3D.
- Vanilla: raw performance budgets, non-React stacks, WebGPU experiments without abstractions, learning three.js internals.

## 3. The Playground

Open `http://localhost:5173/examples/07-react-three-fiber/` after `npm run dev`.

The **leva panel** (top-right) exposes:
| Control | Effect |
|---------|--------|
| `speed` | Hero knot Y-rotation speed (rad/s) |
| `wireframe` | Toggle wireframe on the hero knot |

**E3 Exercise:** `App.tsx` has a TODO gap where box mesh A should be. Convert the vanilla snippet in the comment to JSX. Check your answer against `App.solution.tsx`.

## 4. Try This

1. **Add a mesh:** Inside `<Canvas>` in `App.tsx`, add:
   ```jsx
   <mesh position={[0, 2, 0]}>
     <icosahedronGeometry args={[0.5, 1]} />
     <meshStandardMaterial color="hotpink" />
   </mesh>
   ```
   Save — it appears instantly (HMR).

2. **Do the E3 conversion:** Replace the TODO comment in `App.tsx` with the box JSX. The missing red box will appear on the left. Verify against `App.solution.tsx`.

3. **Wire a leva control to colour:** Add `color: '#6699ff'` to `useControls` and pass it to `meshStandardMaterial`.

## 5. Gotchas

- **Don't `new` inline.** `<meshStandardMaterial color={new THREE.Color(0xff0000)} />` creates a new object every render. Use hex numbers, strings, or `useMemo`.
- **`args` is the constructor call.** Wrong arg count = silent wrong geometry. Check three.js docs for constructor signatures.
- **Refs for imperative escapes.** `useFrame` needs a ref to mutate the object; never call `setState` inside `useFrame` (causes re-renders every frame).
- **Reconciler re-renders ≠ three.js re-renders.** React re-renders update the R3F tree; the WebGL render loop runs independently via `useFrame`.
- **`shadow-mapSize`** is R3F's camelCase-to-dash prop syntax for nested properties (`light.shadow.mapSize`). Accepts `[w, h]` tuple.

## 6. Optional Advanced

- **`extend`** — register custom materials (e.g., TSL/WebGPU node materials) so they work as JSX tags. Forward pointer: see `./08-pointcloud-webgpu-tsl.md`.
- **`<Instances>`** — render thousands of identical meshes efficiently via instancing (drei helper).
- **Drei ecosystem** — `<Environment>`, `<Reflector>`, `<MeshTransmissionMaterial>`, `<Html>`, `<Stats>`, and 100+ more.
- **When NOT to use R3F:** Pure WebGPU compute shaders, headless rendering pipelines, projects with no React, or contexts where the reconciler overhead matters at scale.

## 7. Next

→ [08 · Point Cloud + WebGPU + TSL](./08-pointcloud-webgpu-tsl.md) — swap the hero object for a 1-million-point 3D scan, rendered with a custom TSL node material on the WebGPU backend.
