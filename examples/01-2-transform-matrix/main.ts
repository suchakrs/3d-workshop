/**
 * Example 01-2 — Transform matrices: drag the gizmo, read the matrix
 * ==================================================================
 * A transform (position + rotation + scale) is stored as a single 4×4 matrix.
 * Here you manipulate an object with a TransformControls gizmo and watch that
 * matrix update live, so the numbers stop being abstract:
 *
 *   • translate → only the 4th column (the translation vector) changes
 *   • rotate / scale → only the upper-left 3×3 block changes
 *   • nesting under a moved parent → world matrix = parent · local
 *
 * Self-contained (full boilerplate inline), like the other vanilla examples.
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import GUI from "lil-gui";

// --- Renderer ---------------------------------------------------------------
const canvas = document.getElementById("c") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// --- Scene + camera ---------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e14);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(4, 3, 6);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AxesHelper(2));
const grid = new THREE.GridHelper(10, 10, 0x444466, 0x333344);
scene.add(grid);

// --- Hero object + parent group (for the nesting demo) ----------------------
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshNormalMaterial(),
);

// A parent group placed off-origin and rotated, so that when we nest the mesh
// under it, the WORLD matrix visibly differs from the LOCAL matrix.
const parent = new THREE.Group();
parent.position.set(-2, 0, 1);
parent.rotation.y = Math.PI / 4;
const parentHelper = new THREE.AxesHelper(1.2);
parent.add(parentHelper);
parent.visible = false; // shown only while nested
scene.add(parent);

scene.add(mesh); // starts un-nested (parented to the scene)

// --- Controls ---------------------------------------------------------------
const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true;

const gizmo = new TransformControls(camera, renderer.domElement);
gizmo.attach(mesh);
gizmo.setMode("translate");
// r169+: TransformControls is a `Controls`, not an Object3D — add its helper.
scene.add(gizmo.getHelper());

// Don't let orbiting fight the gizmo: disable OrbitControls while dragging.
gizmo.addEventListener("dragging-changed", (e) => {
  orbit.enabled = !(e as unknown as { value: boolean }).value;
});

// --- GUI --------------------------------------------------------------------
const params = {
  mode: "translate" as "translate" | "rotate" | "scale",
  space: "world" as "world" | "local",
  snap: false,
  nested: false,
  showWorld: false,
  reset: () => {
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
  },
};

const modeEl = document.getElementById("mode") as HTMLElement;

function setMode(m: typeof params.mode): void {
  params.mode = m;
  gizmo.setMode(m);
  modeEl.textContent = m;
}

const gui = new GUI({ title: "01-2 · Transform" });
gui.add(params, "mode", ["translate", "rotate", "scale"]).name("gizmo mode").onChange(setMode).listen();
gui
  .add(params, "space", ["world", "local"])
  .name("space")
  .onChange((s: "world" | "local") => gizmo.setSpace(s))
  .listen();
gui.add(params, "snap").name("snapping").onChange((on: boolean) => {
  gizmo.setTranslationSnap(on ? 0.5 : null);
  gizmo.setRotationSnap(on ? THREE.MathUtils.degToRad(15) : null);
  gizmo.setScaleSnap(on ? 0.25 : null);
});
gui.add(params, "nested").name("nest under parent").onChange((on: boolean) => {
  parent.visible = on;
  // Re-parent the mesh while preserving its current local values. We keep the
  // local transform identical so the local matrix stays the same and only the
  // WORLD matrix changes — that's the lesson.
  if (on) parent.add(mesh);
  else scene.add(mesh);
});
gui.add(params, "showWorld").name("show world matrix");
gui.add(params, "reset").name("reset transform");

// --- Keyboard shortcuts (Blender/Unity-style) -------------------------------
window.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case "w": setMode("translate"); break;
    case "e": setMode("rotate"); break;
    case "r": setMode("scale"); break;
    case "q":
      params.space = params.space === "world" ? "local" : "world";
      gizmo.setSpace(params.space);
      break;
  }
});

// --- Matrix readout panel ---------------------------------------------------
const matEl = document.getElementById("mat") as HTMLTableElement;
const decompEl = document.getElementById("decomp") as HTMLElement;
const whichEl = document.getElementById("which") as HTMLElement;

// Build a 4×4 grid of <td> cells once; we update textContent each frame.
const cells: HTMLTableCellElement[][] = [];
for (let r = 0; r < 4; r++) {
  const tr = document.createElement("tr");
  const row: HTMLTableCellElement[] = [];
  for (let c = 0; c < 4; c++) {
    const td = document.createElement("td");
    tr.appendChild(td);
    row.push(td);
  }
  matEl.appendChild(tr);
  cells.push(row);
}

const decompKeys = ["position", "rotation°", "quaternion", "scale"];
const decompVals: HTMLElement[] = decompKeys.map((k) => {
  const key = document.createElement("div");
  key.className = "k";
  key.textContent = k;
  const val = document.createElement("div");
  val.className = "v";
  decompEl.appendChild(key);
  decompEl.appendChild(val);
  return val;
});

const f = (n: number) => (Object.is(n, -0) ? 0 : n).toFixed(2).padStart(6, " ");
const euler = new THREE.Euler();

function updatePanel(): void {
  // three.Matrix4 is COLUMN-MAJOR: elements[col*4 + row]. We show it in the
  // conventional row-major math layout, so element(row, col) = e[col*4 + row].
  const m = params.showWorld ? mesh.matrixWorld : mesh.matrix;
  const e = m.elements;

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const td = cells[r][c];
      td.textContent = f(e[c * 4 + r]);
      // Highlight the part the active mode drives (only meaningful on local).
      const isTranslationCol = c === 3 && r < 3;
      const isLinear3x3 = r < 3 && c < 3;
      td.className = "";
      if (params.showWorld) continue;
      if (params.mode === "translate" && isTranslationCol) td.classList.add("hl-trans");
      if ((params.mode === "rotate" || params.mode === "scale") && isLinear3x3)
        td.classList.add("hl-rs");
    }
  }

  const p = mesh.position;
  euler.copy(mesh.rotation);
  const q = mesh.quaternion;
  const s = mesh.scale;
  decompVals[0].textContent = `${f(p.x)} ${f(p.y)} ${f(p.z)}`;
  decompVals[1].textContent = `${f(THREE.MathUtils.radToDeg(euler.x))} ${f(THREE.MathUtils.radToDeg(euler.y))} ${f(THREE.MathUtils.radToDeg(euler.z))}`;
  decompVals[2].textContent = `${f(q.x)} ${f(q.y)} ${f(q.z)} ${f(q.w)}`;
  decompVals[3].textContent = `${f(s.x)} ${f(s.y)} ${f(s.z)}`;

  whichEl.textContent = params.showWorld
    ? params.nested
      ? "world = parent · local (nested under a moved/rotated parent)"
      : "world = local (no parent transform yet — enable “nest under parent”)"
    : params.mode === "translate"
      ? "translate → 4th column = translation vector"
      : "rotate / scale → upper-left 3×3 = rotation·scale";
}

// --- Resize + loop ----------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate(): void {
  requestAnimationFrame(animate);
  orbit.update();
  mesh.updateMatrixWorld(); // keep matrixWorld current for the readout
  updatePanel();
  renderer.render(scene, camera);
}
animate();
