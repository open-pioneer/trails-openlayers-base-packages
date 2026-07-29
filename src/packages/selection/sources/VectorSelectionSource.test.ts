// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { effect, reactive } from "@conterra/reactivity-core";
import { MapModel } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import { createIntl } from "@open-pioneer/test-utils/vanilla";
import { Feature } from "ol";
import { Coordinate } from "ol/coordinate";
import { Extent } from "ol/extent";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import { get as getProjection } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { describe, expect, it } from "vitest";
import { SelectionOptions, SelectionResult } from "../api";
import { VectorLayerSelectionSourceImpl } from "./VectorSelectionSource";

const NOT_VISIBLE_REASON = "Layer not visible";

/** [minx, miny, maxx, maxy] */
const EXTENT: Extent = [404740, 5754673, 407354, 5757893];
const POINT_INSIDE: Coordinate = [407354, 5754673];
const POINT_OUTSIDE: Coordinate = [400000, 5750000];

describe("select", () => {
    it("returns the features intersecting the extent", async () => {
        const { source } = createSource({
            features: [
                createFeature("inside", POINT_INSIDE),
                createFeature("outside", POINT_OUTSIDE)
            ]
        });

        const results = await select(source, EXTENT);
        expect(results.map((result) => result.id)).toEqual(["inside"]);
    });

    it("returns the geometry and the properties of the feature", async () => {
        const feature = createFeature("kita", POINT_INSIDE, { name: "Kindertagesstätte" });
        const { source } = createSource({ features: [feature] });

        const [result] = await select(source, EXTENT);
        expect(result?.geometry).toBe(feature.getGeometry());
        expect(result?.properties?.name).toBe("Kindertagesstätte");
    });

    it("generates ids for features without an id", async () => {
        const { source } = createSource({
            features: [
                createFeature(undefined, POINT_INSIDE),
                createFeature(undefined, POINT_INSIDE)
            ]
        });

        const ids = (await select(source, EXTENT)).map((result) => result.id);
        expect(ids).toHaveLength(2);
        expect(ids.every((id) => typeof id === "string" && id !== "")).toBe(true);
        expect(new Set(ids).size).toBe(2); // unique
    });

    it("ignores features without a geometry", async () => {
        const { source, layer } = createSource({
            features: [createFeature("with-geometry", POINT_INSIDE)]
        });
        layer.getSource()!.addFeature(new Feature({ name: "without geometry" }));

        const results = await select(source, EXTENT);
        expect(results.map((result) => result.id)).toEqual(["with-geometry"]);
    });

    it("limits the number of results to 'maxResults'", async () => {
        const { source } = createSource({
            features: [
                createFeature("1", POINT_INSIDE),
                createFeature("2", POINT_INSIDE),
                createFeature("3", POINT_INSIDE)
            ]
        });

        const results = await select(source, EXTENT, { maxResults: 2 });
        expect(results.map((result) => result.id)).toEqual(["1", "2"]);
    });

    it("returns nothing while the layer is hidden", async () => {
        const { source } = createSource({
            visible: false,
            features: [createFeature("inside", POINT_INSIDE)]
        });

        expect(await select(source, EXTENT)).toEqual([]);
    });

    it("returns nothing if the layer has no source", async () => {
        const { source, layer } = createSource({
            features: [createFeature("inside", POINT_INSIDE)]
        });
        layer.setSource(null);

        expect(await select(source, EXTENT)).toEqual([]);
    });

    it("rejects unsupported selection kinds", async () => {
        const { source } = createSource();

        await expect(source.select({ type: "point" } as never, selectionOptions())).rejects.toThrow(
            /Unsupported selection kind: point/
        );
    });
});

describe("status", () => {
    it("is available while the layer is visible", () => {
        const { source } = createSource();
        expect(source.status).toEqual({ kind: "available" });
    });

    it("is unavailable while the layer is hidden", () => {
        const { source } = createSource({ visible: false });
        expect(source.status).toEqual({ kind: "unavailable", reason: NOT_VISIBLE_REASON });
    });

    it("notifies observers when the visibility of the layer changes", () => {
        const { source, layer } = createSource();
        const observed: string[] = [];
        const handle = effect(
            () => {
                observed.push(source.status.kind);
            },
            { dispatch: "sync" }
        );

        layer.setVisible(false);
        layer.setVisible(true);
        handle.destroy();

        expect(observed).toEqual(["available", "unavailable", "available"]);
    });
});

describe("metadata", () => {
    it("uses the id it was constructed with", () => {
        const { source } = createSource({ id: "my-source" });
        expect(source.id).toBe("my-source");
    });

    it("can be constructed without an id", () => {
        const { source } = createSource();
        expect(source.id).toBeUndefined();
    });

    it("uses the label it was constructed with", () => {
        const { source } = createSource({ label: "Kindertagesstätten" });
        expect(source.label).toBe("Kindertagesstätten");
    });
});

interface CreateSourceOptions {
    id?: string;
    label?: string;
    visible?: boolean;
    features?: Feature[];
}

function createSource(options?: CreateSourceOptions) {
    const layer = new VectorLayer({
        visible: options?.visible ?? true,
        source: new VectorSource({ features: options?.features })
    });
    const intl = reactive(setupIntl(NOT_VISIBLE_REASON));
    const source = new VectorLayerSelectionSourceImpl(
        options?.id,
        layer,
        options?.label ?? "Test Source",
        intl
    );
    return { source, layer, intl };
}

/** Performs an extent selection on the given source. */
function select(
    source: VectorLayerSelectionSourceImpl,
    extent: Extent,
    options?: Partial<SelectionOptions>
): Promise<SelectionResult[]> {
    return source.select({ type: "extent", extent }, selectionOptions(options));
}

/** The source only uses `maxResults`; the remaining options are irrelevant here. */
function selectionOptions(options?: Partial<SelectionOptions>): SelectionOptions {
    return {
        maxResults: 100,
        mapProjection: getProjection("EPSG:3857")!,
        map: {} satisfies Partial<MapModel> as MapModel,
        signal: new AbortController().signal,
        ...options
    };
}

function setupIntl(layerNotVisibleReason: string): PackageIntl {
    return createIntl({
        messages: { layerNotVisibleReason: layerNotVisibleReason }
    });
}

function createFeature(
    id: string | undefined,
    coordinates: Coordinate,
    properties?: Record<string, unknown>
): Feature {
    const feature = new Feature({ ...properties, geometry: new Point(coordinates) });
    if (id != null) {
        feature.setId(id);
    }
    return feature;
}
