// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Feature } from "ol";
import { FeatureLike } from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import { Point } from "ol/geom";
import { Projection } from "ol/proj";
import { assert, expect, it } from "vitest"; // (1)
import { CollectionInfos, loadAllFeaturesWithOffset } from "./OffsetStrategy";
import {
    LoadFeatureOptions,
    _createVectorSource,
    loadAllFeaturesNextStrategy
} from "./createVectorSource";
import { FeatureResponse } from "./requestUtils";
import { HttpService } from "@open-pioneer/http";

const DUMMY_HTTP_SERVICE = {
    fetch() {
        throw new Error("Not implemented (dummy http service).");
    }
} satisfies Partial<HttpService> as HttpService;

async function mockedGetCollectionInfos(_collectionsItemsUrl: string): Promise<CollectionInfos> {
    return {
        supportsOffsetStrategy: true
    };
}

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

it("expect features are parsed from the feature response (offset-strategy)", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";
    const options: LoadFeatureOptions = {
        fullURL: fullUrl,
        httpService: DUMMY_HTTP_SERVICE,
        featureFormat: new GeoJSON(),
        limit: 1234,
        maxConcurrentRequests: 6,
        addFeatures: (features: FeatureLike[]) => {
            features.forEach((feature) => addedFeatures.push(feature));
        },
        queryFeatures: (): Promise<FeatureResponse> => {
            return Promise.resolve(mockedFeatureResponse);
        }
    };
    await loadAllFeaturesWithOffset(options);
    assert.includeMembers(addedFeatures, mockedFeatureResponse.features);
});

it("expect features are parsed from the feature response (next-strategy)", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";
    const options: LoadFeatureOptions = {
        fullURL: fullUrl,
        httpService: DUMMY_HTTP_SERVICE,
        featureFormat: new GeoJSON(),
        limit: 1234,
        maxConcurrentRequests: 6,
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
        httpService: DUMMY_HTTP_SERVICE,
        featureFormat: new GeoJSON(),
        limit: 1234,
        maxConcurrentRequests: 6,
        addFeatures: (features: FeatureLike[]) => {
            features.forEach((feature) => addedFeatures.push(feature));
        },
        queryFeatures: (): Promise<FeatureResponse> => {
            return Promise.resolve(mockedEmptyFeatureResponse);
        }
    };
    await loadAllFeaturesWithOffset(options);
    expect(addedFeatures.length).toBe(0);
});

it("expect feature responses are empty (next-strategy)", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";
    const options: LoadFeatureOptions = {
        fullURL: fullUrl,
        httpService: DUMMY_HTTP_SERVICE,
        featureFormat: new GeoJSON(),
        limit: 1234,
        maxConcurrentRequests: 6,
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
        {
            httpService: DUMMY_HTTP_SERVICE,
            getCollectionInfosParam: mockedGetCollectionInfos
        }
    );
    assert.isTrue(
        !vectorSource.getOverlaps() &&
            vectorSource.getWrapX() === false &&
            vectorSource.getFormat() === null //ol returns null instead of undefined
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
        {
            httpService: DUMMY_HTTP_SERVICE,
            queryFeaturesParam: queryFeatures,
            addFeaturesParam() {},
            getCollectionInfosParam: mockedGetCollectionInfos
        }
    );
    await vectorSource.loadFeatures(bbox, 1, new Projection({ code: "" }));
    assert.isTrue(urlIsAlwaysCorrect);
});

it("expect all feature from 2 query-runs are added", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service.de/items?f=json";

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
        httpService: DUMMY_HTTP_SERVICE,
        featureFormat: new GeoJSON(),
        limit: pageSize,
        maxConcurrentRequests: 2,
        addFeatures: (features) => features.forEach((feature) => addedFeatures.push(feature)),
        queryFeatures: queryFeatures
    };

    await loadAllFeaturesWithOffset(options);

    const actualIds = addedFeatures.map((feature) => feature.get("testId"));
    const expectedIds = expectedFeatures.map((feature) => feature.get("testId"));
    assert.sameMembers(actualIds, expectedIds);
    assert.strictEqual(requestCount, 10);
});
