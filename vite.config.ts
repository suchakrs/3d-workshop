import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Multi-page setup: one dev server / one build, each example is its own page.
// All 8 example entries are pre-wired here so example authors never touch this
// file (keeps their work in disjoint folders).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        "01": resolve(__dirname, "examples/01-space-transforms/index.html"),
        "01-2": resolve(__dirname, "examples/01-2-transform-matrix/index.html"),
        "02": resolve(__dirname, "examples/02-topology/index.html"),
        "03": resolve(__dirname, "examples/03-materials/index.html"),
        "04": resolve(__dirname, "examples/04-lighting/index.html"),
        "05": resolve(__dirname, "examples/05-cameras/index.html"),
        "06": resolve(__dirname, "examples/06-threejs-vanilla/index.html"),
        "07": resolve(__dirname, "examples/07-react-three-fiber/index.html"),
        "08": resolve(__dirname, "examples/08-pointcloud-webgpu/index.html"),
      },
    },
  },
});
