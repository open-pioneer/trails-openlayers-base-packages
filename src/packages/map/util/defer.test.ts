// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { defer } from "./defer";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.restoreAllMocks();
});

it("calls the function with a delay", () => {
    const impl = vi.fn(() => undefined);
    const _deferred = defer(impl);
    expect(impl).not.toHaveBeenCalled();

    vi.advanceTimersToNextTimer();
    expect(impl).toHaveBeenCalledTimes(1);
});

it("does not call the function when cancelled", () => {
    const impl = vi.fn(() => undefined);
    const deferred = defer(impl);
    expect(impl).not.toHaveBeenCalled();

    deferred.cancel();
    vi.advanceTimersToNextTimer();
    expect(impl).not.toHaveBeenCalled();
});

it("reschedules the function call when it wasn't already executed", () => {
    const impl = vi.fn(() => undefined);
    const deferred = defer(impl);
    expect(impl).not.toHaveBeenCalled();

    const success = deferred.reschedule();
    expect(success).toBe(true);

    vi.advanceTimersToNextTimer();
    expect(impl).toHaveBeenCalled();

    const success2 = deferred.reschedule();
    expect(success2).toBe(false);
});
