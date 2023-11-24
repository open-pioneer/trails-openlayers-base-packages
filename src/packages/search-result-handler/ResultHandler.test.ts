// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import OlMap from "ol/Map";
import { removerHighlight, resultHandler, calculateBufferedExtent } from "./ResultHandler";
import { LineString, Point, Polygon } from "ol/geom";
import { containsExtent } from "ol/extent";

it("should successfully zoom and add marker for point geometries", async () => {
    const map = new OlMap();

    const point = new Point([852011.307424, 6788511.322702]);
    const zoomLevel = map.getView().getZoom();

    resultHandler(map, [point], {});

    const newZoomLevel = map.getView().getZoom();

    expect(zoomLevel).not.toEqual(newZoomLevel);

    const layers = map.getLayers().getArray();
    const pointLayer = layers.find((l) => l.getClassName().includes("search_result_layer"));

    expect(pointLayer).toBeDefined();
});

it("should successfully zoom and highlight for line or polygon geometries", async () => {
    const map = new OlMap();

    const line = new LineString([
        [851890.680238, 6788133.616293],
        [853419.420804, 6790407.617885]
    ]);
    const zoomLevel = map.getView().getZoom();

    resultHandler(map, [line], {});

    const newZoomLevel = map.getView().getZoom();

    expect(zoomLevel).not.toEqual(newZoomLevel);

    const layers = map.getLayers().getArray();
    const lineLayer = layers.find((l) => l.getClassName().includes("search_result_layer"));

    expect(lineLayer).toBeDefined();
});

it("should successfully remove previously added markers or highlights", async () => {
    const map = new OlMap();

    const point = new Point([852011.307424, 6788511.322702]);
    const polygon = new Polygon([
        [
            [851728.251553, 6788384.425292],
            [851518.049725, 6788651.954891],
            [852182.096409, 6788881.265976],
            [851728.251553, 6788384.425292]
        ]
    ]);

    resultHandler(map, [point], {});
    resultHandler(map, [polygon], {});

    const layers = map.getLayers().getArray();
    const searchResultLayers = layers.filter((l) =>
        l.getClassName().includes("search_result_layer")
    );

    expect(searchResultLayers).toBeDefined();
    expect(searchResultLayers.length).toBe(1);
});

it("should successfully remove all markers or highlights", async () => {
    const map = new OlMap();

    const points = [
        new Point([852011.307424, 6788511.322702]),
        new Point([851728.251553, 6788384.425292]),
        new Point([851518.049725, 6788651.954891])
    ];

    resultHandler(map, points, {});

    const addedLayer = map
        .getLayers()
        .getArray()
        .find((l) => l.getClassName().includes("search_result_layer"));

    expect(addedLayer).toBeDefined();

    removerHighlight(map);

    const layerAfterRemove = map
        .getLayers()
        .getArray()
        .find((l) => l.getClassName().includes("search_result_layer"));
    expect(layerAfterRemove).toBeUndefined();
});

it("should calculate a buffered extent of a given extent", async () => {
    const extent = [844399.851466, 6788384.425292, 852182.096409, 6794764.528497];
    const bufferedExtent = calculateBufferedExtent(extent);

    expect(bufferedExtent).toBeDefined();

    bufferedExtent && expect(containsExtent(bufferedExtent, extent)).toBe(true);
});

it("should zoom the map to the extent of the geometries but not further than the defined maxZoom", async () => {
    const map = new OlMap();

    const line = new LineString([
        [848107.047338, 6790579.601198],
        [849081.619449, 6793197.569417]
    ]);

    resultHandler(map, [line], {});
    const mapZoom = map.getView().getZoom();

    //default maxZoom is 20
    expect(mapZoom).toBeLessThanOrEqual(20);

    resultHandler(map, [line], { maxZoom: 13 });
    const mapZoom2 = map.getView().getZoom();

    expect(mapZoom2).toBeLessThanOrEqual(13);
});

it("should zoom the map to the default or configured zoom level if there is no extent", async () => {
    const map = new OlMap();

    const point = new Point([852011.307424, 6788511.322702]);

    resultHandler(map, [point], {});
    const defaultZoom = map.getView().getZoom();

    expect(defaultZoom).toStrictEqual(17);

    resultHandler(map, [point], { zoom: 12 });
    const configuredZoom = map.getView().getZoom();

    expect(configuredZoom).toStrictEqual(12);
});
