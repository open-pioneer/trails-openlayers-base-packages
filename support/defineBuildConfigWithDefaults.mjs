// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig as defineBuildConfigImpl } from "@open-pioneer/build-support";
import { resolve } from "node:path";

const SHARED_LICENSE_FILE = resolve(import.meta.dirname, "../LICENSE");

/**
 * Wrapper around `defineBuildConfig` to enforce shared defaults for public packages.
 *
 * NOTE: This needs to be a JavaScript file at this time (`build.config.mjs` does not support TypeScript for now).
 *
 * @param {import("@open-pioneer/build-support").BuildConfig} options
 * @returns {import("@open-pioneer/build-support").BuildConfig}
 */
export function defineBuildConfigWithDefaults(options) {
    return defineBuildConfigImpl({
        ...options,
        publishConfig: {
            licenseFile: SHARED_LICENSE_FILE,
            ...options?.publishConfig
        }
    });
}
