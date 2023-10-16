// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, describe, expect, it } from "vitest";
import { createCollectionRequestUrl, createOffsetURL, getNextURL } from "./requestUtils";

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
