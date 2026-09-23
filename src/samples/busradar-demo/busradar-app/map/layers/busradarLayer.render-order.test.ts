// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import Feature, { type FeatureLike } from "ol/Feature";
import Point from "ol/geom/Point";
import type Style from "ol/style/Style";
import type { StyleFunction } from "ol/style/Style";
import { describe, expect, it } from "vitest";
import {
    BUSRADAR_SELECTED_VEHICLE_STYLE_Z_INDEX,
    BUSRADAR_VEHICLE_STYLE_Z_INDEX,
    compareBusradarRenderOrder,
    createBusradarLayer
} from "./busradarLayer";

// Feature-Eigenschaft, über die die Auswahl markiert wird (siehe createVehicleStyle).
const BUSRADAR_SELECTED_PROPERTY = "busradarSelected";

function busAt(y: number): Feature {
    // x fix, nur Y variiert: kleineres Y = südlich = auf dem Bildschirm weiter unten.
    return new Feature({ geometry: new Point([0, y]) });
}

function iconZIndexOf(style: Style | Style[]): number | undefined {
    const single = Array.isArray(style) ? style[0] : style;
    return single?.getZIndex();
}

describe("compareBusradarRenderOrder", () => {
    it("zeichnet den südlicheren (bildschirmunten) Bus zuletzt und damit oben", () => {
        const north = busAt(100);
        const south = busAt(50);

        const drawn = [north, south].sort(compareBusradarRenderOrder);

        // Zuletzt gezeichnetes Feature liegt oben.
        expect(drawn[drawn.length - 1]).toBe(south);
    });

    it("ist unabhängig von der Eingabereihenfolge stabil", () => {
        const north = busAt(100);
        const south = busAt(50);

        expect([north, south].sort(compareBusradarRenderOrder)[1]).toBe(south);
        expect([south, north].sort(compareBusradarRenderOrder)[1]).toBe(south);
    });

    it("wertet Nicht-Point-Geometrien neutral (Y = 0) und wirft nicht", () => {
        const point = busAt(10);
        const empty = new Feature();

        expect(() => compareBusradarRenderOrder(point, empty as FeatureLike)).not.toThrow();
        // point (Y=10, nördlich) vor empty (Y=0, südlicher) → empty zuletzt/oben.
        expect([point, empty as Feature].sort(compareBusradarRenderOrder)[1]).toBe(empty);
    });
});

describe("Auswahl bleibt trotz renderOrder über normalen Bussen", () => {
    it("nutzt für die Auswahl einen höheren Style-zIndex als für normale Busse", () => {
        // renderOrder sortiert nur innerhalb einer zIndex-Gruppe. Solange die Auswahl in einer
        // höheren Gruppe liegt, kann die neue Sortierung sie nie überstimmen.
        expect(BUSRADAR_SELECTED_VEHICLE_STYLE_Z_INDEX).toBeGreaterThan(
            BUSRADAR_VEHICLE_STYLE_Z_INDEX
        );
    });

    it("vergibt der ausgewählten Fahrt den höheren zIndex, unabhängig von der Bildschirmposition", () => {
        const layer = createBusradarLayer();
        const styleFunction = layer.getStyle() as StyleFunction;

        // Normaler Bus weit unten (südlich), ausgewählter Bus weiter oben (nördlich).
        const normalSouth = busAt(-1000);
        const selectedNorth = busAt(1000);
        selectedNorth.set(BUSRADAR_SELECTED_PROPERTY, true);

        const normalZIndex = iconZIndexOf(styleFunction(normalSouth, 1) as Style | Style[]);
        const selectedZIndex = iconZIndexOf(styleFunction(selectedNorth, 1) as Style | Style[]);

        expect(normalZIndex).toBe(BUSRADAR_VEHICLE_STYLE_Z_INDEX);
        expect(selectedZIndex).toBe(BUSRADAR_SELECTED_VEHICLE_STYLE_Z_INDEX);
        // Auch bei umgekehrter Bildschirmlage bleibt die Auswahl in der höheren Gruppe.
        expect(selectedZIndex!).toBeGreaterThan(normalZIndex!);
    });
});
