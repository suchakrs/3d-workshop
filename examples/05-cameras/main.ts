import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------
const canvas = document.getElementById("c") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111318);

// Grid ground
const gridHelper = new THREE.GridHelper(80, 40, 0x333344, 0x222230);
scene.add(gridHelper);

// Row of boxes receding into distance
const boxMat = new THREE.MeshStandardMaterial({ color: 0x5588ff, roughness: 0.4 });
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const BOX_COUNT = 12;
for (let i = 0; i < BOX_COUNT; i++) {
  const mesh = new THREE.Mesh(boxGeo, boxMat);
  // spread from z=0 back to z=-55, vary height/x slightly
  mesh.position.set(
    (i % 3 - 1) * 3,
    0.5,
    -i * 5
  );
  mesh.scale.setScalar(1 + i * 0.08); // grow slightly to exaggerate ortho difference
  scene.add(mesh);
}

// A few extra scene markers so ortho difference is obvious
const sphereGeo = new THREE.SphereGeometry(0.6, 16, 12);
const sphereMat = new THREE.MeshStandardMaterial({ color: 0xff8844 });
for (let i = 0; i < 5; i++) {
  const s = new THREE.Mesh(sphereGeo, sphereMat);
  s.position.set(-8 + i * 4, 0.6, -25);
  scene.add(s);
}

// Ambient + directional light
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// ---------------------------------------------------------------------------
// Cameras
// ---------------------------------------------------------------------------
const aspect = window.innerWidth / window.innerHeight;

const perspCam = new THREE.PerspectiveCamera(60, aspect, 0.5, 200);
perspCam.position.set(0, 4, 12);
perspCam.lookAt(0, 0, -20);

// Ortho: derive half-height from a world-space "view height" at the target distance
const ORTHO_VIEW_HEIGHT = 14;
const orthoCam = new THREE.OrthographicCamera(
  -ORTHO_VIEW_HEIGHT * aspect / 2,
   ORTHO_VIEW_HEIGHT * aspect / 2,
   ORTHO_VIEW_HEIGHT / 2,
  -ORTHO_VIEW_HEIGHT / 2,
  0.5,
  200
);
orthoCam.position.set(0, 4, 12);
orthoCam.lookAt(0, 0, -20);

// Overview camera — fixed far bird's eye, never moves
const overviewCam = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
overviewCam.position.set(25, 30, 25);
overviewCam.lookAt(0, 0, -20);

// Active camera pointer — starts as perspective
let activeCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera = perspCam;

// ---------------------------------------------------------------------------
// CameraHelper (shows active camera frustum in inset view)
// ---------------------------------------------------------------------------
let cameraHelper = new THREE.CameraHelper(perspCam);
scene.add(cameraHelper);

// ---------------------------------------------------------------------------
// OrbitControls — target the active camera
// ---------------------------------------------------------------------------
const controls = new OrbitControls(activeCamera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0, -20);
controls.update();

// ---------------------------------------------------------------------------
// GUI params
// ---------------------------------------------------------------------------
const params = {
  projection: "Perspective" as "Perspective" | "Orthographic",
  fov: 60,
  orthoZoom: 1.0,
  near: 0.5,
  far: 200,
};

function updateActiveCameraProjection(): void {
  if (activeCamera instanceof THREE.PerspectiveCamera) {
    activeCamera.fov = params.fov;
    activeCamera.near = params.near;
    activeCamera.far = params.far;
  } else {
    // ortho zoom: scale the frustum
    const h = (ORTHO_VIEW_HEIGHT / 2) / params.orthoZoom;
    const a = window.innerWidth / window.innerHeight;
    activeCamera.left   = -h * a;
    activeCamera.right  =  h * a;
    activeCamera.top    =  h;
    activeCamera.bottom = -h;
    activeCamera.near = params.near;
    activeCamera.far  = params.far;
  }
  activeCamera.updateProjectionMatrix();
  cameraHelper.update();
}

function switchCamera(proj: "Perspective" | "Orthographic"): void {
  // Remove old helper
  scene.remove(cameraHelper);
  cameraHelper.dispose();

  if (proj === "Perspective") {
    activeCamera = perspCam;
  } else {
    activeCamera = orthoCam;
  }

  // Copy position/quaternion from whichever was active before for smooth swap
  // (already synced via OrbitControls — just retarget)
  controls.object = activeCamera;
  controls.update();

  // New helper
  cameraHelper = new THREE.CameraHelper(activeCamera);
  scene.add(cameraHelper);

  updateActiveCameraProjection();
}

const gui = new GUI({ title: "Cameras" });

gui
  .add(params, "projection", ["Perspective", "Orthographic"])
  .name("Projection")
  .onChange((v: "Perspective" | "Orthographic") => {
    switchCamera(v);
    fovCtrl.show(v === "Perspective");
    orthoZoomCtrl.show(v === "Orthographic");
  });

const fovCtrl = gui
  .add(params, "fov", 10, 120, 1)
  .name("FOV (deg)")
  .onChange(() => updateActiveCameraProjection());

const orthoZoomCtrl = gui
  .add(params, "orthoZoom", 0.1, 5, 0.05)
  .name("Ortho zoom")
  .onChange(() => updateActiveCameraProjection())
  .hide();

gui
  .add(params, "near", 0.01, 50, 0.01)
  .name("near")
  .onChange(() => updateActiveCameraProjection());

gui
  .add(params, "far", 10, 1000, 1)
  .name("far")
  .onChange(() => updateActiveCameraProjection());

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const a = w / h;

  renderer.setSize(w, h);

  perspCam.aspect = a;
  perspCam.updateProjectionMatrix();

  const oh = (ORTHO_VIEW_HEIGHT / 2) / params.orthoZoom;
  orthoCam.left   = -oh * a;
  orthoCam.right  =  oh * a;
  orthoCam.top    =  oh;
  orthoCam.bottom = -oh;
  orthoCam.updateProjectionMatrix();

  cameraHelper.update();
});

// ---------------------------------------------------------------------------
// Render loop — split-screen
// ---------------------------------------------------------------------------
function render(): void {
  requestAnimationFrame(render);
  controls.update();

  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;

  // Inset size: 30% of the smaller dimension
  const insetSize = Math.floor(Math.min(w, h) * 0.30);

  // --- MAIN VIEW: full screen ---
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, w, h);
  renderer.clear();

  // Hide helper in main view; show it only in inset
  cameraHelper.visible = false;

  renderer.setScissorTest(true);
  renderer.setScissor(0, 0, w, h);
  renderer.setViewport(0, 0, w, h);
  renderer.render(scene, activeCamera);

  // --- INSET VIEW: bottom-right ---
  const insetX = w - insetSize - 4;
  const insetY = 4; // bottom in GL coords (y=0 is bottom)

  // Update overview cam aspect
  overviewCam.aspect = 1;
  overviewCam.updateProjectionMatrix();

  cameraHelper.visible = true;

  renderer.setScissor(insetX, insetY, insetSize, insetSize);
  renderer.setViewport(insetX, insetY, insetSize, insetSize);
  renderer.render(scene, overviewCam);

  // Reset scissor test
  renderer.setScissorTest(false);
}

render();
