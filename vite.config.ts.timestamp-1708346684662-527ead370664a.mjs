// vite.config.ts
import { pioneer } from "file:///C:/Projekte/OpenPioneer/trails-openlayers-base-packages/node_modules/.pnpm/@open-pioneer+vite-plugin-pioneer@2.0.0_@open-pioneer+runtime@2.1.1_sass@1.69.7_vite@4.5.2/node_modules/@open-pioneer/vite-plugin-pioneer/dist/index.js";
import react from "file:///C:/Projekte/OpenPioneer/trails-openlayers-base-packages/node_modules/.pnpm/@vitejs+plugin-react-swc@3.5.0_vite@4.5.2/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { resolve } from "node:path";
import { defineConfig } from "file:///C:/Projekte/OpenPioneer/trails-openlayers-base-packages/node_modules/.pnpm/vite@4.5.2_@types+node@16.18.68_sass@1.69.7/node_modules/vite/dist/node/index.js";
import eslint from "file:///C:/Projekte/OpenPioneer/trails-openlayers-base-packages/node_modules/.pnpm/vite-plugin-eslint@1.8.1_eslint@8.56.0_vite@4.5.2/node_modules/vite-plugin-eslint/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\Projekte\\OpenPioneer\\trails-openlayers-base-packages";
var targets = ["chrome92", "edge92", "firefox91", "safari14"];
var sampleSites = [
  "samples/map-sample",
  "samples/auth-sample",
  "samples/notify-sample",
  "samples/ogc-api-sample",
  "samples/theming-sample",
  "samples/test-basemap-switcher",
  "samples/test-toc",
  "samples/test-highlight-and-zoom",
  "samples/test-menu-fix",
  "samples/experimental-sidebar"
];
var vite_config_default = defineConfig(({ mode }) => {
  const devMode = mode === "development";
  const logLevel = devMode ? "INFO" : "WARN";
  return {
    root: resolve(__vite_injected_original_dirname, "src"),
    // Generates relative urls in html etc.
    base: "./",
    // Vite's build output is written to dist/www
    build: {
      outDir: resolve(__vite_injected_original_dirname, "dist/www"),
      emptyOutDir: true,
      target: targets
    },
    plugins: [
      pioneer({
        // Whether to include src/index.html in the built output
        rootSite: true,
        // Additional directories to include as html (must contain index.html files)
        sites: [
          // Include sample sites in the build
          ...sampleSites
        ],
        // Apps to distribute as .js files for embedded use cases
        apps: []
      }),
      react({
        // react swc plugin transpiles during development.
        // using a recent target allows for better debugging of recent features like private properties (`this.#abc`)
        devTarget: "es2022"
      }),
      eslint()
    ],
    // define global constants
    // See also: https://vitejs.dev/config/shared-options.html#define
    define: {
      __LOG_LEVEL__: JSON.stringify(logLevel)
    },
    // https://vitest.dev/config/
    test: {
      globals: true,
      environment: "happy-dom",
      setupFiles: ["testing/global-setup.ts"]
    }
    // disable hot reloading
    // in dev mode press "r" to trigger reload and make changes active
    // See also: https://vitejs.dev/config/server-options.html#server-hmr
    /*server: {
        hmr: false
    }*/
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxQcm9qZWt0ZVxcXFxPcGVuUGlvbmVlclxcXFx0cmFpbHMtb3BlbmxheWVycy1iYXNlLXBhY2thZ2VzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxQcm9qZWt0ZVxcXFxPcGVuUGlvbmVlclxcXFx0cmFpbHMtb3BlbmxheWVycy1iYXNlLXBhY2thZ2VzXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Qcm9qZWt0ZS9PcGVuUGlvbmVlci90cmFpbHMtb3BlbmxheWVycy1iYXNlLXBhY2thZ2VzL3ZpdGUuY29uZmlnLnRzXCI7Ly8gU1BEWC1GaWxlQ29weXJpZ2h0VGV4dDogMjAyMyBPcGVuIFBpb25lZXIgcHJvamVjdCAoaHR0cHM6Ly9naXRodWIuY29tL29wZW4tcGlvbmVlcilcbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBcGFjaGUtMi4wXG5cbi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwidml0ZXN0XCIgLz5cbmltcG9ydCB7IHBpb25lZXIgfSBmcm9tIFwiQG9wZW4tcGlvbmVlci92aXRlLXBsdWdpbi1waW9uZWVyXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgZXNsaW50IGZyb20gXCJ2aXRlLXBsdWdpbi1lc2xpbnRcIjtcblxuLy8gTWluaW11bSBicm93c2VyIHZlcnNpb25zIHN1cHBvcnRlZCBieSBnZW5lcmF0ZWQgSlMvQ1NTXG4vLyBTZWUgYWxzbzpcbi8vIC0gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9idWlsZC1vcHRpb25zLmh0bWwjYnVpbGQtdGFyZ2V0XG4vLyAtIGh0dHBzOi8vZXNidWlsZC5naXRodWIuaW8vYXBpLyN0YXJnZXRcbmNvbnN0IHRhcmdldHMgPSBbXCJjaHJvbWU5MlwiLCBcImVkZ2U5MlwiLCBcImZpcmVmb3g5MVwiLCBcInNhZmFyaTE0XCJdO1xuXG5jb25zdCBzYW1wbGVTaXRlcyA9IFtcbiAgICBcInNhbXBsZXMvbWFwLXNhbXBsZVwiLFxuICAgIFwic2FtcGxlcy9hdXRoLXNhbXBsZVwiLFxuICAgIFwic2FtcGxlcy9ub3RpZnktc2FtcGxlXCIsXG4gICAgXCJzYW1wbGVzL29nYy1hcGktc2FtcGxlXCIsXG4gICAgXG4gICAgXCJzYW1wbGVzL3RoZW1pbmctc2FtcGxlXCIsXG4gICAgXCJzYW1wbGVzL3Rlc3QtYmFzZW1hcC1zd2l0Y2hlclwiLFxuICAgIFwic2FtcGxlcy90ZXN0LXRvY1wiLFxuICAgIFwic2FtcGxlcy90ZXN0LWhpZ2hsaWdodC1hbmQtem9vbVwiLFxuICAgIFwic2FtcGxlcy90ZXN0LW1lbnUtZml4XCIsXG5cbiAgICBcInNhbXBsZXMvZXhwZXJpbWVudGFsLXNpZGViYXJcIixcbl07XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gICAgY29uc3QgZGV2TW9kZSA9IG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIjtcblxuICAgIC8vIEFsbG93ZWQgdmFsdWVzIGFyZSBcIkRFQlVHXCIsIFwiSU5GT1wiLCBcIldBUk5cIiwgXCJFUlJPUlwiXG4gICAgY29uc3QgbG9nTGV2ZWwgPSBkZXZNb2RlID8gXCJJTkZPXCIgOiBcIldBUk5cIjtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJvb3Q6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyY1wiKSxcblxuICAgICAgICAvLyBHZW5lcmF0ZXMgcmVsYXRpdmUgdXJscyBpbiBodG1sIGV0Yy5cbiAgICAgICAgYmFzZTogXCIuL1wiLFxuXG4gICAgICAgIC8vIFZpdGUncyBidWlsZCBvdXRwdXQgaXMgd3JpdHRlbiB0byBkaXN0L3d3d1xuICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgb3V0RGlyOiByZXNvbHZlKF9fZGlybmFtZSwgXCJkaXN0L3d3d1wiKSxcbiAgICAgICAgICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXRzXG4gICAgICAgIH0sXG5cbiAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgcGlvbmVlcih7XG4gICAgICAgICAgICAgICAgLy8gV2hldGhlciB0byBpbmNsdWRlIHNyYy9pbmRleC5odG1sIGluIHRoZSBidWlsdCBvdXRwdXRcbiAgICAgICAgICAgICAgICByb290U2l0ZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgIC8vIEFkZGl0aW9uYWwgZGlyZWN0b3JpZXMgdG8gaW5jbHVkZSBhcyBodG1sIChtdXN0IGNvbnRhaW4gaW5kZXguaHRtbCBmaWxlcylcbiAgICAgICAgICAgICAgICBzaXRlczogW1xuICAgICAgICAgICAgICAgICAgICAvLyBJbmNsdWRlIHNhbXBsZSBzaXRlcyBpbiB0aGUgYnVpbGRcbiAgICAgICAgICAgICAgICAgICAgLi4uc2FtcGxlU2l0ZXNcbiAgICAgICAgICAgICAgICBdLFxuXG4gICAgICAgICAgICAgICAgLy8gQXBwcyB0byBkaXN0cmlidXRlIGFzIC5qcyBmaWxlcyBmb3IgZW1iZWRkZWQgdXNlIGNhc2VzXG4gICAgICAgICAgICAgICAgYXBwczogW11cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgcmVhY3Qoe1xuICAgICAgICAgICAgICAgIC8vIHJlYWN0IHN3YyBwbHVnaW4gdHJhbnNwaWxlcyBkdXJpbmcgZGV2ZWxvcG1lbnQuXG4gICAgICAgICAgICAgICAgLy8gdXNpbmcgYSByZWNlbnQgdGFyZ2V0IGFsbG93cyBmb3IgYmV0dGVyIGRlYnVnZ2luZyBvZiByZWNlbnQgZmVhdHVyZXMgbGlrZSBwcml2YXRlIHByb3BlcnRpZXMgKGB0aGlzLiNhYmNgKVxuICAgICAgICAgICAgICAgIGRldlRhcmdldDogXCJlczIwMjJcIlxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBlc2xpbnQoKVxuICAgICAgICBdLFxuXG4gICAgICAgIC8vIGRlZmluZSBnbG9iYWwgY29uc3RhbnRzXG4gICAgICAgIC8vIFNlZSBhbHNvOiBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL3NoYXJlZC1vcHRpb25zLmh0bWwjZGVmaW5lXG4gICAgICAgIGRlZmluZToge1xuICAgICAgICAgICAgX19MT0dfTEVWRUxfXzogSlNPTi5zdHJpbmdpZnkobG9nTGV2ZWwpXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gaHR0cHM6Ly92aXRlc3QuZGV2L2NvbmZpZy9cbiAgICAgICAgdGVzdDoge1xuICAgICAgICAgICAgZ2xvYmFsczogdHJ1ZSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiBcImhhcHB5LWRvbVwiLFxuICAgICAgICAgICAgc2V0dXBGaWxlczogW1widGVzdGluZy9nbG9iYWwtc2V0dXAudHNcIl1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRpc2FibGUgaG90IHJlbG9hZGluZ1xuICAgICAgICAvLyBpbiBkZXYgbW9kZSBwcmVzcyBcInJcIiB0byB0cmlnZ2VyIHJlbG9hZCBhbmQgbWFrZSBjaGFuZ2VzIGFjdGl2ZVxuICAgICAgICAvLyBTZWUgYWxzbzogaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9zZXJ2ZXItb3B0aW9ucy5odG1sI3NlcnZlci1obXJcbiAgICAgICAgLypzZXJ2ZXI6IHtcbiAgICAgICAgICAgIGhtcjogZmFsc2VcbiAgICAgICAgfSovXG4gICAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUlBLFNBQVMsZUFBZTtBQUN4QixPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sWUFBWTtBQVJuQixJQUFNLG1DQUFtQztBQWN6QyxJQUFNLFVBQVUsQ0FBQyxZQUFZLFVBQVUsYUFBYSxVQUFVO0FBRTlELElBQU0sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0o7QUFHQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN0QyxRQUFNLFVBQVUsU0FBUztBQUd6QixRQUFNLFdBQVcsVUFBVSxTQUFTO0FBRXBDLFNBQU87QUFBQSxJQUNILE1BQU0sUUFBUSxrQ0FBVyxLQUFLO0FBQUE7QUFBQSxJQUc5QixNQUFNO0FBQUE7QUFBQSxJQUdOLE9BQU87QUFBQSxNQUNILFFBQVEsUUFBUSxrQ0FBVyxVQUFVO0FBQUEsTUFDckMsYUFBYTtBQUFBLE1BQ2IsUUFBUTtBQUFBLElBQ1o7QUFBQSxJQUVBLFNBQVM7QUFBQSxNQUNMLFFBQVE7QUFBQTtBQUFBLFFBRUosVUFBVTtBQUFBO0FBQUEsUUFHVixPQUFPO0FBQUE7QUFBQSxVQUVILEdBQUc7QUFBQSxRQUNQO0FBQUE7QUFBQSxRQUdBLE1BQU0sQ0FBQztBQUFBLE1BQ1gsQ0FBQztBQUFBLE1BQ0QsTUFBTTtBQUFBO0FBQUE7QUFBQSxRQUdGLFdBQVc7QUFBQSxNQUNmLENBQUM7QUFBQSxNQUNELE9BQU87QUFBQSxJQUNYO0FBQUE7QUFBQTtBQUFBLElBSUEsUUFBUTtBQUFBLE1BQ0osZUFBZSxLQUFLLFVBQVUsUUFBUTtBQUFBLElBQzFDO0FBQUE7QUFBQSxJQUdBLE1BQU07QUFBQSxNQUNGLFNBQVM7QUFBQSxNQUNULGFBQWE7QUFBQSxNQUNiLFlBQVksQ0FBQyx5QkFBeUI7QUFBQSxJQUMxQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUo7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
