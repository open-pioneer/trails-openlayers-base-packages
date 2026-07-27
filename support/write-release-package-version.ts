// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { $, ProcessOutput } from "zx";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const RELEASE_PACKAGE_NAME = "@open-pioneer/map"; // candidate for checking the new package version for root
const ROOT_PACKAGE_JSON_PATH = resolve("package.json");

type PnpmListEntry = Partial<{
    name: string;
    version: string;
}>;

function extractPackageVersion(processOutput: ProcessOutput, packageName: string): string {
    const parsed: PnpmListEntry[] = processOutput.json();

    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error(`Package '${packageName}' not found.`);
    }

    const runtimePackage = parsed.find((entry) => entry?.name === packageName);
    if (!runtimePackage?.version) {
        throw new Error(`Version of ${packageName} could not be read`);
    }

    return runtimePackage.version;
}

async function writeRootVersion(version: string): Promise<void> {
    const rawRootPackageJson = await readFile(ROOT_PACKAGE_JSON_PATH, "utf8");

    let rootPackageJson: Record<string, unknown>;
    try {
        rootPackageJson = JSON.parse(rawRootPackageJson) as Record<string, unknown>;
    } catch (error) {
        throw new Error(
            `Root package.json parsing error: ${error instanceof Error ? error.message : String(error)}`
        );
    }

    rootPackageJson.version = version;
    await writeFile(
        ROOT_PACKAGE_JSON_PATH,
        `${JSON.stringify(rootPackageJson, null, 4)}\n`,
        "utf8"
    );
}

async function main(): Promise<void> {
    const lsResult = await $`pnpm ls --filter ${RELEASE_PACKAGE_NAME} --depth -1 --json`;
    const version = extractPackageVersion(lsResult, RELEASE_PACKAGE_NAME);

    await writeRootVersion(version);
    console.log(`Updated root package.json version to ${version}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
