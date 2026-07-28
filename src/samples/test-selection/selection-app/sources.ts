// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { SelectionResult, SelectionSource, SelectionSourceStatus } from "@open-pioneer/selection";

/**
 * A source that never returns any results.
 * Used to demonstrate the different selection source states (available / unavailable).
 */
export class DummySource implements SelectionSource {
    readonly id: string;
    readonly label: string;
    readonly status: SelectionSourceStatus;

    constructor(options: { id: string; label: string; status?: SelectionSourceStatus }) {
        this.id = options.id;
        this.label = options.label;
        this.status = options.status ?? "available";
    }

    async select(): Promise<SelectionResult[]> {
        return [];
    }
}

/**
 * A source that always fails.
 */
export class FailingSelectionSource implements SelectionSource {
    readonly id = "failing";
    readonly label = "Broken source (always fails)";

    async select(): Promise<SelectionResult[]> {
        throw new Error("This source fails on purpose.");
    }
}
