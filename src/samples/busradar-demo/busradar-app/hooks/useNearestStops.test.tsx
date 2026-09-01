// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { act, renderHook, waitFor } from "@testing-library/react";
import VectorLayer from "ol/layer/Vector";
import Observable from "ol/Observable";
import VectorSource from "ol/source/Vector";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadTransitDepartures } from "../api/transitDepartures";
import { loadTransitStops, type TransitStop } from "../api/transitStops";
import { NEAREST_STOPS_LINES_LAYER_ID } from "../map/layers/nearestStopsLayer";
import {
    SELECTED_TRANSIT_STOPS_LAYER_ID,
    TRANSIT_STOPS_LAYER_ID
} from "../map/layers/transitStopsLayer";
import { useNearestStops } from "./useNearestStops";

vi.mock("../api/transitStops", async (importOriginal) => {
    const original = await importOriginal<typeof import("../api/transitStops")>();
    return { ...original, loadTransitStops: vi.fn() };
});

vi.mock("../api/transitDepartures", async (importOriginal) => {
    const original = await importOriginal<typeof import("../api/transitDepartures")>();
    return { ...original, loadTransitDepartures: vi.fn() };
});

const STOPS: TransitStop[] = [
    { stopId: "stop-1", name: "Stop 1", lonLat: [0.0005, 0] },
    { stopId: "stop-2", name: "Stop 2", lonLat: [0.001, 0] },
    { stopId: "stop-3", name: "Stop 3", lonLat: [0.0015, 0] }
];

function createMapHarness() {
    const nearestSource = new VectorSource();
    const mainStopsLayer = new VectorLayer({ source: new VectorSource() });
    const selectedStopsLayer = new VectorLayer({ source: new VectorSource() });
    const layerModels = new Map([
        [
            NEAREST_STOPS_LINES_LAYER_ID,
            { olLayer: new VectorLayer({ source: nearestSource }), setVisible: vi.fn() }
        ],
        [TRANSIT_STOPS_LAYER_ID, { olLayer: mainStopsLayer, setVisible: vi.fn() }],
        [SELECTED_TRANSIT_STOPS_LAYER_ID, { olLayer: selectedStopsLayer, setVisible: vi.fn() }]
    ]);
    const olMap = new Observable();
    const map = {
        layers: {
            getLayerById: (id: string) => layerModels.get(id)
        },
        olMap,
        olView: {
            cancelAnimations: vi.fn(),
            animate: vi.fn()
        }
    } as unknown as Parameters<typeof useNearestStops>[0];

    return { map, olMap, nearestSource, mainStopsLayer, selectedStopsLayer };
}

function dispatchMapClick(olMap: Observable, coordinate: [number, number]) {
    olMap.dispatchEvent({ type: "singleclick", coordinate } as never);
}

beforeEach(() => {
    vi.mocked(loadTransitStops).mockResolvedValue(STOPS);
    vi.mocked(loadTransitDepartures).mockResolvedValue([]);
});

describe("useNearestStops – unabhängiger Panel-Lifecycle", () => {
    it("erhält Panel, Ergebnisse, Selection und Marker bei Toggle-off", async () => {
        const harness = createMapHarness();
        const activeRef = { current: false };
        const { result } = renderHook(() =>
            useNearestStops(harness.map, { nearestStopsActiveRef: activeRef })
        );

        act(() => result.current.toggleNearestStops());
        act(() => dispatchMapClick(harness.olMap, [0, 0]));
        await waitFor(() => expect(result.current.nearestStopsPanel?.status).toBe("success"));

        act(() => result.current.onOpenChange(["stop-2"]));
        await waitFor(() =>
            expect(result.current.departuresByStop["stop-2"]?.status).toBe("empty")
        );
        const panelBeforeToggle = result.current.nearestStopsPanel;
        const nearestFeatureCount = harness.nearestSource.getFeatures().length;

        expect(result.current.selectedStopId).toBe("stop-2");
        expect(result.current.openStopIds).toEqual(["stop-2"]);
        expect(harness.selectedStopsLayer.getSource()?.getFeatures()).toHaveLength(1);

        act(() => result.current.toggleNearestStops());

        expect(result.current.nearestStopsActive).toBe(false);
        expect(activeRef.current).toBe(false);
        expect(result.current.nearestStopsPanel).toBe(panelBeforeToggle);
        expect(result.current.openStopIds).toEqual(["stop-2"]);
        expect(result.current.selectedStopId).toBe("stop-2");
        expect(result.current.departuresByStop["stop-2"]?.status).toBe("empty");
        expect(harness.nearestSource.getFeatures()).toHaveLength(nearestFeatureCount);
        expect(harness.selectedStopsLayer.getSource()?.getFeatures()).toHaveLength(1);

        act(() => dispatchMapClick(harness.olMap, [100, 100]));
        expect(result.current.nearestStopsPanel).toBe(panelBeforeToggle);
    });

    it("wählt enthaltene Karten-Stopps im Panel und schließt bei einem fremden Stop", async () => {
        const harness = createMapHarness();
        const { result } = renderHook(() =>
            useNearestStops(harness.map, { nearestStopsActiveRef: { current: false } })
        );
        act(() => result.current.toggleNearestStops());
        act(() => dispatchMapClick(harness.olMap, [0, 0]));
        await waitFor(() => expect(result.current.nearestStopsPanel?.status).toBe("success"));
        act(() => result.current.toggleNearestStops());

        let handled = false;
        act(() => {
            handled = result.current.handleTransitStopClick("stop-2");
        });
        expect(handled).toBe(true);
        expect(result.current.selectedStopId).toBe("stop-2");
        expect(result.current.openStopIds).toContain("stop-2");
        expect(harness.selectedStopsLayer.getSource()?.getFeatures()[0]?.getId()).toBe("stop-2");

        act(() => {
            handled = result.current.handleTransitStopClick("outside");
        });
        expect(handled).toBe(false);
        expect(result.current.nearestStopsPanel).toBeUndefined();
        expect(result.current.selectedStopId).toBeUndefined();
        expect(result.current.openStopIds).toEqual([]);
        expect(harness.nearestSource.getFeatures()).toHaveLength(0);
        expect(harness.selectedStopsLayer.getSource()?.getFeatures()).toHaveLength(0);
    });

    it("räumt beim Close vollständig auf und lässt sich danach erneut aktivieren", async () => {
        const harness = createMapHarness();
        const { result } = renderHook(() =>
            useNearestStops(harness.map, { nearestStopsActiveRef: { current: false } })
        );
        act(() => result.current.toggleNearestStops());
        act(() => dispatchMapClick(harness.olMap, [0, 0]));
        await waitFor(() => expect(result.current.nearestStopsPanel?.status).toBe("success"));
        act(() => result.current.onOpenChange(["stop-1"]));

        act(() => result.current.closeNearestStops());

        expect(result.current.nearestStopsActive).toBe(false);
        expect(result.current.nearestStopsPanel).toBeUndefined();
        expect(result.current.selectedStopId).toBeUndefined();
        expect(result.current.openStopIds).toEqual([]);
        expect(result.current.departuresByStop).toEqual({});
        expect(harness.nearestSource.getFeatures()).toHaveLength(0);
        expect(harness.selectedStopsLayer.getSource()?.getFeatures()).toHaveLength(0);

        act(() => result.current.toggleNearestStops());
        act(() => dispatchMapClick(harness.olMap, [20, 20]));
        await waitFor(() => expect(result.current.nearestStopsPanel?.status).toBe("success"));
        expect(result.current.nearestStopsActive).toBe(true);
        expect(result.current.selectedStopId).toBeUndefined();
    });
});
