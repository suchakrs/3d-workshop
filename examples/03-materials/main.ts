import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import GUI from "lil-gui";

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------
const canvas = document.getElementById("c") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e14);

// Environment map for reflections
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ---------------------------------------------------------------------------
// Lights
// ---------------------------------------------------------------------------
const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(5, 8, 5);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
camera.position.set(0, 0, 3.5);

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

// ---------------------------------------------------------------------------
// Geometry + Mesh
// ---------------------------------------------------------------------------
const geometry = new THREE.TorusKnotGeometry(0.7, 0.25, 150, 32);

// Start with MeshStandardMaterial
let activeMaterial: THREE.Material = new THREE.MeshStandardMaterial({
  color: 0x4488ff,
  roughness: 0.3,
  metalness: 0.7,
});

const mesh = new THREE.Mesh(geometry, activeMaterial);
scene.add(mesh);

// ---------------------------------------------------------------------------
// Checkerboard CanvasTexture (procedural)
// ---------------------------------------------------------------------------
function makeCheckerTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const tile = size / 8;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#ffffff" : "#333333";
      ctx.fillRect(col * tile, row * tile, tile, tile);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const checkerTex = makeCheckerTexture();
checkerTex.colorSpace = THREE.SRGBColorSpace;

// Roughness map uses same canvas but NO sRGB colorspace (data map)
const roughnessTex = makeCheckerTexture();

// ---------------------------------------------------------------------------
// GUI state
// ---------------------------------------------------------------------------
type MatType =
  | "MeshBasicMaterial"
  | "MeshLambertMaterial"
  | "MeshStandardMaterial"
  | "MeshPhysicalMaterial";

const state = {
  materialType: "MeshStandardMaterial" as MatType,
  color: "#4488ff",
  metalness: 0.7,
  roughness: 0.3,
  emissive: "#000000",
  emissiveIntensity: 1.0,
  opacity: 1.0,
  transparent: false,
  wireframe: false,
  clearcoat: 0.0,
  clearcoatRoughness: 0.25,
  albedoMap: false,
  roughnessMap: false,
};

// ---------------------------------------------------------------------------
// Material factory
// ---------------------------------------------------------------------------
function buildMaterial(): THREE.Material {
  const color = new THREE.Color(state.color);
  const emissive = new THREE.Color(state.emissive);

  switch (state.materialType) {
    case "MeshBasicMaterial": {
      const m = new THREE.MeshBasicMaterial({
        color,
        wireframe: state.wireframe,
        transparent: state.transparent,
        opacity: state.opacity,
        map: state.albedoMap ? checkerTex : null,
      });
      return m;
    }
    case "MeshLambertMaterial": {
      const m = new THREE.MeshLambertMaterial({
        color,
        emissive,
        emissiveIntensity: state.emissiveIntensity,
        wireframe: state.wireframe,
        transparent: state.transparent,
        opacity: state.opacity,
        map: state.albedoMap ? checkerTex : null,
      });
      return m;
    }
    case "MeshStandardMaterial": {
      const m = new THREE.MeshStandardMaterial({
        color,
        metalness: state.metalness,
        roughness: state.roughness,
        emissive,
        emissiveIntensity: state.emissiveIntensity,
        wireframe: state.wireframe,
        transparent: state.transparent,
        opacity: state.opacity,
        map: state.albedoMap ? checkerTex : null,
        roughnessMap: state.roughnessMap ? roughnessTex : null,
      });
      return m;
    }
    case "MeshPhysicalMaterial": {
      const m = new THREE.MeshPhysicalMaterial({
        color,
        metalness: state.metalness,
        roughness: state.roughness,
        emissive,
        emissiveIntensity: state.emissiveIntensity,
        wireframe: state.wireframe,
        transparent: state.transparent,
        opacity: state.opacity,
        clearcoat: state.clearcoat,
        clearcoatRoughness: state.clearcoatRoughness,
        map: state.albedoMap ? checkerTex : null,
        roughnessMap: state.roughnessMap ? roughnessTex : null,
      });
      return m;
    }
  }
}

function swapMaterial(): void {
  activeMaterial.dispose();
  activeMaterial = buildMaterial();
  mesh.material = activeMaterial;
}

// ---------------------------------------------------------------------------
// GUI
// ---------------------------------------------------------------------------
const gui = new GUI({ title: "Materials" });

// Material type selector — rebuilds everything on change
gui
  .add(state, "materialType", [
    "MeshBasicMaterial",
    "MeshLambertMaterial",
    "MeshStandardMaterial",
    "MeshPhysicalMaterial",
  ])
  .name("Material type")
  .onChange(() => {
    swapMaterial();
    rebuildControllers();
  });

// Folders we rebuild each time
let commonFolder: ReturnType<GUI["addFolder"]> | null = null;
let pbrFolder: ReturnType<GUI["addFolder"]> | null = null;
let physFolder: ReturnType<GUI["addFolder"]> | null = null;
let texFolder: ReturnType<GUI["addFolder"]> | null = null;

function rebuildControllers(): void {
  // Destroy old folders
  commonFolder?.destroy();
  pbrFolder?.destroy();
  physFolder?.destroy();
  texFolder?.destroy();

  const isStandard =
    state.materialType === "MeshStandardMaterial" ||
    state.materialType === "MeshPhysicalMaterial";
  const isPhysical = state.materialType === "MeshPhysicalMaterial";
  const hasEmissive =
    state.materialType !== "MeshBasicMaterial";

  // --- Common ---
  commonFolder = gui.addFolder("Common");
  commonFolder
    .addColor(state, "color")
    .name("Color")
    .onChange(updateLive);
  if (hasEmissive) {
    commonFolder
      .addColor(state, "emissive")
      .name("Emissive")
      .onChange(updateLive);
    commonFolder
      .add(state, "emissiveIntensity", 0, 5, 0.01)
      .name("Emissive intensity")
      .onChange(updateLive);
  }
  commonFolder
    .add(state, "opacity", 0, 1, 0.01)
    .name("Opacity")
    .onChange(updateLive);
  commonFolder
    .add(state, "transparent")
    .name("Transparent")
    .onChange(updateLive);
  commonFolder
    .add(state, "wireframe")
    .name("Wireframe")
    .onChange(updateLive);
  commonFolder.open();

  // --- PBR ---
  if (isStandard) {
    pbrFolder = gui.addFolder("PBR");
    pbrFolder
      .add(state, "metalness", 0, 1, 0.01)
      .name("Metalness")
      .onChange(updateLive);
    pbrFolder
      .add(state, "roughness", 0, 1, 0.01)
      .name("Roughness")
      .onChange(updateLive);
    pbrFolder.open();
  }

  // --- Physical extras ---
  if (isPhysical) {
    physFolder = gui.addFolder("Physical");
    physFolder
      .add(state, "clearcoat", 0, 1, 0.01)
      .name("Clearcoat")
      .onChange(updateLive);
    physFolder
      .add(state, "clearcoatRoughness", 0, 1, 0.01)
      .name("Clearcoat roughness")
      .onChange(updateLive);
    physFolder.open();
  }

  // --- Texture maps ---
  texFolder = gui.addFolder("Texture maps");
  texFolder
    .add(state, "albedoMap")
    .name("Albedo map (checker)")
    .onChange(updateLive);
  if (isStandard) {
    texFolder
      .add(state, "roughnessMap")
      .name("Roughness map (checker)")
      .onChange(updateLive);
  }
  texFolder.open();
}

// Live-update material params without full rebuild (faster UX for sliders)
function updateLive(): void {
  const m = activeMaterial as THREE.MeshPhysicalMaterial &
    THREE.MeshStandardMaterial &
    THREE.MeshLambertMaterial &
    THREE.MeshBasicMaterial;

  m.color.set(state.color);
  m.wireframe = state.wireframe;
  m.transparent = state.transparent;
  m.opacity = state.opacity;
  m.map = state.albedoMap ? checkerTex : null;

  if ("emissive" in m) {
    m.emissive.set(state.emissive);
    m.emissiveIntensity = state.emissiveIntensity;
  }
  if ("metalness" in m) {
    m.metalness = state.metalness;
    m.roughness = state.roughness;
    m.roughnessMap = state.roughnessMap ? roughnessTex : null;
  }
  if ("clearcoat" in m) {
    m.clearcoat = state.clearcoat;
    m.clearcoatRoughness = state.clearcoatRoughness;
  }

  m.needsUpdate = true;
}

// Initial GUI build
rebuildControllers();

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
// Loop
// ---------------------------------------------------------------------------
function animate(): void {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
