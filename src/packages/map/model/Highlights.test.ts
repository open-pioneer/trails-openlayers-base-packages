// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it } from "vitest";
import OlMap from "ol/Map";
import { Highlights } from "./Highlights";
import { LineString, Point, Polygon } from "ol/geom";
import View from "ol/View";
import { approximatelyEquals } from "ol/extent";

let _highlights: Highlights | undefined;
afterEach(() => {
    _highlights?.destroy();
    _highlights = undefined;
});

it("should successfully zoom and add marker for point geometries", async () => {
    const { map, highlights } = setup();

    const point = new Point([852011.307424, 6788511.322702]);
    const zoomLevel = map.getView().getZoom();
    expect(zoomLevel).toBeTruthy();

    highlights.addHighlightAndZoom([point], {});

    const newZoomLevel = map.getView().getZoom();
    expect(zoomLevel).toBeTruthy();
    expect(zoomLevel).not.toEqual(newZoomLevel);

    const layers = map.getLayers().getArray();
    const pointLayer = layers.find((l) => l.getClassName().includes("highlight-layer"));
    expect(pointLayer).toBeDefined();
});

it("should successfully zoom and highlight for line or polygon geometries", async () => {
    const { map, highlights } = setup();

    const line = new LineString([
        [851890.680238, 6788133.616293],
        [853419.420804, 6790407.617885]
    ]);
    const zoomLevel = map.getView().getZoom();

    highlights.addHighlightAndZoom([line], {});

    const newZoomLevel = map.getView().getZoom();
    expect(newZoomLevel).toBeTruthy();
    expect(zoomLevel).not.toEqual(newZoomLevel);

    const layers = map.getLayers().getArray();
    const lineLayer = layers.find((l) => l.getClassName().includes("highlight-layer"));
    expect(lineLayer).toBeDefined();
});

it("should successfully remove previously added markers or highlights", async () => {
    const { map, highlights } = setup();

    const point = new Point([852011.307424, 6788511.322702]);
    const polygon = new Polygon([
        [
            [851728.251553, 6788384.425292],
            [851518.049725, 6788651.954891],
            [852182.096409, 6788881.265976],
            [851728.251553, 6788384.425292]
        ]
    ]);

    highlights.addHighlightAndZoom([point], {});
    highlights.addHighlightAndZoom([polygon], {});

    const layers = map.getLayers().getArray();
    const searchResultLayers = layers.filter((l) => l.getClassName().includes("highlight-layer"));

    expect(searchResultLayers).toBeDefined();
    expect(searchResultLayers.length).toBe(1);
});

/* it("should successfully remove all markers or highlights", async () => {
    const { map, highlights } = setup();

    const points = [
        new Point([852011.307424, 6788511.322702]),
        new Point([851728.251553, 6788384.425292]),
        new Point([851518.049725, 6788651.954891])
    ];

    highlights.addHighlightAndZoom(points, {});

    const addedLayer = map
        .getLayers()
        .getArray()
        .find((l) => l.getClassName().includes("highlight-layer"));

    expect(addedLayer).toBeDefined();

    highlights.clearHighlight();

    const layerAfterRemove = map
        .getLayers()
        .getArray()
        .find((l) => l.getClassName().includes("highlight-layer"));
    expect(layerAfterRemove).toBeUndefined();
}); */

it("should zoom the map to the extent of the geometries but not further than the defined maxZoom", async () => {
    const { map, highlights } = setup();

    const line = new LineString([
        [848107.047338, 6790579.601198],
        [849081.619449, 6793197.569417]
    ]);

    highlights.addHighlightAndZoom([line], {});
    const mapZoom = map.getView().getZoom();

    //default maxZoom is 20
    expect(mapZoom).toBeLessThanOrEqual(20);

    highlights.addHighlightAndZoom([line], { maxZoom: 13 });
    const mapZoom2 = map.getView().getZoom();

    expect(mapZoom2).toBeLessThanOrEqual(13);
});

it("should zoom the map to the default or configured zoom level if there is no extent", async () => {
    const { map, highlights } = setup();

    const point = new Point([852011.307424, 6788511.322702]);

    highlights.addHighlightAndZoom([point], {});
    const defaultZoom = map.getView().getZoom();
    expect(defaultZoom).toStrictEqual(17);

    highlights.addHighlightAndZoom([point], { pointZoom: 12 });
    const configuredZoom = map.getView().getZoom();

    expect(configuredZoom).toStrictEqual(12);
});

it("should zoom the map to the right extent", async () => {
    const { map, highlights } = setup();

    const line = new LineString([
        [848107.047338, 6790579.601198],
        [849081.619449, 6793197.569417]
    ]);
    const expectedExtent = [
        845321.8731197501, 6789925.10914325, 851866.7936672498, 6796470.02969075
    ];
    highlights.addHighlightAndZoom([line], {});
    const currentExtent = map.getView().calculateExtent();
    expect(approximatelyEquals(expectedExtent, currentExtent, 1)).toBe(true);
});

function setup() {
    const view = new View({
        center: [0, 0],
        zoom: 5
    });
    const map = new OlMap({
        view: view
    });
    map.setSize([500, 500]);

    const highlights = (_highlights = new Highlights(map));
    return { map, highlights };
}
