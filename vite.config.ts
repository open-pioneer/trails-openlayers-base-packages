// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/// <reference types="vitest" />
import { pioneer } from "@open-pioneer/vite-plugin-pioneer";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";

// Minimum browser versions supported by generated JS/CSS
// See also:
// - https://vitejs.dev/config/build-options.html#build-target
// - https://esbuild.github.io/api/#target
const targets = ["chrome92", "edge92", "firefox91", "safari14"];

const sampleSites = [
    "samples/map-sample",
    "samples/auth-sample",
    "samples/notify-sample",
    "samples/ogc-api-sample",
    
    "samples/theming-sample",
    "samples/test-basemap-switcher",
    "samples/test-toc",
    "samples/test-highlight-and-zoom",
    "samples/test-menu-fix",
    "samples/test-result-list",

    "samples/experimental-sidebar",
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const devMode = mode === "development";

    // Allowed values are "DEBUG", "INFO", "WARN", "ERROR"
    const logLevel = devMode ? "INFO" : "WARN";

    return {
        root: resolve(__dirname, "src"),

        // Generates relative urls in html etc.
        base: "./",

        // Vite's build output is written to dist/www
        build: {
            outDir: resolve(__dirname, "dist/www"),
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
