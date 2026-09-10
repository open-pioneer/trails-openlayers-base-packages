// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { NearestStopResult } from "../utils/nearestStops";
import { NearestStopsPanel } from "./NearestStopsPanel";

const RESULTS: NearestStopResult[] = [
    {
        stop: { stopId: "stop-1", name: "Stop 1", lonLat: [7.6, 51.9] },
        distanceMeters: 100
    },
    {
        stop: { stopId: "stop-2", name: "Stop 2", lonLat: [7.61, 51.91] },
        distanceMeters: 200
    }
];

describe("NearestStopsPanel – Selection und Close", () => {
    it("zeigt aria-current für die Panel-Selection und delegiert den expliziten Close", () => {
        const onClose = vi.fn();
        render(
            <PackageContextProvider>
                <NearestStopsPanel
                    state={{ status: "success", results: RESULTS }}
                    onClose={onClose}
                    selectedStopId="stop-2"
                    openStopIds={["stop-2"]}
                    onOpenChange={vi.fn()}
                    departuresByStop={{ "stop-2": { status: "empty" } }}
                    retryDepartures={vi.fn()}
                />
            </PackageContextProvider>
        );

        const selectedTrigger = screen.getAllByRole("button", {
            name: "nearestStops.itemAriaLabel"
        })[1];
        expect(selectedTrigger).toHaveAttribute("aria-current", "true");
        expect(selectedTrigger).toHaveAttribute("aria-expanded", "true");

        fireEvent.click(screen.getByRole("button", { name: "transitStops.close" }));
        expect(onClose).toHaveBeenCalledOnce();
    });
});
