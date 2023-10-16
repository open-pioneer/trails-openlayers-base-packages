// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Feature } from "ol";
import { FeatureLike } from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import { Point } from "ol/geom";
import { Projection } from "ol/proj";
import { afterEach, assert, expect, it, vi } from "vitest"; // (1)
import { CollectionInfos, queryAllFeaturesWithOffset } from "./OffsetStrategy";
import {
    FeatureResponse,
    LoadFeatureOptions,
    OffsetRequestProps,
    _createVectorSource,
    loadAllFeaturesNextStrategy,
    queryFeatures
} from "./OgcFeatureSourceFactory";

// TODO: Reset
global.fetch = vi.fn();

afterEach(() => {
    vi.restoreAllMocks();
});

function createFetchResponse(data: object, statusCode: number) {
    return { status: statusCode, json: () => new Promise((resolve) => resolve(data)) };
}

async function mockedGetCollectionInfos(_collectionsItemsUrl: string): Promise<CollectionInfos> {
    return {
        supportsOffsetStrategy: true
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
    numberMatched: 1,
    nextURL: undefined
};

const mockedEmptyFeatureResponse: FeatureResponse = {
    features: [],
    nextURL: undefined,
    numberMatched: undefined
};

it("expect feature geometry and nextURL are correct", async () => {
    const requestInit: RequestInit = {
        headers: {
            Accept: "application/geo+json"
        }
    };
    const testUrl = "https://url-to-service.de/items?f=json";
    const featureFormatter = new GeoJSON();
    const expectedFeatures = featureFormatter.readFeatures(mockedGeoJSON);

    const expectedResponse: FeatureResponse = {
        features: expectedFeatures,
        nextURL: undefined,
        numberMatched: undefined
    };

    // TODO: Handle Typescript Problems...
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    fetch.mockResolvedValue(createFetchResponse(mockedGeoJSON, 200));
    const featureResponse = await queryFeatures(testUrl, featureFormatter, undefined);
    expect(fetch).toHaveBeenCalledWith!("https://url-to-service.de/items?f=json", requestInit);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const respondedCoordinates = featureResponse.features[0].getGeometry().flatCoordinates;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const expectedCoordinates = featureResponse.features[0].getGeometry().flatCoordinates;
    expect(respondedCoordinates).toStrictEqual(expectedCoordinates);
    expect(featureResponse.nextURL).toStrictEqual(expectedResponse.nextURL);
});

it("expect features are parsed from the feature response (offset-strategy)", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";
    const options: LoadFeatureOptions = {
        fullURL: fullUrl,
        featureFormat: new GeoJSON(),
        limit: 1234,
        addFeatures: (features: FeatureLike[]) => {
            features.forEach((feature) => addedFeatures.push(feature));
        },
        queryFeatures: (): Promise<FeatureResponse> => {
            return Promise.resolve(mockedFeatureResponse);
        }
    };
    await queryAllFeaturesWithOffset(options);
    assert.includeMembers(addedFeatures, mockedFeatureResponse.features);
});

it("expect features are parsed from the feature response (next-strategy)", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";
    const options: LoadFeatureOptions = {
        fullURL: fullUrl,
        featureFormat: new GeoJSON(),
        limit: 1234,
        addFeatures: (features: FeatureLike[]) => {
            features.forEach((feature) => addedFeatures.push(feature));
        },
        queryFeatures: (): Promise<FeatureResponse> => {
            return Promise.resolve(mockedFeatureResponse);
        }
    };
    await loadAllFeaturesNextStrategy(options);
    assert.includeMembers(addedFeatures, mockedFeatureResponse.features);
});

it("expect feature responses are empty (offset-strategy)", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";
    const options: LoadFeatureOptions = {
        fullURL: fullUrl,
        featureFormat: new GeoJSON(),
        limit: 1234,
        addFeatures: (features: FeatureLike[]) => {
            features.forEach((feature) => addedFeatures.push(feature));
        },
        queryFeatures: (): Promise<FeatureResponse> => {
            return Promise.resolve(mockedEmptyFeatureResponse);
        }
    };
    await queryAllFeaturesWithOffset(options);
    expect(addedFeatures.length).toBe(0);
});

it("expect feature responses are empty (next-strategy)", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";
    const options: LoadFeatureOptions = {
        fullURL: fullUrl,
        featureFormat: new GeoJSON(),
        limit: 1234,
        addFeatures: (features: FeatureLike[]) => {
            features.forEach((feature) => addedFeatures.push(feature));
        },
        queryFeatures: (): Promise<FeatureResponse> => {
            return Promise.resolve(mockedEmptyFeatureResponse);
        }
    };
    await loadAllFeaturesNextStrategy(options);
    expect(addedFeatures.length).toBe(0);
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
        maxNumberOfConcurrentReq: 2
    };

    const pageSize = 3;
    const totalFeatures = 28;
    const createFeature = (id: number) => {
        return new Feature({
            testId: id,
            geometry: new Point([5752928, 395388])
        });
    };

    const expectedFeatures: Feature[] = [];
    for (let i = 0; i < totalFeatures; ++i) {
        expectedFeatures.push(createFeature(i));
    }

    let requestCount = 0;
    const queryFeatures = async (fullUrl: string): Promise<FeatureResponse> => {
        ++requestCount;

        const urlObj = new URL(fullUrl);
        const params = urlObj.searchParams;
        const offset = Number.parseInt(params.get("offset") || "");
        const limit = Number.parseInt(params.get("limit") || "");
        if (Number.isNaN(offset) || Number.isNaN(limit)) {
            throw new Error("invalid offset or limit");
        }

        const features: Feature[] = [];
        for (let i = offset; i < Math.min(offset + limit, totalFeatures); ++i) {
            features.push(createFeature(i));
        }

        const isLast = offset + limit >= totalFeatures;
        return {
            features,
            nextURL: isLast ? undefined : "https://url-to-service.de",
            numberMatched: totalFeatures
        };
    };

    const options: LoadFeatureOptions = {
        fullURL: fullUrl,
        featureFormat: new GeoJSON(),
        limit: pageSize,
        addFeatures: (features) => features.forEach((feature) => addedFeatures.push(feature)),
        queryFeatures: queryFeatures,
        offsetRequestProps: offsetProps
    };

    await queryAllFeaturesWithOffset(options);

    const actualIds = addedFeatures.map((feature) => feature.get("testId"));
    const expectedIds = expectedFeatures.map((feature) => feature.get("testId"));
    assert.sameMembers(actualIds, expectedIds);
    assert.strictEqual(requestCount, 10);
});
