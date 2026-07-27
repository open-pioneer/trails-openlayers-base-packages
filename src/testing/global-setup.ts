// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/**
 * This file is automatically executed by vitest before the actual test suite is run.
 * See `vite.config.ts` and https://vitest.dev/config/#setupfiles
 */
import "@testing-library/jest-dom/vitest";

/* eslint-disable @typescript-eslint/no-explicit-any */

if (typeof window !== "undefined") {
    // Running with mocked dom (happy-dom or jsdom)
    if (!globalThis.ResizeObserver) {
        const ResizeObserver = (await import("resize-observer-polyfill")).default;
        globalThis.ResizeObserver = ResizeObserver;
    }

    // happy dom does not implement a good XML parser, use the one from jsdom instead.
    const { JSDOM } = await import("jsdom");
    window.DOMParser = new JSDOM().window.DOMParser;

    // These are used by OpenLayers to create a web worker (as a side effect during import...).
    // This is just the bare minimum to get the code running.
    (globalThis as any).Worker ??= function () {
        return {};
    };
    (globalThis.URL.createObjectURL as any) ??= () => new URL("https://example.com");
}
