// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { expect, it, vi } from "vitest";
import { HttpService } from "@open-pioneer/http";
import { saveCreatedFeature } from "./SaveFeaturesHandler";
import { Projection } from "ol/proj";
import GeoJSONGeometry from "ol/format/GeoJSON";
import GeoJSONGeometryCollection from "ol/format/GeoJSON";
import GeoJSON from "ol/format/GeoJSON";
import { Point } from "ol/geom";

const OGC_API_URL_TEST = new URL("https://example.org/ogc");
const TEST_ID = "555";

const HTTP_SERVICE_SUCCESS: HttpService = {
    fetch: vi.fn().mockResolvedValue(
        new Response("", {
            headers: {
                Location: OGC_API_URL_TEST + "/" + TEST_ID
            },
            status: 201
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

it("successfully returns new feature id on saveCreatedFeature", async () => {
    const projection = new Projection({ code: "EPSG:25832" });
    const geoJsonGeometry = createTestGeoJsonGeometry(projection);
    const featureId = await saveCreatedFeature(
        HTTP_SERVICE_SUCCESS,
        OGC_API_URL_TEST,
        geoJsonGeometry,
        projection
    );
    expect(featureId).toBe(TEST_ID);
});

it("returns an error if saving feature fails", async () => {
    const projection = new Projection({ code: "EPSG:25832" });
    const geoJsonGeometry = createTestGeoJsonGeometry(projection);
    let result;
    try {
        result = await saveCreatedFeature(
            HTTP_SERVICE_FAIL,
            OGC_API_URL_TEST,
            geoJsonGeometry,
            projection
        );
    } catch (e) {
        result = e;
    }

    expect(result instanceof Error).toBe(true);
});

function createTestGeoJsonGeometry(projection: Projection) {
    const geometry = new Point([407354, 5754673]);
    const geoJson = new GeoJSON({
        dataProjection: projection
    });
    const geoJSONGeometry: GeoJSONGeometry | GeoJSONGeometryCollection =
        geoJson.writeGeometryObject(geometry, {
            rightHanded: true,
            decimals: 10
        });
    return geoJSONGeometry;
}
