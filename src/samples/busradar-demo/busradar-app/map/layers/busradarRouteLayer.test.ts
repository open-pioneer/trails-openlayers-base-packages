// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import VectorSource from "ol/source/Vector";
import { describe, expect, it } from "vitest";
import type { BusradarRouteSplit } from "./busradarLayer";
import { renderBusradarRoute } from "./busradarRouteLayer";

function routePartsOf(source: VectorSource) {
    return source.getFeatures().map((feature) => feature.get("routePart"));
}

function makeRouteSplit(overrides: Partial<BusradarRouteSplit>): BusradarRouteSplit {
    return {
        route: { mapCoordinates: [] },
        passedCoordinates: [],
        upcomingCoordinates: [],
        ...overrides
    } as BusradarRouteSplit;
}

describe("renderBusradarRoute", () => {
    it("leert die Source ohne routeSplit", () => {
        const source = new VectorSource();
        renderBusradarRoute(
            source,
            makeRouteSplit({
                passedCoordinates: [
                    [0, 0],
                    [1, 1]
                ]
            })
        );
        expect(source.getFeatures().length).toBe(1);

        renderBusradarRoute(source, undefined);
        expect(source.getFeatures().length).toBe(0);
    });

    it("zeichnet den gefahrenen Teil bei mindestens zwei passed-Koordinaten", () => {
        const source = new VectorSource();
        renderBusradarRoute(
            source,
            makeRouteSplit({
                passedCoordinates: [
                    [0, 0],
                    [1, 1]
                ]
            })
        );
        expect(routePartsOf(source)).toContain("passed");
    });

    it("zeichnet den kommenden Teil inkl. Richtungspfeilen", () => {
        const source = new VectorSource();
        renderBusradarRoute(
            source,
            makeRouteSplit({
                upcomingCoordinates: [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [3, 0],
                    [4, 0],
                    [5, 0]
                ]
            })
        );
        const parts = routePartsOf(source);
        expect(parts).toContain("upcoming");
        expect(parts).toContain("direction");
    });

    it("nutzt die volle Route als Fallback ohne kommenden Teil", () => {
        const source = new VectorSource();
        renderBusradarRoute(
            source,
            makeRouteSplit({
                route: {
                    mapCoordinates: [
                        [0, 0],
                        [1, 1]
                    ]
                } as BusradarRouteSplit["route"]
            })
        );
        expect(routePartsOf(source)).toEqual(["full"]);
    });

    it("bleibt leer, wenn keine Teilstrecke genügend Koordinaten hat", () => {
        const source = new VectorSource();
        renderBusradarRoute(
            source,
            makeRouteSplit({
                passedCoordinates: [[0, 0]],
                upcomingCoordinates: [[1, 1]],
                route: { mapCoordinates: [[2, 2]] } as BusradarRouteSplit["route"]
            })
        );
        expect(source.getFeatures().length).toBe(0);
    });
});
