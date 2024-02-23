// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SpyInstance, afterEach, vi } from "vitest";

let consoleSpy: SpyInstance | undefined;
afterEach(() => {
    if (consoleSpy) {
        consoleSpy.mockRestore();
        consoleSpy = undefined;
    }
});

/**
 * Disables `act(...)` warnings from react during tests.
 *
 * This should only be used when it is too difficult to track down the
 * source of the warning (sometimes components behave weird).
 *
 * It is usually sufficient to surround a state change with `act(...)`.
 *
 * Note: this is only applied to the current test case; it will automatically be
 * enabled again after the test has finished.
 */
export function disableReactActWarnings() {
    if (consoleSpy) {
        return;
    }

    // HACK to hide act warnings (some components have weird behavior that
    // cannot be fixed by sprinkling 'act(...)' blocks).
    const errorfn = console.error;
    consoleSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
        if (
            typeof args[0] === "string" &&
            args[0].startsWith("Warning: An update to %s inside a test was not wrapped in act")
        ) {
            // Hide message
            return;
        }
        // Otherwise: call original method
        errorfn.call(console, ...args);
    });
}
