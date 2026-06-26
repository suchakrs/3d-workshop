/**
 * Example 08 — Point cloud rendering: WebGPU + TSL, ~1,000,000 points
 * ===================================================================
 * This is the lab's real workload: a 3D scan is millions of XYZ points
 * (+ colour / intensity). Here we synthesise a scan-like terrain (see
 * src/shared/generatePointCloud.ts) and render it two ways:
 *
 *   • WebGPU path (preferred): WebGPURenderer + a PointsNodeMaterial whose
 *     size / colour / opacity are driven by TSL (Three Shading Language) nodes.
 *     This pushes per-point work onto the GPU and scales to 1M+ points.
 *
 *   • WebGL fallback: a plain THREE.Points + PointsMaterial, so the page still
 *     works in browsers without WebGPU (no TSL there).
 *
 * The deep-dive doc (workshop-docs/08-pointcloud-webgpu-tsl.md) explains the
 * TSL nodes, the performance reasoning, and how to swap in a real .ply / .las.
 */

import * as THREE from "three";
import type { WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { generatePointCloud } from "../../src/shared/generatePointCloud";

// --- DOM handles ------------------------------------------------------------
const canvas = document.getElementById("c") as HTMLCanvasElement;
const backendEl = document.getElementById("backend") as HTMLElement;
const fpsEl = document.getElementById("fps") as HTMLElement;
const countEl = document.getElementById("count") as HTMLElement;
const warnEl = document.getElementById("warn") as HTMLElement;

// --- Shared scene scaffolding ----------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e14);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  2000,
);
camera.position.set(0, 70, 120);
camera.lookAt(0, 0, 0);

// GUI-bound parameters.
const params = {
  pointCount: 1_000_000,
  pointSize: 2.0,
  sizeAttenuation: true,
  colorMode: "height" as "height" | "uniform" | "grayscale",
  uniformColor: "#66ccff",
  distanceFade: 0.0, // 0 = no fade, 1 = strong far-fade
};

// `points` is rebuilt when the point count changes; the active builder is set
// by whichever backend (WebGPU or WebGL) initialises below.
let points: THREE.Points;
let rebuild: (count: number) => void;
let applyParams: () => void;

// ---------------------------------------------------------------------------
// WebGPU + TSL path
// ---------------------------------------------------------------------------
async function initWebGPU(): Promise<{ render: () => void; renderer: WebGPURenderer }> {
  const { WebGPURenderer, PointsNodeMaterial } = await import("three/webgpu");
  const TSL = await import("three/tsl");
  const { uniform, attribute, positionView, color, float, mix, clamp, vec3 } = TSL;

  const renderer = new WebGPURenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  await renderer.init();

  // TSL uniforms — live handles we can update from the GUI without recompiling.
  const uSize = uniform(params.pointSize);
  const uAtten = uniform(params.sizeAttenuation ? 1 : 0);
  const uFade = uniform(params.distanceFade);
  const uColor = uniform(color(params.uniformColor));

  // View-space distance from the camera to the point (vertex stage).
  const dist = positionView.xyz.length();

  // SIZE node:
  //   base size in pixels, optionally attenuated by 1/distance so far points
  //   shrink (depth cue). `mix(base, attenuated, uAtten)` toggles it live.
  const attenuated = uSize.mul(float(120).div(dist.max(1.0)));
  const sizeNode = mix(uSize, attenuated, uAtten);

  // COLOUR node: rebuilt on mode change (recompiles the material shader).
  const heightColor = attribute("color", "vec3"); // per-point colour from the generator
  function colorNodeFor(mode: typeof params.colorMode) {
    if (mode === "uniform") return uColor;
    if (mode === "grayscale") {
      // luminance of the height colour → grey
      const c = heightColor;
      const l = c.x.mul(0.299).add(c.y.mul(0.587)).add(c.z.mul(0.114));
      return vec3(l, l, l);
    }
    return heightColor; // "height"
  }

  // OPACITY node: fade far points out as distanceFade increases.
  //   near → 1, far → (1 - fade). uFade in [0,1] blends the effect in.
  const farFactor = clamp(float(1).sub(dist.div(220.0)), 0.0, 1.0);
  const opacityNode = mix(float(1.0), farFactor, uFade);

  const material = new PointsNodeMaterial();
  // @types/three 0.171 omits PointsNodeMaterial.sizeNode (present at runtime).
  (material as unknown as { sizeNode: unknown }).sizeNode = sizeNode;
  material.colorNode = colorNodeFor(params.colorMode);
  material.opacityNode = opacityNode;
  material.transparent = true;
  material.depthWrite = true;

  rebuild = (count: number) => {
    if (points) {
      points.geometry.dispose();
      scene.remove(points);
    }
    const { positions, colors } = generatePointCloud(count, { seed: 7 });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    points = new THREE.Points(geo, material);
    scene.add(points);
    countEl.textContent = count.toLocaleString();
  };

  applyParams = () => {
    uSize.value = params.pointSize;
    uAtten.value = params.sizeAttenuation ? 1 : 0;
    uFade.value = params.distanceFade;
    (uColor.value as unknown as THREE.Color).set(params.uniformColor);
    material.colorNode = colorNodeFor(params.colorMode);
    material.needsUpdate = true; // colour mode changes the shader graph
  };

  rebuild(params.pointCount);
  backendEl.textContent = "WebGPU + TSL";

  return { render: () => renderer.renderAsync(scene, camera), renderer };
}

// ---------------------------------------------------------------------------
// WebGL fallback path (no TSL)
// ---------------------------------------------------------------------------
function initWebGL(): { render: () => void; renderer: THREE.WebGLRenderer } {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const material = new THREE.PointsMaterial({
    size: params.pointSize,
    sizeAttenuation: params.sizeAttenuation,
    vertexColors: true,
  });

  // The fallback can't compute colour on the GPU, so we precompute a height
  // buffer and a grayscale (luminance) buffer and swap the colour attribute.
  let heightColors: Float32Array;
  let grayColors: Float32Array;

  rebuild = (count: number) => {
    if (points) {
      points.geometry.dispose();
      scene.remove(points);
    }
    const { positions, colors } = generatePointCloud(count, { seed: 7 });
    heightColors = colors;
    grayColors = new Float32Array(colors.length);
    for (let i = 0; i < colors.length; i += 3) {
      const l = colors[i] * 0.299 + colors[i + 1] * 0.587 + colors[i + 2] * 0.114;
      grayColors[i] = grayColors[i + 1] = grayColors[i + 2] = l;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    points = new THREE.Points(geo, material);
    scene.add(points);
    countEl.textContent = count.toLocaleString();
    applyParams();
  };

  applyParams = () => {
    material.size = params.pointSize;
    material.sizeAttenuation = params.sizeAttenuation;
    // distanceFade is a WebGPU/TSL feature — no-op here (see doc 08).
    if (params.colorMode === "uniform") {
      material.vertexColors = false;
      material.color.set(params.uniformColor);
    } else {
      material.vertexColors = true;
      material.color.set(0xffffff);
      const src = params.colorMode === "grayscale" ? grayColors : heightColors;
      const attr = points.geometry.getAttribute("color") as THREE.BufferAttribute;
      attr.copyArray(src);
      attr.needsUpdate = true;
    }
    material.needsUpdate = true;
  };

  rebuild(params.pointCount);
  backendEl.textContent = "WebGL (fallback)";
  warnEl.style.display = "block";

  return { render: () => renderer.render(scene, camera), renderer };
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator;
  const { render, renderer } = hasWebGPU ? await initWebGPU() : initWebGL();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // GUI
  const gui = new GUI({ title: "08 · Point cloud" });
  gui
    .add(params, "pointCount", { "100k": 100_000, "500k": 500_000, "1M": 1_000_000 })
    .name("point count")
    .onChange((v: number) => rebuild(v));
  gui.add(params, "pointSize", 0.5, 8, 0.1).name("point size").onChange(applyParams);
  gui.add(params, "sizeAttenuation").name("size attenuation").onChange(applyParams);
  gui
    .add(params, "colorMode", ["height", "uniform", "grayscale"])
    .name("colour mode")
    .onChange(applyParams);
  gui.addColor(params, "uniformColor").name("uniform colour").onChange(applyParams);
  gui.add(params, "distanceFade", 0, 1, 0.01).name("distance fade").onChange(applyParams);

  // Resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // FPS counter (performance.now is fine in browser code).
  let frames = 0;
  let last = performance.now();
  function tick(): void {
    controls.update();
    render();
    frames++;
    const now = performance.now();
    if (now - last >= 500) {
      fpsEl.textContent = Math.round((frames * 1000) / (now - last)).toString();
      frames = 0;
      last = now;
    }
  }
  renderer.setAnimationLoop(tick);
}

main().catch((err) => {
  backendEl.textContent = "init failed";
  warnEl.style.display = "block";
  warnEl.textContent = "Point cloud init failed: " + (err as Error).message;
  console.error(err);
});
