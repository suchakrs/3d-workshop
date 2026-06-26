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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---------------------------------------------------------------------------
// Scene & camera
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111318);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
camera.position.set(0, 4, 9);
camera.lookAt(0, 0, 0);

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x2a2a35, roughness: 0.9, metalness: 0.1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.5;
ground.receiveShadow = true;
scene.add(ground);

// ---------------------------------------------------------------------------
// Hero — TorusKnot
// ---------------------------------------------------------------------------
const hero = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.9, 0.32, 128, 32),
  new THREE.MeshStandardMaterial({ color: 0x8855ff, roughness: 0.3, metalness: 0.6 })
);
hero.castShadow = true;
hero.receiveShadow = true;
scene.add(hero);

// ---------------------------------------------------------------------------
// Lights
// ---------------------------------------------------------------------------

// Ambient
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Hemisphere
const hemiLight = new THREE.HemisphereLight(0x7ec8e3, 0x4a3f20, 0.5);
scene.add(hemiLight);
const hemiHelper = new THREE.HemisphereLightHelper(hemiLight, 1);
hemiHelper.visible = false;
scene.add(hemiHelper);

// Directional
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 8, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);
const dirHelper = new THREE.DirectionalLightHelper(dirLight, 1);
dirHelper.visible = false;
scene.add(dirHelper);

// Point
const pointLight = new THREE.PointLight(0xff6600, 2, 15, 2);
pointLight.position.set(-4, 3, 2);
pointLight.castShadow = false;
scene.add(pointLight);
const pointHelper = new THREE.PointLightHelper(pointLight, 0.3);
pointHelper.visible = false;
scene.add(pointHelper);

// Spot
const spotLight = new THREE.SpotLight(0x00ccff, 3, 20, Math.PI / 6, 0.3, 2);
spotLight.position.set(0, 8, 0);
spotLight.target.position.set(0, 0, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);
scene.add(spotLight.target);
const spotHelper = new THREE.SpotLightHelper(spotLight);
spotHelper.visible = false;
scene.add(spotHelper);

// ---------------------------------------------------------------------------
// PMREMGenerator for IBL
// ---------------------------------------------------------------------------
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
let envTexture: THREE.Texture | null = null;

// ---------------------------------------------------------------------------
// GUI
// ---------------------------------------------------------------------------
const gui = new GUI({ title: "Lighting" });

// ---- Global ----------------------------------------------------------------
const globalParams = {
  shadowsEnabled: true,
  ibl: false,
};

const globalFolder = gui.addFolder("Global");
globalFolder
  .add(globalParams, "shadowsEnabled")
  .name("shadows enabled")
  .onChange((v: boolean) => {
    renderer.shadowMap.enabled = v;
    dirLight.castShadow = v && dirParams.castShadow;
    spotLight.castShadow = v && spotParams.castShadow;
    // Force material update (Mesh.material may be a single material or an array)
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => (m.needsUpdate = true));
      }
    });
  });
globalFolder
  .add(globalParams, "ibl")
  .name("environment / IBL")
  .onChange((v: boolean) => {
    if (v) {
      if (!envTexture) {
        envTexture = pmremGenerator.fromScene(new RoomEnvironment()).texture;
      }
      scene.environment = envTexture;
    } else {
      scene.environment = null;
    }
  });

// ---- Ambient ---------------------------------------------------------------
const ambientParams = { enabled: true, intensity: 0.3, color: "#ffffff" };
const ambientFolder = gui.addFolder("Ambient");
ambientFolder.add(ambientParams, "enabled").onChange((v: boolean) => {
  ambientLight.visible = v;
});
ambientFolder
  .add(ambientParams, "intensity", 0, 3, 0.01)
  .onChange((v: number) => { ambientLight.intensity = v; });
ambientFolder
  .addColor(ambientParams, "color")
  .onChange((v: string) => { ambientLight.color.set(v); });

// ---- Hemisphere ------------------------------------------------------------
const hemiParams = {
  enabled: true,
  skyColor: "#7ec8e3",
  groundColor: "#4a3f20",
  intensity: 0.5,
  showHelper: false,
};
const hemiFolder = gui.addFolder("Hemisphere");
hemiFolder.add(hemiParams, "enabled").onChange((v: boolean) => {
  hemiLight.visible = v;
});
hemiFolder
  .addColor(hemiParams, "skyColor")
  .name("sky color")
  .onChange((v: string) => { hemiLight.color.set(v); });
hemiFolder
  .addColor(hemiParams, "groundColor")
  .name("ground color")
  .onChange((v: string) => { hemiLight.groundColor.set(v); });
hemiFolder
  .add(hemiParams, "intensity", 0, 3, 0.01)
  .onChange((v: number) => { hemiLight.intensity = v; });
hemiFolder
  .add(hemiParams, "showHelper")
  .name("show helper")
  .onChange((v: boolean) => { hemiHelper.visible = v; });

// ---- Directional -----------------------------------------------------------
const dirParams = {
  enabled: true,
  intensity: 1.5,
  color: "#ffffff",
  posX: 5,
  posY: 8,
  posZ: 5,
  castShadow: true,
  showHelper: false,
};
const dirFolder = gui.addFolder("Directional");
dirFolder.add(dirParams, "enabled").onChange((v: boolean) => {
  dirLight.visible = v;
});
dirFolder
  .add(dirParams, "intensity", 0, 5, 0.01)
  .onChange((v: number) => { dirLight.intensity = v; });
dirFolder
  .addColor(dirParams, "color")
  .onChange((v: string) => { dirLight.color.set(v); });
dirFolder
  .add(dirParams, "posX", -10, 10, 0.1)
  .name("position x")
  .onChange((v: number) => { dirLight.position.x = v; });
dirFolder
  .add(dirParams, "posY", 0, 20, 0.1)
  .name("position y")
  .onChange((v: number) => { dirLight.position.y = v; });
dirFolder
  .add(dirParams, "posZ", -10, 10, 0.1)
  .name("position z")
  .onChange((v: number) => { dirLight.position.z = v; });
dirFolder
  .add(dirParams, "castShadow")
  .name("cast shadow")
  .onChange((v: boolean) => {
    dirLight.castShadow = v && globalParams.shadowsEnabled;
  });
dirFolder
  .add(dirParams, "showHelper")
  .name("show helper")
  .onChange((v: boolean) => { dirHelper.visible = v; });

// ---- Point -----------------------------------------------------------------
const pointParams = {
  enabled: true,
  intensity: 2,
  color: "#ff6600",
  posX: -4,
  posY: 3,
  posZ: 2,
  distance: 15,
  decay: 2,
  showHelper: false,
};
const pointFolder = gui.addFolder("Point");
pointFolder.add(pointParams, "enabled").onChange((v: boolean) => {
  pointLight.visible = v;
});
pointFolder
  .add(pointParams, "intensity", 0, 10, 0.01)
  .onChange((v: number) => { pointLight.intensity = v; });
pointFolder
  .addColor(pointParams, "color")
  .onChange((v: string) => { pointLight.color.set(v); });
pointFolder
  .add(pointParams, "posX", -10, 10, 0.1)
  .name("position x")
  .onChange((v: number) => { pointLight.position.x = v; });
pointFolder
  .add(pointParams, "posY", 0, 15, 0.1)
  .name("position y")
  .onChange((v: number) => { pointLight.position.y = v; });
pointFolder
  .add(pointParams, "posZ", -10, 10, 0.1)
  .name("position z")
  .onChange((v: number) => { pointLight.position.z = v; });
pointFolder
  .add(pointParams, "distance", 0, 50, 0.5)
  .onChange((v: number) => { pointLight.distance = v; });
pointFolder
  .add(pointParams, "decay", 0, 5, 0.01)
  .onChange((v: number) => { pointLight.decay = v; });
pointFolder
  .add(pointParams, "showHelper")
  .name("show helper")
  .onChange((v: boolean) => { pointHelper.visible = v; });

// ---- Spot ------------------------------------------------------------------
const spotParams = {
  enabled: true,
  intensity: 3,
  color: "#00ccff",
  posX: 0,
  posY: 8,
  posZ: 0,
  angle: Math.PI / 6,
  penumbra: 0.3,
  castShadow: true,
  showHelper: false,
};
const spotFolder = gui.addFolder("Spot");
spotFolder.add(spotParams, "enabled").onChange((v: boolean) => {
  spotLight.visible = v;
});
spotFolder
  .add(spotParams, "intensity", 0, 10, 0.01)
  .onChange((v: number) => { spotLight.intensity = v; });
spotFolder
  .addColor(spotParams, "color")
  .onChange((v: string) => { spotLight.color.set(v); });
spotFolder
  .add(spotParams, "posX", -10, 10, 0.1)
  .name("position x")
  .onChange((v: number) => { spotLight.position.x = v; });
spotFolder
  .add(spotParams, "posY", 1, 20, 0.1)
  .name("position y")
  .onChange((v: number) => { spotLight.position.y = v; });
spotFolder
  .add(spotParams, "posZ", -10, 10, 0.1)
  .name("position z")
  .onChange((v: number) => { spotLight.position.z = v; });
spotFolder
  .add(spotParams, "angle", 0.05, Math.PI / 2, 0.01)
  .onChange((v: number) => { spotLight.angle = v; });
spotFolder
  .add(spotParams, "penumbra", 0, 1, 0.01)
  .onChange((v: number) => { spotLight.penumbra = v; });
spotFolder
  .add(spotParams, "castShadow")
  .name("cast shadow")
  .onChange((v: boolean) => {
    spotLight.castShadow = v && globalParams.shadowsEnabled;
  });
spotFolder
  .add(spotParams, "showHelper")
  .name("show helper")
  .onChange((v: boolean) => { spotHelper.visible = v; });

// Collapse non-critical folders by default
hemiFolder.close();
pointFolder.close();
spotFolder.close();

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  hero.rotation.y = elapsed * 0.4;
  hero.rotation.x = elapsed * 0.15;

  controls.update();

  // Update helpers each frame (light may move via GUI)
  if (hemiHelper.visible) hemiHelper.update();
  if (dirHelper.visible) dirHelper.update();
  if (pointHelper.visible) pointHelper.update();
  if (spotHelper.visible) spotHelper.update();

  renderer.render(scene, camera);
}

animate();
