import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VertexNormalsHelper } from "three/addons/helpers/VertexNormalsHelper.js";
import GUI from "lil-gui";
import { buildPyramid } from "./pyramid";

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------
const canvas = document.getElementById("c") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e14);

// ---------------------------------------------------------------------------
// Lights
// ---------------------------------------------------------------------------
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
dirLight.position.set(4, 8, 5);
scene.add(dirLight);

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
camera.position.set(3, 2.5, 4);
camera.lookAt(0, 0, 0);

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// ---------------------------------------------------------------------------
// Material (shared, mutated by GUI)
// ---------------------------------------------------------------------------
const material = new THREE.MeshStandardMaterial({
  color: 0x6699ff,
  side: THREE.DoubleSide, // helps spot winding issues
});

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
type GeomName = "Box" | "Sphere" | "Torus" | "Custom pyramid";

const params = {
  geometry: "Box" as GeomName,
  segments: 4,
  wireframe: false,
  smoothNormals: true,
  showNormals: false,
  indexed: true,
  autoRotate: true,
};

// DOM readout elements
const elVerts = document.getElementById("stat-verts") as HTMLElement;
const elTris = document.getElementById("stat-tris") as HTMLElement;
const elIndexed = document.getElementById("stat-indexed") as HTMLElement;

// ---------------------------------------------------------------------------
// Geometry factory
// ---------------------------------------------------------------------------
function makeBaseGeometry(): THREE.BufferGeometry {
  const s = params.segments;
  switch (params.geometry) {
    case "Box":
      return new THREE.BoxGeometry(1.5, 1.5, 1.5, s, s, s);
    case "Sphere":
      return new THREE.SphereGeometry(1, Math.max(3, s * 2), Math.max(2, s));
    case "Torus":
      return new THREE.TorusGeometry(1, 0.4, Math.max(3, s), Math.max(3, s * 2));
    case "Custom pyramid":
      return buildPyramid();
  }
}

function applyNormalsMode(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (params.smoothNormals) {
    geo.computeVertexNormals();
    return geo;
  } else {
    // Flat shading: duplicate verts so each face has independent normals
    const flat = geo.toNonIndexed();
    flat.computeVertexNormals();
    return flat;
  }
}

function applyIndexedToggle(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!params.indexed && geo.index !== null) {
    return geo.toNonIndexed();
  }
  return geo;
}

// ---------------------------------------------------------------------------
// Mesh + normals helper setup
// ---------------------------------------------------------------------------
let currentGeo: THREE.BufferGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5, 4, 4, 4);
currentGeo.computeVertexNormals();

const mesh = new THREE.Mesh(currentGeo, material);
scene.add(mesh);

let normalsHelper: VertexNormalsHelper | null = null;

function refreshNormalsHelper(): void {
  if (normalsHelper) {
    scene.remove(normalsHelper);
    normalsHelper.dispose();
    normalsHelper = null;
  }
  if (params.showNormals) {
    normalsHelper = new VertexNormalsHelper(mesh, 0.15, 0xff4444);
    scene.add(normalsHelper);
  }
}

function updateReadout(): void {
  const geo = mesh.geometry;
  const pos = geo.attributes["position"] as THREE.BufferAttribute;
  const idx = geo.index;
  const vertCount = pos.count;
  const triCount = idx ? idx.count / 3 : vertCount / 3;
  elVerts.textContent = String(vertCount);
  elTris.textContent = String(triCount);
  elIndexed.textContent = idx ? "Indexed geometry" : "Non-indexed geometry";
}

function rebuildGeometry(): void {
  // Dispose old
  currentGeo.dispose();

  let geo = makeBaseGeometry();

  // Normals mode (smooth keeps index, flat strips it via toNonIndexed)
  geo = applyNormalsMode(geo);

  // Indexed toggle (only meaningful if still indexed after normals step)
  geo = applyIndexedToggle(geo);

  currentGeo = geo;
  mesh.geometry = currentGeo;

  refreshNormalsHelper();
  updateReadout();
}

// Initial readout
updateReadout();

// ---------------------------------------------------------------------------
// GUI
// ---------------------------------------------------------------------------
const gui = new GUI({ title: "Topology" });

gui
  .add(params, "geometry", ["Box", "Sphere", "Torus", "Custom pyramid"] as GeomName[])
  .name("Geometry")
  .onChange(() => rebuildGeometry());

gui
  .add(params, "segments", 1, 64, 1)
  .name("Segments")
  .onChange(() => {
    if (params.geometry !== "Custom pyramid") rebuildGeometry();
  });

gui
  .add(params, "wireframe")
  .name("Wireframe")
  .onChange((v: boolean) => {
    material.wireframe = v;
  });

gui
  .add(params, "smoothNormals")
  .name("Smooth normals")
  .onChange(() => rebuildGeometry());

gui
  .add(params, "showNormals")
  .name("Show normals")
  .onChange(() => refreshNormalsHelper());

gui
  .add(params, "indexed")
  .name("Indexed")
  .onChange(() => rebuildGeometry());

gui.add(params, "autoRotate").name("Auto-rotate");

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (params.autoRotate) {
    mesh.rotation.y += dt * 0.4;
  }

  if (normalsHelper) {
    normalsHelper.update();
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
