// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { type MapModel } from "@open-pioneer/map";
import { describe, expect, it } from "vitest";
import { getSelectedTransitStopsVectorLayer, getTransitStopsVectorLayer } from "./layerAccess";
import { SELECTED_TRANSIT_STOPS_LAYER_ID, TRANSIT_STOPS_LAYER_ID } from "./transitStopsLayer";

/** Erzeugt ein minimales MapModel-Stub, das `layers.getLayerById` nach einer festen Tabelle bedient. */
function createMapStub(layersById: Record<string, { olLayer?: unknown } | undefined>): MapModel {
    return {
        layers: {
            getLayerById: (id: string) => layersById[id]
        }
    } as unknown as MapModel;
}

describe("getTransitStopsVectorLayer", () => {
    it("löst den Haupt-Haltestellen-Layer über die ID auf", () => {
        const olLayer = { id: "main" };
        const map = createMapStub({ [TRANSIT_STOPS_LAYER_ID]: { olLayer } });
        expect(getTransitStopsVectorLayer(map)).toBe(olLayer);
    });

    it("gibt undefined zurück, wenn keine Map vorhanden ist", () => {
        expect(getTransitStopsVectorLayer(undefined)).toBeUndefined();
    });

    it("gibt undefined zurück, wenn der Layer nicht existiert", () => {
        const map = createMapStub({});
        expect(getTransitStopsVectorLayer(map)).toBeUndefined();
    });
});

describe("getSelectedTransitStopsVectorLayer", () => {
    it("löst den Selected-Stop-Layer über die eigene ID auf", () => {
        const olLayer = { id: "selected" };
        const map = createMapStub({ [SELECTED_TRANSIT_STOPS_LAYER_ID]: { olLayer } });
        expect(getSelectedTransitStopsVectorLayer(map)).toBe(olLayer);
    });

    it("gibt undefined zurück, wenn keine Map vorhanden ist", () => {
        expect(getSelectedTransitStopsVectorLayer(undefined)).toBeUndefined();
    });
});
