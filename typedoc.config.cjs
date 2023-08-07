// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

const documentedPackages = [
    "experimental-packages/layout-sidebar",
    "experimental-packages/ol-layer-control",
    "experimental-packages/ol-map",
    "packages/authentication",
];

// See https://typedoc.org/options/
module.exports = {
    "name": "Open Pioneer Packages",
    "readme": "none",
    "out": "dist/docs",
    "entryPointStrategy": "packages",
    "entryPoints": documentedPackages.map(p => `src/${p}`),
    "skipErrorChecking": true,
    "validation": {
        "notExported": false,
        "invalidLink": true,
        "notDocumented": true
    }
};
