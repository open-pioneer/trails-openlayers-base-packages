// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
export interface DeferredExecution {
    /**
     * Re-schedule execution of `func` (if it was not already executed).
     * Returns true on success, false otherwise.
     */
    reschedule(): boolean;

    /**
     * Cancels the pending execution (if it is still pending).
     */
    cancel(): void;
}

/**
 * Calls `func` at a slightly later time.
 *
 * The returned object can be used to re-schedule or cancel the execution of `func`.
 * However, `func` will be executed at most once.
 */
export function defer(func: () => void): DeferredExecution {
    let executed = false;
    let timeout: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
        executed = true;
        timeout = undefined;
        func();
    });
    return {
        reschedule() {
            // Do nothing: if not executed, the timeout is still pending
            // and it will run in the future.
            return !executed;
        },
        cancel() {
            if (timeout) {
                clearTimeout(timeout);
            }
        }
    };
}
