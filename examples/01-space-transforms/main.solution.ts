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
scene.background = new THREE.Color(0x0b0e14);

// Helpers
scene.add(new THREE.AxesHelper(2));
scene.add(new THREE.GridHelper(10, 10, 0x444466, 0x333344));

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
camera.position.set(3, 3, 5);
camera.lookAt(0, 0, 0);

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// ---------------------------------------------------------------------------
// Mesh
// ---------------------------------------------------------------------------
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshNormalMaterial();
const mesh = new THREE.Mesh(geometry, material);

// Parent group
const group = new THREE.Group();
group.add(mesh);
mesh.position.set(2, 0, 0);

// Start without nesting
scene.add(mesh);

// ---------------------------------------------------------------------------
// GUI state
// ---------------------------------------------------------------------------
const params = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  rotationOrder: "XYZ" as THREE.EulerOrder,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  parentGroup: false,
  groupSpeed: 0.5,
};

// ---------------------------------------------------------------------------
// GUI
// ---------------------------------------------------------------------------
const gui = new GUI({ title: "Transforms" });

const posFolder = gui.addFolder("Position");
posFolder.add(params, "posX", -5, 5, 0.01).name("x").onChange(() => {
  mesh.position.x = params.posX;
});
posFolder.add(params, "posY", -5, 5, 0.01).name("y").onChange(() => {
  mesh.position.y = params.posY;
});
posFolder.add(params, "posZ", -5, 5, 0.01).name("z").onChange(() => {
  mesh.position.z = params.posZ;
});

const rotFolder = gui.addFolder("Rotation");
const applyRotation = () => {
  mesh.rotation.order = params.rotationOrder;
  mesh.rotation.x = THREE.MathUtils.degToRad(params.rotX);
  mesh.rotation.y = THREE.MathUtils.degToRad(params.rotY);
  mesh.rotation.z = THREE.MathUtils.degToRad(params.rotZ);
};
rotFolder.add(params, "rotX", -180, 180, 1).name("x (deg)").onChange(applyRotation);
rotFolder.add(params, "rotY", -180, 180, 1).name("y (deg)").onChange(applyRotation);
rotFolder.add(params, "rotZ", -180, 180, 1).name("z (deg)").onChange(applyRotation);
rotFolder
  .add(params, "rotationOrder", ["XYZ", "YXZ", "ZXY", "ZYX", "YZX", "XZY"])
  .name("Euler order")
  .onChange(applyRotation);

const scaleFolder = gui.addFolder("Scale");
scaleFolder.add(params, "scaleX", 0.1, 3, 0.01).name("x").onChange(() => {
  mesh.scale.x = params.scaleX;
});
scaleFolder.add(params, "scaleY", 0.1, 3, 0.01).name("y").onChange(() => {
  mesh.scale.y = params.scaleY;
});
scaleFolder.add(params, "scaleZ", 0.1, 3, 0.01).name("z").onChange(() => {
  mesh.scale.z = params.scaleZ;
});

const groupFolder = gui.addFolder("Parent Group");
groupFolder
  .add(params, "parentGroup")
  .name("Enable parent group")
  .onChange((val: boolean) => {
    if (val) {
      scene.remove(mesh);
      mesh.position.set(2, 0, 0);
      group.rotation.set(0, 0, 0);
      scene.add(group);
    } else {
      scene.remove(group);
      mesh.position.set(params.posX, params.posY, params.posZ);
      scene.add(mesh);
    }
  });
groupFolder.add(params, "groupSpeed", 0, 3, 0.01).name("group speed");

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

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // SOLUTION (E1): rotate group so child mesh orbits the group origin
  if (params.parentGroup) {
    group.rotation.y += dt * params.groupSpeed;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
