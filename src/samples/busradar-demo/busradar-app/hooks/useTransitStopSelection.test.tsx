// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, renderHook } from "@testing-library/react";
import Observable from "ol/Observable";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import type { TransitStop } from "../api/transitStops";
import {
    ensureTransitStopFeature,
    SELECTED_TRANSIT_STOPS_LAYER_ID,
    setSelectedTransitStop,
    TRANSIT_STOPS_LAYER_ID
} from "../map/layers/transitStopsLayer";
import { useTransitStopSelection } from "./useTransitStopSelection";

function createMapHarness() {
    const mainStopsLayer = new VectorLayer({ source: new VectorSource() });
    const selectedStopsLayer = new VectorLayer({ source: new VectorSource() });
    const layerModels = new Map([
        [TRANSIT_STOPS_LAYER_ID, { olLayer: mainStopsLayer, setVisible: vi.fn() }],
        [SELECTED_TRANSIT_STOPS_LAYER_ID, { olLayer: selectedStopsLayer, setVisible: vi.fn() }]
    ]);
    const map = {
        layers: { getLayerById: (id: string) => layerModels.get(id) },
        olMap: new Observable()
    } as unknown as Parameters<typeof useTransitStopSelection>[0];
    return { map, mainStopsLayer, selectedStopsLayer };
}

function Wrapper(props: PropsWithChildren) {
    return <PackageContextProvider>{props.children}</PackageContextProvider>;
}

describe("useTransitStopSelection – Marker-Ownership", () => {
    it("erhält einen Nearest-Stops-Marker beim Ausschalten des normalen Haltestellen-Layers", () => {
        const harness = createMapHarness();
        const nearestStop: TransitStop = {
            stopId: "nearest",
            name: "Nearest",
            lonLat: [7.6, 51.9]
        };
        ensureTransitStopFeature(harness.mainStopsLayer, nearestStop);
        setSelectedTransitStop(
            harness.mainStopsLayer,
            harness.selectedStopsLayer,
            nearestStop.stopId
        );
        const { result } = renderHook(
            () =>
                useTransitStopSelection(harness.map, {
                    nearestStopsActiveRef: { current: false },
                    handleNearestStopsTransitStopClick: () => false
                }),
            { wrapper: Wrapper }
        );

        act(() => result.current.toggleTransitStopsLayer(false));

        expect(result.current.transitStopsLayerIsActive).toBe(false);
        expect(harness.selectedStopsLayer.getSource()?.getFeatures()).toHaveLength(1);
        expect(harness.selectedStopsLayer.getSource()?.getFeatures()[0]?.getId()).toBe("nearest");
    });
});
