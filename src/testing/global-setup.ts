// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
if (typeof window !== "undefined") {
    // Running with mocked dom (happy-dom or jsdom)
    if (!globalThis.ResizeObserver) {
        const ResizeObserver = (await import("resize-observer-polyfill")).default;
        globalThis.ResizeObserver = ResizeObserver;
    }
}
