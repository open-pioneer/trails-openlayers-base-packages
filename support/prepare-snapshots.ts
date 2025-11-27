// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { $ } from "zx";
import { readFile, writeFile } from "fs/promises";

/*
    This script rewrites the dependencies in package.json files to use "workspace:*".

    This is called when publishing snapshot artifacts so that their packages depend on fixed versions.
    Otherwise, package managers would install the latest version according to the npm registry, which might be from a different branch:

    For example:

    - 4.0.0-dev.20250512082657                  
    - 4.0.0-dev-chakra-v3.20250423124703

    The first version is newer (date wise) but the other version is greater (semver wise).
*/
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});

async function main() {
    const packages = await findPackages();
    for (const pkg of packages) {
        const packageJsonPath = `${pkg}/package.json`;
        const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
        const rewrittenPackageJson = rewriteDependencies(packageJson);
        await writeFile(
            packageJsonPath,
            JSON.stringify(rewrittenPackageJson, undefined, 4),
            "utf-8"
        );
    }
}

async function findPackages() {
    const packagesJson = (await $`pnpm ls -r --depth -1 --json`).stdout;
    const packages = JSON.parse(packagesJson) as PackageInfo[];
    return packages.map((p) => p.path);
}

const DEPENDENCY_FIELDS = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies"
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rewriteDependencies(packageJson: any): any {
    for (const field of DEPENDENCY_FIELDS) {
        const deps = packageJson[field];
        if (!deps) {
            continue;
        }

        for (const [name, version] of Object.entries(deps)) {
            if (typeof version === "string" && version.startsWith("workspace:")) {
                deps[name] = "workspace:*";
            }
        }
    }
    return packageJson;
}

interface PackageInfo {
    name: string;
    path: string; // directory path
}
