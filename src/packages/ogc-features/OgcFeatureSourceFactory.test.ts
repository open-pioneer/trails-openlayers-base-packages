// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { assert, it } from "vitest"; // (1)
import {
    _createOffsetURLs,
    _createVectorSource,
    FeatureResponse,
    _getNextURL,
    _queryAllFeatureRequests,
    _queryFeatures
} from "./OgcFeatureSourceFactory";
import { Geometry, Point } from "ol/geom";
import { Feature } from "ol";
import GeoJSON from "ol/format/GeoJSON";
import { FeatureLike } from "ol/Feature";
import { Projection } from "ol/proj";

it("expect next link to be returned", () => {
    const expectedResult = "testLink";
    const links = [
        {
            rel: "next",
            href: expectedResult
        }
    ];
    const nextUrl = _getNextURL(links);
    assert.strictEqual(nextUrl, expectedResult);
});

it("expect next link is undefined", () => {
    const links = [
        {
            rel: "self",
            href: "selfLink"
        }
    ];
    const nextUrl = _getNextURL(links);
    assert.strictEqual(nextUrl, undefined);
});

it("expect default offsetUrls are correct", () => {
    const fullUrl = "https://url-to-service/items?f=json";
    const expectedResult = [
        `${fullUrl}&offset=0&limit=5000`,
        `${fullUrl}&offset=5000&limit=5000`,
        `${fullUrl}&offset=10000&limit=5000`,
        `${fullUrl}&offset=15000&limit=5000`,
        `${fullUrl}&offset=20000&limit=5000`,
        `${fullUrl}&offset=25000&limit=5000`,
        `${fullUrl}&offset=30000&limit=5000`,
        `${fullUrl}&offset=35000&limit=5000`,
        `${fullUrl}&offset=40000&limit=5000`,
        `${fullUrl}&offset=45000&limit=5000`
    ];
    const urls = _createOffsetURLs(fullUrl);
    assert.includeMembers<string>(urls, expectedResult);
});

const mockedFeatureResponse: FeatureResponse = {
    features: [new Feature({ geometry: new Point([395388.236878133, 5752928.80853902]) })],
    nextURL: undefined
};

const mockedFeatureResponseWithNext: FeatureResponse = {
    features: [new Feature({ geometry: new Point([5752928.80853902, 395388.236878133]) })],
    nextURL: "https://url-to-service"
};

const mockedEmptyFeatureResponse: FeatureResponse = {
    features: [],
    nextURL: undefined
};

it("expect feature responses are correct", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service/items?f=json";
    await _queryAllFeatureRequests(
        fullUrl,
        new GeoJSON(),
        async (_) => mockedFeatureResponse,
        new AbortController().signal,
        () => {},
        (features) => features.forEach((feature) => addedFeatures.push(feature))
    );
    assert.includeMembers<FeatureLike>(addedFeatures, mockedFeatureResponse.features);
});

it("expect feature responses are empty", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service/items?f=json";
    await _queryAllFeatureRequests(
        fullUrl,
        new GeoJSON(),
        async (_) => mockedEmptyFeatureResponse,
        new AbortController().signal,
        () => {},
        (features) => features.forEach((feature) => addedFeatures.push(feature))
    );
    assert.includeMembers<FeatureLike>(addedFeatures, mockedEmptyFeatureResponse.features);
});

it("expect additionalOptions are set on vector-source", () => {
    const additionalOptions = {
        overlaps: false,
        wrapX: false,
        format: undefined
    };

    const vectorSource = _createVectorSource(
        { baseUrl: "", collectionId: "", crs: "", additionalOptions: additionalOptions },
        _queryFeatures,
        undefined
    );
    assert.isTrue(
        !vectorSource.getOverlaps() &&
            vectorSource.getWrapX() === false &&
            vectorSource.getFormat() === undefined
    );
});

it("expect url is created correctly on vector-source", async () => {
    const fullURL = "https://url-to-service/items?f=json",
        collectionId = "1",
        crs = "http://www.opengis.net/def/crs/EPSG/0/25832",
        attributions = "attributions string",
        bbox = [1, 2, 3, 4],
        expectedUrl = `${fullURL}/collections/${collectionId}/items?bbox=1,2,3,4&bbox-crs=${crs}&crs=${crs}&f=json`;
    let urlIsAlwaysCorrect = true;

    const queryFeatures = async (fullUrl: string): Promise<FeatureResponse> => {
        urlIsAlwaysCorrect = urlIsAlwaysCorrect && fullUrl.includes(expectedUrl);
        return mockedFeatureResponse;
    };

    const vectorSource = _createVectorSource(
        { baseUrl: fullURL, collectionId: collectionId, crs: crs, attributions: attributions },
        queryFeatures,
        (_: Array<Feature<Geometry>>) => {}
    );
    await vectorSource.loadFeatures(bbox, 1, new Projection({ code: "" }));
    assert.isTrue(urlIsAlwaysCorrect);
});

it("expect all feature from 2 query-runs are added", async () => {
    const addedFeatures: Array<FeatureLike> = [];
    const fullUrl = "https://url-to-service/items?f=json";

    const offsetProps = {
        numberOfConcurrentReq: 6,
        offsetDelta: 2500,
        startOffset: 0
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
        if (
            fullUrl.includes(
                `&offset=${(offsetProps.numberOfConcurrentReq - 1) * offsetProps.offsetDelta}`
            ) &&
            firstSixRuns
        ) {
            firstSixRuns = false;
            return mockedFeatureResponseWithNext;
        }
        return mockedFeatureResponse;
    };
    await _queryAllFeatureRequests(
        fullUrl,
        new GeoJSON(),
        queryFeatures,
        new AbortController().signal,
        () => {},
        (features) => features.forEach((feature) => addedFeatures.push(feature)),
        offsetProps
    );
    assert.sameOrderedMembers<FeatureLike>(addedFeatures, expectedFeatures);
});
