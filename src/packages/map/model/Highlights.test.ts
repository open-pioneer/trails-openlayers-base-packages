// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it, vi } from "vitest";
import { Highlights } from "./Highlights";
import { LineString, Point, Polygon } from "ol/geom";
import { approximatelyEquals } from "ol/extent";
import { BaseFeature } from "../api/BaseFeature";
import { setupMap } from "@open-pioneer/map-test-utils";
import { HttpService } from "@open-pioneer/http";

const MOCKED_HTTP_SERVICE = {
    fetch: vi.fn()
};

let _highlights: Highlights | undefined;
afterEach(() => {
    _highlights?.destroy();
    _highlights = undefined;
    vi.restoreAllMocks();
});

it("should successfully add marker for point geometries", async () => {
    const { highlights } = await setup();

    const point = new Point([852011.307424, 6788511.322702]);
    const highlight = highlights.addHighlight([point], {});
    expect(highlight).toBeDefined();

    const source = getLayerSource(highlights);
    expect(source).toBeDefined();

    expect(source?.getFeatures()?.length).toBe(1);
});

it("should successfully add line geometries", async () => {
    const { highlights } = await setup();

    const line = new LineString([
        [851890.680238, 6788133.616293],
        [859419.420804, 6790407.617885]
    ]);
    const highlight = highlights.addHighlight([line], {});
    expect(highlight).toBeDefined();

    const source = getLayerSource(highlights);
    expect(source).toBeDefined();

    expect(source?.getFeatures()?.length).toBe(1);
});

it("should successfully add polygon geometries", async () => {
    const { highlights } = await setup();

    const polygon = new Polygon([
        [
            [845183.331006, 6794496.998898],
            [850132.628588, 6794764.528497],
            [850629.469272, 6791707.047365],
            [844399.851466, 6791229.315939],
            [845183.331006, 6794496.998898]
        ]
    ]);
    const highlight = highlights.addHighlight([polygon], {});
    expect(highlight).toBeDefined();

    const source = getLayerSource(highlights);
    expect(source).toBeDefined();

    expect(source?.getFeatures()?.length).toBe(1);
});

it("should successfully zoom for geometries", async () => {
    const { map, highlights } = await setup();
    const olMap = map.olMap;

    const point = new Point([852011.307424, 6788511.322702]);
    const line = new LineString([
        [851890.680238, 6788133.616293],
        [859419.420804, 6790407.617885]
    ]);
    const highlight = highlights.addHighlight([point], {});
    expect(highlight).toBeDefined();

    highlights.zoomToHighlight([point], {});
    const zoomLevel = olMap.getView().getZoom();
    expect(zoomLevel).toBeTruthy();

    const highlight2 = highlights.addHighlight([line], {});
    expect(highlight2).toBeDefined();

    highlights.zoomToHighlight([line], {});
    const zoomLevel2 = olMap.getView().getZoom();
    expect(zoomLevel2).toBeTruthy();

    expect(zoomLevel).not.toEqual(zoomLevel2);

    highlights.zoomToHighlight([point], {});
    const newZoomLevel = olMap.getView().getZoom();
    expect(newZoomLevel).toBeTruthy();
    expect(newZoomLevel).toEqual(zoomLevel);
});

it("should successfully zoom with buffered geometries", async () => {
    const { map, highlights } = await setup();
    const olMap = map.olMap;

    const line = new LineString([
        [851890.680238, 6788133.616293],
        [859419.420804, 6790407.617885]
    ]);

    highlights.zoomToHighlight([line], {});
    const zoomLevel2 = olMap.getView().getZoom();
    expect(zoomLevel2).toBeTruthy();

    highlights.zoomToHighlight([line], { buffer: 1.2 });
    const zoomLevel2WithBuffer = olMap.getView().getZoom();
    expect(zoomLevel2WithBuffer).toBeTruthy();
    expect(zoomLevel2WithBuffer).not.toEqual(zoomLevel2);
    if (typeof zoomLevel2WithBuffer != "number") {
        throw Error("Expected zoom level to be a number");
    }
    expect(zoomLevel2).toBeGreaterThan(zoomLevel2WithBuffer);
});

it("should successfully zoom and add geometries", async () => {
    const { map, highlights } = await setup();
    const olMap = map.olMap;

    const point = new Point([852011.307424, 6788511.322702]);
    const zoomLevel = olMap.getView().getZoom();
    expect(zoomLevel).toBeTruthy();

    const highlight = highlights.addHighlightAndZoom([point], {});
    expect(highlight).toBeDefined();

    const newZoomLevel = olMap.getView().getZoom();
    expect(zoomLevel).toBeTruthy();
    expect(zoomLevel).not.toEqual(newZoomLevel);

    const source = getLayerSource(highlights);
    expect(source).toBeDefined();

    expect(source?.getFeatures()?.length).toBe(1);
});

it("should successfully zoom and add BaseFeatures", async () => {
    const { map, highlights } = await setup();
    const olMap = map.olMap;

    const point = new Point([852011.307424, 6788511.322702]);
    const feature = { id: "test", geometry: point } as BaseFeature;
    const zoomLevel = olMap.getView().getZoom();
    expect(zoomLevel).toBeTruthy();

    const highlight = highlights.addHighlightAndZoom([feature], {});
    expect(highlight).toBeDefined();

    const newZoomLevel = olMap.getView().getZoom();
    expect(zoomLevel).toBeTruthy();
    expect(zoomLevel).not.toEqual(newZoomLevel);

    const source = getLayerSource(highlights);
    expect(source).toBeDefined();

    expect(source?.getFeatures()?.length).toBe(1);
});

it("should successfully zoom and add only BaseFeatures with geometry", async () => {
    const { map, highlights } = await setup();
    const olMap = map.olMap;

    const point = new Point([852011.307424, 6788511.322702]);
    const feature = { id: "test", geometry: point } as BaseFeature;
    const feature2 = { id: "test2" } as BaseFeature;
    const feature3 = { id: "test3", geometry: point } as BaseFeature;

    const zoomLevel = olMap.getView().getZoom();
    expect(zoomLevel).toBeTruthy();

    const highlight = highlights.addHighlightAndZoom([feature, feature2, feature3], {});
    expect(highlight).toBeDefined();

    const newZoomLevel = olMap.getView().getZoom();
    expect(zoomLevel).toBeTruthy();
    expect(zoomLevel).not.toEqual(newZoomLevel);

    const source = getLayerSource(highlights);
    expect(source).toBeDefined();

    expect(source?.getFeatures()?.length).toBe(2);
});

it("should successfully remove previously added highlights", async () => {
    const { highlights } = await setup();

    const point = new Point([852011.307424, 6788511.322702]);
    const highlight = highlights.addHighlight([point], {});
    expect(highlight).toBeDefined();

    const source = getLayerSource(highlights);
    expect(source).toBeDefined();

    expect(source?.getFeatures()?.length).toBe(1);

    highlight?.destroy();
    expect(highlight?.isActive).toBeFalsy();

    expect(source?.getFeatures()?.length).toBe(0);
});

it("highlights should not be removed multiple times", async () => {
    const { highlights } = await setup();

    const point = new Point([852011.307424, 6788511.322702]);
    const highlight = highlights.addHighlight([point], {});
    expect(highlight).toBeDefined();

    const source = getLayerSource(highlights);
    expect(source).toBeDefined();

    expect(source?.getFeatures()?.length).toBe(1);

    highlight?.destroy();
    expect(highlight?.isActive).toBeFalsy();
    expect(source?.getFeatures()?.length).toBe(0);

    expect(highlight?.destroy()).toBeUndefined();
});

it("should successfully remove all markers or highlights", async () => {
    const { highlights } = await setup();

    const points = [
        new Point([852011.307424, 6788511.322702]),
        new Point([851728.251553, 6788384.425292]),
        new Point([851518.049725, 6788651.954891])
    ];

    const highlight = highlights.addHighlightAndZoom(points, {});
    expect(highlight).toBeDefined();

    const source = getLayerSource(highlights);
    expect(source).toBeDefined();

    expect(source?.getFeatures()?.length).toBe(3);

    highlights.clearHighlight();
    expect(source?.getFeatures()?.length).toBe(0);
});

it("should zoom the map to the extent of the geometries but not further than the defined maxZoom", async () => {
    const { map, highlights } = await setup();
    const olMap = map.olMap;

    const line = new LineString([
        [848107.047338, 6790579.601198],
        [849081.619449, 6793197.569417]
    ]);

    highlights.addHighlightAndZoom([line], {});
    const mapZoom = olMap.getView().getZoom();

    //default maxZoom is 20
    expect(mapZoom).toBeLessThanOrEqual(20);

    highlights.addHighlightAndZoom([line], { maxZoom: 13 });
    const mapZoom2 = olMap.getView().getZoom();

    expect(mapZoom2).toBeLessThanOrEqual(13);
});

it("should zoom the map to the default or configured zoom level if there is no extent", async () => {
    const { map, highlights } = await setup();
    const olMap = map.olMap;

    const point = new Point([852011.307424, 6788511.322702]);

    highlights.addHighlightAndZoom([point], {});
    const defaultZoom = olMap.getView().getZoom();
    expect(defaultZoom).toStrictEqual(17);

    highlights.addHighlightAndZoom([point], { pointZoom: 12 });
    const configuredZoom = olMap.getView().getZoom();

    expect(configuredZoom).toStrictEqual(12);
});

it("should zoom the map to the right extent", async () => {
    const { map, highlights } = await setup();
    const olMap = map.olMap;

    const line = new LineString([
        [848107.047338, 6790579.601198],
        [849081.619449, 6793197.569417]
    ]);
    const expectedExtent = [
        845321.8731197501, 6789925.10914325, 851866.7936672498, 6796470.02969075
    ];
    highlights.addHighlightAndZoom([line], {});
    const currentExtent = olMap.getView().calculateExtent();
    expect(approximatelyEquals(expectedExtent, currentExtent, 1)).toBe(true);
});

async function setup() {
    const { map } = await setupMap({ center: { x: 0, y: 0 }, zoom: 5, layers: [] });
    map.olMap.setSize([500, 500]);

    const highlights = (_highlights = new Highlights(map, {
        httpService: MOCKED_HTTP_SERVICE as HttpService
    }));
    return { map, highlights };
}

function getLayerSource(highlights: Highlights) {
    const highlightLayer = highlights.getLayer();
    if (!highlightLayer) return;
    return highlightLayer.getSource();
}
