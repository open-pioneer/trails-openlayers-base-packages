// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import GeoJSON from "ol/format/GeoJSON";
import { afterEach, assert, describe, expect, it, vi } from "vitest";
import { createCollectionRequestUrl, getNextLink, queryFeatures } from "./requestUtils";

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

describe("next links", () => {
    it("expect next link to be returned", () => {
        const expectedResult = "testLink";
        const links = [
            {
                rel: "next",
                href: expectedResult
            }
        ];
        const nextUrl = getNextLink(links);
        assert.strictEqual(nextUrl, expectedResult);
    });

    it("expect next link is undefined", () => {
        const links = [
            {
                rel: "self",
                href: "selfLink"
            }
        ];
        const nextUrl = getNextLink(links);
        assert.strictEqual(nextUrl, undefined);
    });
});

describe("query features", () => {
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
        const httpService: HttpService = {
            fetch: vi.fn().mockResolvedValue(createFetchResponse(mockedGeoJSON, 200))
        } satisfies Partial<HttpService> as HttpService;

        const requestInit: RequestInit = {
            headers: {
                Accept: "application/geo+json"
            }
        };
        const testUrl = new URL("https://url-to-service.de/items?f=json");

        const featureResponse = await queryFeatures(testUrl, new GeoJSON(), httpService, undefined);
        expect(httpService.fetch).toHaveBeenCalledWith!(testUrl, requestInit);
        const respondedCoordinates = (featureResponse.features[0]?.getGeometry() as any)
            .flatCoordinates;
        expect(respondedCoordinates).toStrictEqual([5752928, 395388]);
        expect(featureResponse.nextLink).toStrictEqual(undefined);
    });
});

function createFetchResponse(data: object, statusCode: number) {
    return new Response(JSON.stringify(data), {
        status: statusCode
    });
}
