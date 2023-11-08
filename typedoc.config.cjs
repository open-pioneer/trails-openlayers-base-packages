// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-var-requires */
const { existsSync } = require("fs");

const documentedPackages = [
    "experimental-packages/layout-sidebar",
    "packages/map",
    "packages/map-test-utils",
    "packages/notifier",
    "packages/react-utils",
    "packages/authentication",
    "packages/coordinate-viewer",
    "packages/scale-viewer",
    "packages/basemap-switcher",
    "packages/map-navigation",
    "packages/measurement",
    "packages/ogc-features",
    "packages/overview-map"
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
