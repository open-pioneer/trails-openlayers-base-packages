// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-var-requires */
const { existsSync } = require("fs");

const documentedPackages = [
    "experimental-packages/layout-sidebar",
    "experimental-packages/ol-layer-control",
    "packages/map",
    "packages/map-test-utils",
    "packages/notifier",
    "packages/react-utils",
    "packages/authentication",
    "packages/coordinate-viewer",
    "packages/scale-viewer",
    "packages/basemap-switcher",
    "packages/initial-extent",
    "packages/zoom"
];

const packagePaths = documentedPackages.map((p) => `src/${p}`);
for (const path of packagePaths) {
    if (!existsSync(path)) {
        throw new Error("Package does not exist: " + path);
    }
}

// See https://typedoc.org/options/
module.exports = {
    name: "Open Pioneer Packages",
    readme: "none",
    out: "dist/docs",
    entryPointStrategy: "packages",
    entryPoints: packagePaths,
    skipErrorChecking: true,
    validation: {
        notExported: false,
        invalidLink: true,
        notDocumented: true
    }
};
