/**
 * Example 06 — three.js Vanilla: Full Assembled Scene
 * =====================================================
 * This file is the canonical "anatomy of a three.js app" reference.
 * Read it top-to-bottom; each numbered section maps to a concept.
 *
 * Sections:
 *   1. Renderer     — WebGLRenderer setup, pixel ratio, shadow map
 *   2. Scene + Fog  — Scene graph root, background color, atmospheric fog
 *   3. Camera       — PerspectiveCamera, aspect ratio, frustum
 *   4. Controls     — OrbitControls with damping
 *   5. Lights       — AmbientLight + DirectionalLight with shadows
 *   6. Ground       — Shadow-receiving plane
 *   7. Meshes       — Hero (TorusKnot) + two supporting meshes
 *   8. Helpers      — AxesHelper + GridHelper (toggleable)
 *   9. GUI          — lil-gui panel wiring
 *  10. Resize       — Window resize handler
 *  11. Animation    — Clock, delta time, requestAnimationFrame loop
 *
 * LIFECYCLE: create → animate → dispose
 *   When you tear down a scene (SPA navigation, HMR, etc.) call:
 *     geometry.dispose(), material.dispose(), texture.dispose(),
 *     renderer.dispose(), controls.dispose()
 *   Skipping this leaks GPU memory.
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";

// ===========================================================================
// 1. RENDERER
// ===========================================================================
// The renderer is the bridge between your scene data and the screen.
// It rasterises 3D geometry into 2D pixels using WebGL.

const canvas = document.getElementById("c") as HTMLCanvasElement;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true, // MSAA — smooths jagged edges at mild performance cost
});

// setPixelRatio: on retina screens devicePixelRatio can be 3+.
// Capping at 2 prevents massive overdraw cost with minimal visual loss.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Fill the viewport. We update this on resize too (section 10).
renderer.setSize(window.innerWidth, window.innerHeight);

// Shadow maps: the renderer pre-renders each shadow-casting light's view
// into a depth texture, then samples it during the main pass.
// Must be enabled here AND per-light + per-mesh (see sections 5 & 7).
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // softer shadow edges

// r152+ sets outputColorSpace = SRGBColorSpace by default.
// Colors you specify (0x6699ff etc.) are treated as sRGB and converted
// to linear for lighting math, then back to sRGB for display. No action
// needed, but be aware if you import textures — use THREE.SRGBColorSpace
// on them so they aren't double-converted.

// ===========================================================================
// 2. SCENE + FOG
// ===========================================================================
// Scene is the root of the scene graph — an Object3D tree.
// Everything you add(child) becomes a node in that tree.
// Transforms compose: a child's world position = parent.matrixWorld × child.matrix

const scene = new THREE.Scene();

// Background color — same deep navy as the page background.
scene.background = new THREE.Color(0x0b0e14);

// Fog blends objects into the background color based on camera distance.
// THREE.Fog(color, near, far) — linear falloff between near and far planes.
// Matches background so distant objects fade naturally.
scene.fog = new THREE.Fog(0x0b0e14, 10, 30);

// ===========================================================================
// 3. CAMERA
// ===========================================================================
// PerspectiveCamera(fov, aspect, near, far)
//   fov    — vertical field of view in degrees (50 = moderate, not fisheye)
//   aspect — must match the renderer viewport; updated on resize
//   near   — objects closer than this clip (0.1 avoids z-fighting near origin)
//   far    — objects farther than this don't render (100 covers our scene)
//
// The frustum (view volume) is the pyramid between near and far planes.
// Only geometry inside it is rendered.

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// Position camera slightly above and behind the scene center.
camera.position.set(4, 3, 6);

// lookAt sets the camera's rotation so it points at a world-space target.
// We aim slightly above the origin to frame the hero mesh nicely.
camera.lookAt(0, 0.5, 0);

// ===========================================================================
// 4. CONTROLS
// ===========================================================================
// OrbitControls adds mouse/touch navigation: orbit, zoom, pan.
// It manipulates the camera's position and target each frame.
// enableDamping = true adds inertia — call controls.update() every frame.

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0.5, 0); // match camera.lookAt target

// ===========================================================================
// 5. LIGHTS
// ===========================================================================
// MeshStandardMaterial (PBR) requires lights — no lights = black surface.

// AmbientLight: uniform, directionless light. Prevents fully-black shadows.
// Think of it as simulating indirect/bounced light in a cheap way.
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

// DirectionalLight: parallel rays, simulates a distant sun.
// intensity 2.5 is physically-based (in lumens-ish, not 0-1 anymore in r155+).
const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(5, 8, 5);

// Shadow setup — must configure both the light AND the renderer (done above).
dirLight.castShadow = true;

// shadow.mapSize: resolution of the shadow depth texture.
// 1024×1024 is a good default — 2048 is sharper but costs more VRAM.
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;

// shadow.camera defines the orthographic frustum used to capture shadows.
// Keep it tight around your scene to maximise shadow map resolution.
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;

scene.add(dirLight);

// ===========================================================================
// 6. GROUND
// ===========================================================================
// PlaneGeometry lies in the XY plane by default; rotate -90° to lay flat.

const groundGeo = new THREE.PlaneGeometry(20, 20);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
const ground = new THREE.Mesh(groundGeo, groundMat);

ground.rotation.x = -Math.PI / 2; // rotate to horizontal
ground.position.y = -1;           // sink slightly below origin

// receiveShadow: sample the shadow map and darken the surface.
// castShadow not needed here — ground doesn't cast onto anything relevant.
ground.receiveShadow = true;

scene.add(ground);

// ===========================================================================
// 7. MESHES
// ===========================================================================
// A Mesh = Geometry (shape) + Material (appearance).
// Geometry lives on the GPU as vertex/index buffers.
// Material is a shader program + its uniforms.

// --- Hero: TorusKnot ---
// A parametric knot surface — visually interesting, shows lighting well.
// (0.7=radius, 0.25=tube, 128=tubularSegments, 32=radialSegments)
const heroGeo = new THREE.TorusKnotGeometry(0.7, 0.25, 128, 32);
const heroMat = new THREE.MeshStandardMaterial({
  color: 0x6699ff,
  metalness: 0.3,  // 0=plastic, 1=metal
  roughness: 0.4,  // 0=mirror, 1=fully diffuse
});
const hero = new THREE.Mesh(heroGeo, heroMat);
hero.position.set(0, 0.5, 0); // lift off the ground
hero.castShadow = true;        // this mesh casts shadows onto others
scene.add(hero);

// --- Supporting Mesh A: Box ---
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const boxMat = new THREE.MeshStandardMaterial({ color: 0xff6688 });
const box = new THREE.Mesh(boxGeo, boxMat);
box.position.set(-2.5, 0, 0); // y=0 → sits on ground (ground at y=-1, mesh half-height=0.5 → base at -0.5... centre at 0)
box.castShadow = true;
scene.add(box);

// --- Supporting Mesh B: Sphere ---
const sphereGeo = new THREE.SphereGeometry(0.7, 32, 32);
const sphereMat = new THREE.MeshStandardMaterial({ color: 0x66ddaa });
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.position.set(2.5, 0, 0);
sphere.castShadow = true;
scene.add(sphere);

// ===========================================================================
// 8. HELPERS
// ===========================================================================
// Visual debugging aids. We'll toggle them with the GUI.

// AxesHelper: draws X (red), Y (green), Z (blue) arrows from the origin.
// Length 2 = 2 world units.
const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

// GridHelper: flat grid on XZ plane. Good for spatial orientation.
// (size, divisions, colorCenterLine, colorGrid)
const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x333344);
gridHelper.position.y = -1; // align with ground plane
scene.add(gridHelper);

// ===========================================================================
// 9. GUI
// ===========================================================================
// lil-gui binds JS object properties to sliders/toggles/color pickers.
// It mutates params directly; onChange callbacks apply side effects.

const params = {
  speed: 0.5,          // hero rotation speed multiplier
  helpers: true,       // axes + grid visibility
  wireframe: false,    // hero wireframe mode
};

const gui = new GUI({ title: "06 · Scene Controls" });

// Animation speed — multiplies the delta-time rotation increment.
gui.add(params, "speed", 0, 3, 0.01).name("animation speed");

// Helpers toggle — show/hide AxesHelper + GridHelper together.
gui.add(params, "helpers").name("show helpers").onChange((val: boolean) => {
  axesHelper.visible = val;
  gridHelper.visible = val;
});

// Wireframe toggle — flips heroMat.wireframe; useful to inspect geometry.
gui.add(params, "wireframe").name("hero wireframe").onChange((val: boolean) => {
  heroMat.wireframe = val;
});

// ===========================================================================
// 10. RESIZE HANDLER
// ===========================================================================
// When the window resizes we must:
//   a) update camera aspect ratio (otherwise scene appears stretched)
//   b) call updateProjectionMatrix() to push the new frustum to the GPU
//   c) resize the renderer drawingBuffer to fill the new viewport
//   d) re-clamp pixel ratio (user could drag to a different monitor)

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ===========================================================================
// 11. ANIMATION LOOP
// ===========================================================================
// requestAnimationFrame schedules the next frame — the browser calls animate()
// ~60 times/second (or at the display refresh rate).
//
// THREE.Clock.getDelta() returns seconds elapsed since the last call.
// Always multiply motion by delta time so animation speed is frame-rate
// independent (same on 60 Hz and 144 Hz displays).

const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // seconds since last frame

  // Rotate hero continuously around Y axis.
  // params.speed lets the user slow or stop it via GUI.
  hero.rotation.y += delta * params.speed;

  // controls.update() is required every frame when enableDamping is true.
  // It applies the damping inertia to the camera orbit.
  controls.update();

  // renderer.render() traverses the scene graph, computes transforms,
  // runs vertex + fragment shaders, and writes the result to the canvas.
  renderer.render(scene, camera);
}

// Kick off the loop. animate() calls itself via rAF from here on.
animate();

// ---------------------------------------------------------------------------
// DISPOSE (reference — call this on teardown / HMR)
// ---------------------------------------------------------------------------
// function dispose() {
//   // Geometry: releases vertex/index buffers from GPU
//   heroGeo.dispose(); boxGeo.dispose(); sphereGeo.dispose();
//   groundGeo.dispose();
//   // Materials: releases shader programs and uniform textures
//   heroMat.dispose(); boxMat.dispose(); sphereMat.dispose();
//   groundMat.dispose();
//   // Controls: removes event listeners
//   controls.dispose();
//   // Renderer: releases WebGL context and all allocated GPU resources
//   renderer.dispose();
//   // GUI: removes DOM panel
//   gui.destroy();
// }
