// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { describe, expect, it } from "vitest";
import { applyTransitStopRouteHighlight, createTransitStopsLayer } from "./transitStopsLayer";

function stopFeature(stopId: string) {
    const feature = new Feature({
        geometry: new Point([0, 0]),
        stopId
    });
    feature.setId(stopId);
    return feature;
}

describe("applyTransitStopRouteHighlight", () => {
    it("markiert Routenhalte, den nächsten Halt und dimmt andere Haltestellen", () => {
        const layer = createTransitStopsLayer();
        const source = layer.getSource()!;
        source.addFeatures([stopFeature("route-1"), stopFeature("next"), stopFeature("other")]);

        applyTransitStopRouteHighlight(layer, ["route-1", "next"], "next");

        expect(source.getFeatureById("route-1")!.get("transitStopRouteState")).toBe("route");
        expect(source.getFeatureById("next")!.get("transitStopRouteState")).toBe("next");
        expect(source.getFeatureById("other")!.get("transitStopRouteState")).toBe("dimmed");
    });

    it("setzt bei einer leeren Stopliste alle Haltestellen in den normalen Zustand zurück", () => {
        const layer = createTransitStopsLayer();
        const source = layer.getSource()!;
        source.addFeatures([stopFeature("route-1"), stopFeature("other")]);
        applyTransitStopRouteHighlight(layer, ["route-1"]);

        applyTransitStopRouteHighlight(layer, []);

        expect(source.getFeatureById("route-1")!.get("transitStopRouteState")).toBeUndefined();
        expect(source.getFeatureById("other")!.get("transitStopRouteState")).toBeUndefined();
        expect(source.get("transitStopRouteHighlightStopIds")).toBeUndefined();
        expect(source.get("transitStopRouteHighlightNextStopId")).toBeUndefined();
    });
});
