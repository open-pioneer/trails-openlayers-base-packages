// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, expect, it, vi, afterEach } from "vitest"; // (1)
import {
    _createVectorSource,
    FeatureResponse,
    getNextURL,
    QueryFeatureOptions,
    OffsetRequestProps,
    queryAllFeaturesNextStrategy,
    queryFeatures
} from "./OgcFeatureSourceFactory";
import { createOffsetURLs, queryAllFeaturesWithOffset } from "./OffsetStrategy";
import { Point } from "ol/geom";
import { Feature } from "ol";
import GeoJSON from "ol/format/GeoJSON";
import { FeatureLike } from "ol/Feature";
import { Projection } from "ol/proj";
import FeatureFormat from "ol/format/Feature";

// Stored and used in mockedFetch to help Typescript compiler
const mockedFetch = (global.fetch = vi.fn());

afterEach(() => {
    vi.restoreAllMocks();
});

function createFetchResponse(data: object, statusCode: number) {
    return new Response(JSON.stringify(data), {
        status: statusCode
    });
}

async function mockedGetCollectionInfos(_: string, __?: OffsetRequestProps) {
    return {
        numberMatched: 4000,
        offsetStrategySupported: true,
        requiredPages: 2
    };
}

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

const mockedFeatureResponse: FeatureResponse = {
    features: [new Feature({ geometry: new Point([395388, 5752928]) })],
    nextURL: undefined
};

const mockedFeatureResponseWithNext: FeatureResponse = {
    features: [new Feature({ geometry: new Point([5752928, 395388]) })],
    nextURL: "https://url-to-service.de"
};

const mockedEmptyFeatureResponse: FeatureResponse = {
    features: [],
    nextURL: undefined
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

it("expect default offsetUrls are created correctly", () => {
    const fullUrl = "https://url-to-service.de/items?f=json";
    const urlObj = new URL(fullUrl);
    const expectedResult: string[] = [];
    for (let i = 0; i < 10; i++) {
        urlObj.searchParams.set("offset", "" + i * 5000);
        urlObj.searchParams.set("limit", "5000");
        expectedResult.push(urlObj.toString());
    }
    const urls = createOffsetURLs(fullUrl);
    assert.includeMembers<string>(urls, expectedResult);
});

it("expect feature responses are parsed from the feature response (offset-strategy)", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";
    const options: QueryFeatureOptions = {
        fullURL: fullUrl,
        featureFormat: new GeoJSON(),
        addFeatures: (features: FeatureLike[]) => {
            features.forEach((feature) => addedFeatures.push(feature));
        },
        queryFeatures: (
            _: string,
            __: FeatureFormat | undefined,
            ___: AbortSignal | undefined
        ): Promise<FeatureResponse> => {
            return Promise.resolve(mockedFeatureResponse);
        }
    };
    await queryAllFeaturesWithOffset(options);
    assert.includeMembers(addedFeatures, mockedFeatureResponse.features);
});

it("expect feature responses are parsed from the feature response (next-strategy)", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";
    const options: Omit<QueryFeatureOptions, "offsetRequestProps"> = {
        fullURL: fullUrl,
        featureFormat: new GeoJSON(),
        addFeatures: (features: FeatureLike[]) => {
            features.forEach((feature) => addedFeatures.push(feature));
        },
        queryFeatures: (
            _: string,
            __: FeatureFormat | undefined,
            ___: AbortSignal | undefined
        ): Promise<FeatureResponse> => {
            return Promise.resolve(mockedFeatureResponse);
        }
    };
    await queryAllFeaturesNextStrategy(options);
    assert.includeMembers(addedFeatures, mockedFeatureResponse.features);
});

it("expect feature responses are empty (offset-strategy)", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";
    const options: QueryFeatureOptions = {
        fullURL: fullUrl,
        featureFormat: new GeoJSON(),
        addFeatures: (features: FeatureLike[]) => {
            features.forEach((feature) => addedFeatures.push(feature));
        },
        queryFeatures: (
            _: string,
            __: FeatureFormat | undefined,
            ___: AbortSignal | undefined
        ): Promise<FeatureResponse> => {
            return Promise.resolve(mockedEmptyFeatureResponse);
        }
    };
    await queryAllFeaturesWithOffset(options);
    assert.includeMembers(addedFeatures, mockedEmptyFeatureResponse.features);
});

it("expect feature responses are empty (next-strategy)", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";
    const options: Omit<QueryFeatureOptions, "offsetRequestProps"> = {
        fullURL: fullUrl,
        featureFormat: new GeoJSON(),
        addFeatures: (features: FeatureLike[]) => {
            features.forEach((feature) => addedFeatures.push(feature));
        },
        queryFeatures: (
            _: string,
            __: FeatureFormat | undefined,
            ___: AbortSignal | undefined
        ): Promise<FeatureResponse> => {
            return Promise.resolve(mockedEmptyFeatureResponse);
        }
    };
    await queryAllFeaturesNextStrategy(options);
    assert.includeMembers(addedFeatures, mockedEmptyFeatureResponse.features);
});

it("expect additionalOptions are set on vector-source", () => {
    const additionalOptions = {
        overlaps: false,
        wrapX: false,
        format: undefined
    };

    const vectorSource = _createVectorSource(
        { baseUrl: "", collectionId: "", crs: "", additionalOptions: additionalOptions },
        undefined,
        undefined,
        mockedGetCollectionInfos
    );
    assert.isTrue(
        !vectorSource.getOverlaps() &&
            vectorSource.getWrapX() === false &&
            vectorSource.getFormat() === undefined
    );
});

it("expect url is created correctly on vector-source", async () => {
    const fullURL = "https://url-to-service.de",
        collectionId = "1",
        crs = "http://www.opengis.net/def/crs/EPSG/0/25832",
        attributions = "attributions string",
        bbox = [1, 2, 3, 4];

    let urlIsAlwaysCorrect = true;

    const queryFeatures = async (fullUrl: string): Promise<FeatureResponse> => {
        const urlObj = new URL(fullUrl);
        const params = urlObj.searchParams;
        const pathIsCorrect = urlObj.pathname.includes("/collections/1/items");
        const paramAreIncluded =
            params.get("crs") === crs &&
            params.get("bbox-crs") === crs &&
            params.get("bbox") === bbox.join(",") &&
            params.get("f") === "json";
        urlIsAlwaysCorrect = paramAreIncluded && pathIsCorrect;
        return mockedFeatureResponse;
    };

    const vectorSource = _createVectorSource(
        { baseUrl: fullURL, collectionId: collectionId, crs: crs, attributions: attributions },
        queryFeatures,
        (_: Array<FeatureLike>) => {},
        mockedGetCollectionInfos
    );
    await vectorSource.loadFeatures(bbox, 1, new Projection({ code: "" }));
    assert.isTrue(urlIsAlwaysCorrect);
});

it("expect all feature from 2 query-runs are added", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";

    const offsetProps: OffsetRequestProps = {
        maxConcurrentRequests: 6,
        pageSize: 2500
    };

    const expectedFeatures = [
        ...mockedFeatureResponse.features,
        ...mockedFeatureResponse.features,
        ...mockedFeatureResponse.features,
        ...mockedFeatureResponse.features,
        ...mockedFeatureResponse.features,
        ...mockedFeatureResponseWithNext.features,
        ...mockedFeatureResponse.features,
        ...mockedFeatureResponse.features,
        ...mockedFeatureResponse.features,
        ...mockedFeatureResponse.features,
        ...mockedFeatureResponse.features,
        ...mockedFeatureResponse.features
    ];

    let firstSixRuns = true;

    const queryFeatures = async (fullUrl: string) => {
        const urlObj = new URL(fullUrl);
        const params = urlObj.searchParams;
        const offsetOfLastUrl = (
            (offsetProps.maxConcurrentRequests - 1) *
            offsetProps.pageSize
        ).toString();
        const paramsOfLastUrl = params.get("offset") === offsetOfLastUrl;
        if (paramsOfLastUrl && firstSixRuns) {
            firstSixRuns = false;
            return mockedFeatureResponseWithNext;
        }
        return mockedFeatureResponse;
    };

    const options: QueryFeatureOptions = {
        fullURL: fullUrl,
        featureFormat: new GeoJSON(),
        addFeatures: (features) => features.forEach((feature) => addedFeatures.push(feature)),
        queryFeatures: queryFeatures,
        offsetRequestProps: offsetProps
    };

    await queryAllFeaturesWithOffset(options);
    assert.sameOrderedMembers<FeatureLike>(addedFeatures, expectedFeatures);
});
