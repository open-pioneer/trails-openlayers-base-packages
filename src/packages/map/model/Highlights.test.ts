// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it } from "vitest";
import OlMap from "ol/Map";
import { Highlights, calculateBufferedExtent } from "./Highlights";
import { LineString, Point, Polygon } from "ol/geom";
import { containsExtent } from "ol/extent";
import View from "ol/View";

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

    highlights.addHighlightOrMarkerAndZoom([point], {});

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

    highlights.addHighlightOrMarkerAndZoom([line], {});

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

    highlights.addHighlightOrMarkerAndZoom([point], {});
    highlights.addHighlightOrMarkerAndZoom([polygon], {});

    const layers = map.getLayers().getArray();
    const searchResultLayers = layers.filter((l) => l.getClassName().includes("highlight-layer"));

    expect(searchResultLayers).toBeDefined();
    expect(searchResultLayers.length).toBe(1);
});

it("should successfully remove all markers or highlights", async () => {
    const { map, highlights } = setup();

    const points = [
        new Point([852011.307424, 6788511.322702]),
        new Point([851728.251553, 6788384.425292]),
        new Point([851518.049725, 6788651.954891])
    ];

    highlights.addHighlightOrMarkerAndZoom(points, {});

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
});

it("should calculate a buffered extent of a given extent", async () => {
    const extent = [844399.851466, 6788384.425292, 852182.096409, 6794764.528497];
    const bufferedExtent = calculateBufferedExtent(extent)!;
    expect(bufferedExtent).toBeDefined();
    expect(containsExtent(bufferedExtent, extent)).toBe(true);
});

it("should zoom the map to the extent of the geometries but not further than the defined maxZoom", async () => {
    const { map, highlights } = setup();

    const line = new LineString([
        [848107.047338, 6790579.601198],
        [849081.619449, 6793197.569417]
    ]);

    highlights.addHighlightOrMarkerAndZoom([line], {});
    const mapZoom = map.getView().getZoom();

    //default maxZoom is 20
    expect(mapZoom).toBeLessThanOrEqual(20);

    highlights.addHighlightOrMarkerAndZoom([line], { maxZoom: 13 });
    const mapZoom2 = map.getView().getZoom();

    expect(mapZoom2).toBeLessThanOrEqual(13);
});

it("should zoom the map to the default or configured zoom level if there is no extent", async () => {
    const { map, highlights } = setup();

    const point = new Point([852011.307424, 6788511.322702]);

    highlights.addHighlightOrMarkerAndZoom([point], {});
    const defaultZoom = map.getView().getZoom();

    expect(defaultZoom).toStrictEqual(17);

    highlights.addHighlightOrMarkerAndZoom([point], { zoom: 12 });
    const configuredZoom = map.getView().getZoom();

    expect(configuredZoom).toStrictEqual(12);
});

function setup() {
    const view = new View({
        center: [1, 2],
        zoom: 5
    });
    const map = new OlMap({
        view: view
    });
    map.setSize([500, 500]);

    const highlights = (_highlights = new Highlights(map));
    return { map, highlights };
}
