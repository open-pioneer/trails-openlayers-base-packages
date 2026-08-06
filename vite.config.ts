// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { dirname, resolve } from "node:path";
import { pioneer } from "@open-pioneer/vite-plugin-pioneer";
import react from "@vitejs/plugin-react";
import glob from "fast-glob";
import { defineConfig } from "vite";
import { dependencySourcemaps } from "./support/vite/dependency-sourcemaps";

// Find sites under src/samples with an index.html and build them all.
const sampleSites = glob
    .sync("samples/*/index.html", {
        cwd: "src"
    })
    .map((indexHtml) => dirname(indexHtml));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const devMode = mode === "development";

    // Allowed values are "DEBUG", "INFO", "WARN", "ERROR"
    const logLevel = devMode ? "INFO" : "WARN";

    return {
        root: resolve(__dirname, "src"),

        // Load .env files from this directory instead of `root`.
        envDir: __dirname,

        // Generates relative urls in html etc.
        base: "./",

        // Vite's build output is written to dist/www
        build: {
            outDir: resolve(__dirname, "dist/www"),
            emptyOutDir: true,

            // Minimum browser versions supported by generated JS/CSS
            // See also:
            // - https://vitejs.dev/config/build-options.html#build-target
            target: "baseline-widely-available"
        },

        optimizeDeps: {
            // Include services.ts files as entry points.
            // This makes it easier for vite's dev server to find dependencies,
            // and thereby reduces the number of repeated bundler executions on dev server startup.
            entries: ["**/*.html", "**/services.{ts,js}", "!**/dist/**"],

            rolldownOptions: {
                // Preserve dependency source maps through pre-bundling (see plugin for details).
                // You can disable this if you don't need to see the source code of dependencies when debugging.
                plugins: [dependencySourcemaps()]
            }
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
                apps: {
                    "showcase": "samples/showcase/showcase-app/app.ts",
                    "sample-app": "samples/map-sample/ol-app/app.ts"
                }
            }),
            react()
        ],

        // Ignore irrelevant deprecations
        css: {
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: ["import"]
                }
            }
        },

        // define global constants
        // See also: https://vitejs.dev/config/shared-options.html#define
        define: {
            __LOG_LEVEL__: JSON.stringify(logLevel),
            __BUILD_TIMESTAMP__: JSON.stringify(new Date().getTime()) // used for timestamp in `src/index.html`
        },

        // https://vitest.dev/config/
        test: {
            globals: true,
            environment: "happy-dom",
            silent: "passed-only",
            setupFiles: ["testing/global-setup.ts"],
            server: {
                deps: {
                    // Workaround to fix some import issues, see
                    // https://github.com/open-pioneer/trails-openlayers-base-packages/issues/314
                    inline: [/@open-pioneer[/\\]/, /ol\//]
                }
            }
        }

        // disable hot reloading
        // in dev mode press "r" to trigger reload and make changes active
        // See also: https://vitejs.dev/config/server-options.html#server-hmr
        /*server: {
            hmr: false
        }*/
    };
});
