// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import { HttpService } from "@open-pioneer/http";
import { saveCreatedFeature, saveUpdatedFeature } from "./SaveFeaturesHandler";
import { Projection } from "ol/proj";
import GeoJSONGeometry from "ol/format/GeoJSON";
import GeoJSONGeometryCollection from "ol/format/GeoJSON";
import GeoJSON from "ol/format/GeoJSON";
import { Point } from "ol/geom";

const OGC_API_URL_TEST = new URL("https://example.org/ogc");
const TEST_ID = "555";

const HTTP_SERVICE_SUCCESS_CREATE: HttpService = {
    fetch: vi.fn().mockResolvedValue(
        new Response("", {
            headers: {
                Location: OGC_API_URL_TEST + "/" + TEST_ID
            },
            status: 201
        })
    )
} satisfies Partial<HttpService> as HttpService;

const HTTP_SERVICE_SUCCESS_UPDATE: HttpService = {
    fetch: vi.fn().mockResolvedValue(
        new Response(null, {
            status: 204
        })
    )
} satisfies Partial<HttpService> as HttpService;

const HTTP_SERVICE_FAIL: HttpService = {
    fetch: vi.fn().mockResolvedValue(
        new Response("", {
            status: 400
        })
    )
} satisfies Partial<HttpService> as HttpService;

describe("Editing workflow: create", () => {
    it("successfully returns new feature id on saveCreatedFeature", async () => {
        const projection = new Projection({ code: "EPSG:25832" });
        const geometry = mockedGeoJSON(projection);

        const featureId = await saveCreatedFeature(
            HTTP_SERVICE_SUCCESS_CREATE,
            OGC_API_URL_TEST,
            geometry,
            projection
        );
        expect(featureId).toBe(TEST_ID);
    });

    it("returns an error if saving created feature fails", async () => {
        const projection = new Projection({ code: "EPSG:25832" });
        const geometry = mockedGeoJSON(projection);
        let result;

        try {
            result = await saveCreatedFeature(
                HTTP_SERVICE_FAIL,
                OGC_API_URL_TEST,
                geometry,
                projection
            );
        } catch (e) {
            result = e;
        }
        expect(result instanceof Error).toBe(true);
    });
});

describe("Editing workflow: update", () => {
    it("successfully returns a feature id on saveUpdatedFeature", async () => {
        const projection = new Projection({ code: "EPSG:25832" });
        const geometry = mockedGeoJSON(projection);

        const featureId = await saveUpdatedFeature(
            HTTP_SERVICE_SUCCESS_UPDATE,
            OGC_API_URL_TEST,
            TEST_ID,
            geometry,
            projection
        );
        expect(featureId).toBe(TEST_ID);
    });

    it("returns an error if updating feature fails", async () => {
        const projection = new Projection({ code: "EPSG:25832" });
        const geometry = mockedGeoJSON(projection);
        let result;

        try {
            result = await saveUpdatedFeature(
                HTTP_SERVICE_FAIL,
                OGC_API_URL_TEST,
                TEST_ID,
                geometry,
                projection
            );
        } catch (e) {
            result = e;
        }
        expect(result instanceof Error).toBe(true);
    });
});

function mockedGeoJSON(projection: Projection) {
    const point = new Point([407354, 5754673]);
    const geojson = new GeoJSON({
        dataProjection: projection
    });
    const geometry: GeoJSONGeometry | GeoJSONGeometryCollection = geojson.writeGeometryObject(
        point,
        {
            rightHanded: true,
            decimals: 10
        }
    );

    return geometry;
}
