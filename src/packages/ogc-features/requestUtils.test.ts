// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SpyInstance, afterEach, assert, beforeEach, describe, expect, it, vi } from "vitest";
import {
    createCollectionRequestUrl,
    createOffsetURL,
    getNextURL,
    queryFeatures
} from "./requestUtils";
import GeoJSON from "ol/format/GeoJSON";

describe("collection items url", () => {
    it("expect items url contains extent and crs", () => {
        const url = createCollectionRequestUrl(
            "https://example.com/items",
            [1, 2, 3, 4],
            "http://www.opengis.net/def/crs/EPSG/0/25832"
        );
        expect(url).toMatchInlineSnapshot(
            '"https://example.com/items?bbox=1%2C2%2C3%2C4&bbox-crs=http%3A%2F%2Fwww.opengis.net%2Fdef%2Fcrs%2FEPSG%2F0%2F25832&crs=http%3A%2F%2Fwww.opengis.net%2Fdef%2Fcrs%2FEPSG%2F0%2F25832&f=json"'
        );
    });
});

describe("offset urls", () => {
    it("expect offset urls carry existing query params", () => {
        const fullUrl = "https://url-to-service.de/items?f=json&foo=bar";
        const url = createOffsetURL(fullUrl, 12345, 6789);
        expect(url).toEqual(
            "https://url-to-service.de/items?f=json&foo=bar&offset=12345&limit=6789"
        );
    });

    it("expect offset urls replace existing limit / offset params", () => {
        const fullUrl = "https://url-to-service.de/items?f=json&limit=1&offset=2";
        const url = createOffsetURL(fullUrl, 12345, 6789);
        expect(url).toEqual("https://url-to-service.de/items?f=json&limit=6789&offset=12345");
    });
});

describe("next links", () => {
    it("expect next link to be returned", () => {
        const expectedResult = "testLink";
        const links = [
            {
                rel: "next",
                href: expectedResult
            }
        ];
        const nextUrl = getNextURL(links);
        assert.strictEqual(nextUrl, expectedResult);
    });

    it("expect next link is undefined", () => {
        const links = [
            {
                rel: "self",
                href: "selfLink"
            }
        ];
        const nextUrl = getNextURL(links);
        assert.strictEqual(nextUrl, undefined);
    });
});

describe("query features", () => {
    let mockedFetch!: SpyInstance;

    beforeEach(() => {
        mockedFetch = vi.spyOn(global, "fetch");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockedGeoJSON = {
        "type": "FeatureCollection",
        "crs": {
            "type": "name",
            "properties": {
                "name": "EPSG:25832"
            }
        },
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [5752928, 395388]
                }
            }
        ]
    };

    it("expect feature geometry and nextURL are correct", async () => {
        const requestInit: RequestInit = {
            headers: {
                Accept: "application/geo+json"
            }
        };
        const testUrl = "https://url-to-service.de/items?f=json";

        mockedFetch.mockResolvedValue(createFetchResponse(mockedGeoJSON, 200));
        const featureResponse = await queryFeatures(testUrl, new GeoJSON(), undefined);
        expect(mockedFetch).toHaveBeenCalledWith!(testUrl, requestInit);
        const respondedCoordinates = (featureResponse.features[0]?.getGeometry() as any)
            .flatCoordinates;
        expect(respondedCoordinates).toStrictEqual([5752928, 395388]);
        expect(featureResponse.nextURL).toStrictEqual(undefined);
    });
});

function createFetchResponse(data: object, statusCode: number) {
    return new Response(JSON.stringify(data), {
        status: statusCode
    });
}
