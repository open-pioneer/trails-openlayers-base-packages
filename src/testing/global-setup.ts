// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * This file is automatically executed by vitest before the actual test suite is run.
 * See `vite.config.ts` and https://vitest.dev/config/#setupfiles
 */

if (typeof window !== "undefined") {
    // Running with mocked dom (happy-dom or jsdom)
    if (!globalThis.ResizeObserver) {
        const ResizeObserver = (await import("resize-observer-polyfill")).default;
        globalThis.ResizeObserver = ResizeObserver;
    }
}
