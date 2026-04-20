// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { Projection } from "ol/proj";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CollectionMetadata } from "./Metadata";
import { OgcFeaturesVectorSource } from "./OgcFeaturesVectorSource";
import { OgcFeatureVectorSourceOptions } from "../api";

const BASE_URL = "https://ogc-api.example.com";
const COLLECTION_ID = "test-collection";
const COLLECTION_URL = `${BASE_URL}/collections/${COLLECTION_ID}`;
const ITEMS_URL = `${COLLECTION_URL}/items`;
const DEFAULT_EXTENT = [0, 0, 10, 10];

const CRS84 = "http://www.opengis.net/def/crs/OGC/1.3/CRS84";
const CRS84_ALT = "http://www.opengis.net/def/crs/OGC/0/CRS84";
const CRS_EPSG_4326 = "http://www.opengis.net/def/crs/EPSG/0/4326";
const CRS_EPSG_3857 = "http://www.opengis.net/def/crs/EPSG/0/3857";

beforeEach(() => {
    vi.restoreAllMocks();
});

describe("CRS parameter handling", () => {
    it("uses the configured crs option verbatim as request CRS", async () => {
        const requestedCrs: string[] = [];
        const httpService = createMockHttpService({
            onFetchFeatures(url) {
                requestedCrs.push(url.searchParams.get("crs")!);
            }
        });

        const source = createSource(
            { crs: "http://www.opengis.net/def/crs/EPSG/43/1111" },
            httpService
        );
        await loadFeaturesAndWait(source);

        expect(requestedCrs.length).toBeGreaterThan(0);
        expect(
            requestedCrs.every((crs) => crs === "http://www.opengis.net/def/crs/EPSG/43/1111")
        ).toBe(true);
    });

    it("maps EPSG:4326 map projection to CRS84 (long/lat order)", async () => {
        const requestedCrs: string[] = [];
        const httpService = createMockHttpService({
            onFetchFeatures(url) {
                requestedCrs.push(url.searchParams.get("crs")!);
            }
        });

        const source = createSource({}, httpService);
        await loadFeaturesAndWait(source, { projection: new Projection({ code: "EPSG:4326" }) });

        expect(requestedCrs.length).toBeGreaterThan(0);
        expect(requestedCrs.every((crs) => crs === CRS84)).toBe(true);
    });

    it("matches the map CRS against the collection's supported CRS list", async () => {
        const requestedCrs: string[] = [];
        const httpService = createMockHttpService({
            onFetchFeatures(url) {
                requestedCrs.push(url.searchParams.get("crs")!);
            }
        });

        const source = createSource({}, httpService);
        await loadFeaturesAndWait(source, { projection: new Projection({ code: "EPSG:3857" }) });

        expect(requestedCrs.length).toBeGreaterThan(0);
        expect(requestedCrs.every((crs) => crs === CRS_EPSG_3857)).toBe(true);
    });

    it("picks up a changed map projection on subsequent loadFeatures calls", async () => {
        const requestedCrs: string[] = [];
        const httpService = createMockHttpService({
            onFetchFeatures(url) {
                requestedCrs.push(url.searchParams.get("crs")!);
            }
        });

        const source = createSource({}, httpService);

        // First load in EPSG:4326
        await loadFeaturesAndWait(source, { projection: new Projection({ code: "EPSG:4326" }) });
        const crsAfterFirstLoad = [...new Set(requestedCrs)];

        // Second load in EPSG:3857 — clears loaded extents first so the loader runs again
        requestedCrs.length = 0;
        source.removeLoadedExtent(DEFAULT_EXTENT);
        await loadFeaturesAndWait(source, { projection: new Projection({ code: "EPSG:3857" }) });
        const crsAfterSecondLoad = [...new Set(requestedCrs)];

        expect(crsAfterFirstLoad).toEqual([CRS84]);
        expect(crsAfterSecondLoad).toEqual([CRS_EPSG_3857]);
    });

    it("does not request features when SRS is not supported", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const httpService = createMockHttpService({
            metadata: { crs: [CRS84, CRS_EPSG_4326] } // intentionally excludes EPSG:3857
        });

        const source = createSource({}, httpService);
        await loadFeaturesAndWait(source, { projection: new Projection({ code: "EPSG:3857" }) });

        // The warning was logged about the unsupported CRS
        const loggedMessages = errorSpy.mock.calls.flat();
        expect(loggedMessages).toMatchInlineSnapshot(
            `
          [
            "[ERROR] @open-pioneer/ogc-features/vector-source/OgcFeaturesVectorSource: Map CRS 'EPSG:3857' not supported by collection 'https://ogc-api.example.com/collections/test-collection'.",
          ]
        `
        );
    });
});

describe("Attribution handling", () => {
    it("applies the attributions option directly to the vector source (no load required)", () => {
        const httpService = createMockHttpService();
        const source = createSource({ attributions: "© Explicit Option" }, httpService);
        expect(getAttributionStrings(source)).toEqual(["© Explicit Option"]);
    });

    it("uses metadata attribution when no attributions option is given", async () => {
        const httpService = createMockHttpService({
            metadata: { attribution: "© Service Metadata" }
        });
        const source = createSource({}, httpService);
        await loadFeaturesAndWait(source);
        expect(getAttributionStrings(source)).toEqual(["© Service Metadata"]);
    });

    it("keeps the explicit attributions option even when metadata also provides attribution", async () => {
        const httpService = createMockHttpService({
            metadata: { attribution: "© Service Metadata" }
        });
        const source = createSource({ attributions: "© Explicit Option" }, httpService);
        await loadFeaturesAndWait(source);
        expect(getAttributionStrings(source)).toEqual(["© Explicit Option"]);
    });
});

describe("Next strategy", () => {
    it("loads all features from a single-page response", async () => {
        const httpService = createMockHttpService({
            supportsOffset: false,
            featurePageHandler: () =>
                makeFeatureCollection([makeGeoJsonFeature(0), makeGeoJsonFeature(1)])
        });
        const source = createSource(
            {
                strategy: "next"
            },
            httpService
        );
        await loadFeaturesAndWait(source);

        expect(source.getFeatures().length).toBe(2);
    });

    it("follows next links across multiple pages", async () => {
        const NEXT_LINK = `${ITEMS_URL}?bbox=0,0,10,10&f=json&page=2`;
        let requestCount = 0;
        const httpService = createMockHttpService({
            supportsOffset: false,
            featurePageHandler: (_url, idx) => {
                requestCount++;
                if (idx === 0) {
                    // First page: one feature + next link
                    return makeFeatureCollection([makeGeoJsonFeature(0)], {
                        nextLink: NEXT_LINK
                    });
                }
                // Second (final) page: one feature, no next link
                return makeFeatureCollection([makeGeoJsonFeature(1)]);
            }
        });

        const source = createSource({}, httpService);
        await loadFeaturesAndWait(source);

        expect(source.getFeatures().length).toBe(2);
        expect(requestCount).toBe(2);
    });

    it("handles an empty response without error", async () => {
        const httpService = createMockHttpService({
            supportsOffset: false,
            featurePageHandler: () => makeFeatureCollection([])
        });
        const source = createSource({}, httpService);
        await loadFeaturesAndWait(source);

        expect(source.getFeatures().length).toBe(0);
    });

    it("forces next strategy when offset is not supported", async () => {
        const featureUrls: URL[] = [];
        const httpService = createMockHttpService({
            supportsOffset: false,
            onFetchFeatures: (url) => {
                featureUrls.push(url);
            }
        });

        const source = createSource({ strategy: "next" }, httpService);
        await loadFeaturesAndWait(source);

        // No offset param should appear on any feature request
        expect(featureUrls.length).toBeGreaterThan(0);
        for (const url of featureUrls) {
            expect(url.searchParams.has("offset")).toBe(false);
        }
    });
});

describe("Offset strategy", () => {
    it("auto-selects offset strategy when probe response advertises offset support", async () => {
        const featureUrls: URL[] = [];
        const httpService = createMockHttpService({
            supportsOffset: true,
            onFetchFeatures(url) {
                featureUrls.push(url);
            }
        });

        const source = createSource({}, httpService);
        await loadFeaturesAndWait(source);

        expect(featureUrls.length).toBeGreaterThan(0);
        for (const url of featureUrls) {
            expect(url.searchParams.has("offset")).toBe(true);
            expect(url.searchParams.has("limit")).toBe(true);
        }
    });

    it("uses offset when explicitly configured and service supports it", async () => {
        const featureUrls: URL[] = [];
        const httpService = createMockHttpService({
            supportsOffset: true,
            onFetchFeatures(url) {
                featureUrls.push(url);
            }
        });

        const source = createSource({ strategy: "offset" }, httpService);
        await loadFeaturesAndWait(source);

        expect(featureUrls.length).toBeGreaterThan(0);
        for (const url of featureUrls) {
            expect(url.searchParams.has("offset")).toBe(true);
        }
    });

    it("issues parallel requests with correct offset/limit params for a large result set", async () => {
        const totalFeatures = 28;
        const pageSize = 3;

        const featureUrls: URL[] = [];
        const httpService = createMockHttpService({
            supportsOffset: true,
            featurePageHandler(url) {
                featureUrls.push(url);

                const offset = parseInt(url.searchParams.get("offset") ?? "0");
                const limit = parseInt(url.searchParams.get("limit") ?? "0");
                const count = Math.min(limit, Math.max(0, totalFeatures - offset));
                const features = Array.from({ length: count }, (_, i) =>
                    makeGeoJsonFeature(offset + i)
                );
                const isLast = offset + limit >= totalFeatures;
                const nextLink = isLast
                    ? undefined
                    : `${ITEMS_URL}?bbox=0,0,10,10&offset=${offset + limit}&limit=${limit}&f=json`;
                return makeFeatureCollection(features, { nextLink, numberMatched: totalFeatures });
            }
        });

        const source = createSource({ limit: pageSize, maxConcurrentRequests: 2 }, httpService);
        await loadFeaturesAndWait(source);

        // 28 features, page size 3, concurrency 2 → 10 requests total
        expect(featureUrls.length).toBe(10);
        expect(source.getFeatures().length).toBe(totalFeatures);

        // Verify that all expected feature IDs are present
        const loadedIds = source
            .getFeatures()
            .map((f) => f.get("testId") as number)
            .sort((a, b) => a - b);
        const expectedIds = Array.from({ length: totalFeatures }, (_, i) => i);
        expect(loadedIds).toEqual(expectedIds);
    });

    it("handles an empty offset response without error", async () => {
        const httpService = createMockHttpService({
            supportsOffset: true,
            featurePageHandler: () =>
                makeFeatureCollection([], { nextLink: undefined, numberMatched: 0 })
        });
        const source = createSource({}, httpService);
        await loadFeaturesAndWait(source);

        expect(source.getFeatures().length).toBe(0);
    });
});

describe("URL construction", () => {
    it("sets bbox, crs, bbox-crs and f=json on the feature request URL", async () => {
        const extent = [1, 2, 3, 4];
        const capturedUrls: URL[] = [];
        const httpService = createMockHttpService({
            onFetchFeatures(url) {
                capturedUrls.push(url);
            }
        });

        const source = createSource({ crs: CRS84 }, httpService);
        await loadFeaturesAndWait(source, { extent });

        expect(capturedUrls.length).toBeGreaterThan(0);
        const featureUrl = capturedUrls[0]!;

        expect(featureUrl.pathname).toContain(`/collections/${COLLECTION_ID}/items`);
        expect(featureUrl.searchParams.get("bbox")).toBe(extent.join(","));
        expect(featureUrl.searchParams.get("crs")).toBe(CRS84);
        expect(featureUrl.searchParams.get("bbox-crs")).toBe(CRS84);
        expect(featureUrl.searchParams.get("f")).toBe("json");
    });

    it("applies the rewriteUrl function to every feature request", async () => {
        const capturedUrls: URL[] = [];
        const httpService = createMockHttpService({
            onFetchFeatures(url) {
                capturedUrls.push(url);
            }
        });

        const source = createSource(
            {
                rewriteUrl(url) {
                    const rewritten = new URL(url);
                    rewritten.searchParams.set("foo", "bar");
                    return rewritten;
                }
            },
            httpService
        );
        await loadFeaturesAndWait(source);

        expect(capturedUrls.length).toBeGreaterThan(0);
        for (const url of capturedUrls) {
            expect(url.searchParams.get("foo")).toBe("bar");
        }
    });
});

it("forwards additionalOptions to the underlying VectorSource", () => {
    const httpService = createMockHttpService();
    const source = createSource(
        {
            additionalOptions: {
                overlaps: false,
                wrapX: false
            }
        },
        httpService
    );

    expect(source.getOverlaps()).toBe(false);
    expect(source.getWrapX()).toBe(false);
});

interface MockFetchOptions {
    metadata?: Partial<CollectionMetadata>;
    supportsOffset?: boolean;
    onFetchFeatures?: (url: URL) => void;
    featurePageHandler?: (url: URL, requestIndex: number) => object;
}

function createMockHttpService(opts: MockFetchOptions = {}): HttpService {
    const { metadata, supportsOffset = true, onFetchFeatures, featurePageHandler } = opts;

    const resolvedMetadata: CollectionMetadata = {
        id: COLLECTION_ID,
        crs: [CRS84, CRS84_ALT, CRS_EPSG_4326, CRS_EPSG_3857],
        ...metadata
    };

    let featureRequestIndex = 0;

    return {
        fetch: vi.fn(async (input: URL | string, _init?: RequestInit) => {
            const url = input instanceof URL ? input : new URL(input as string);

            const isItemsRequest = url.pathname.endsWith("/items");

            if (!isItemsRequest) {
                // Collection metadata request
                return new Response(JSON.stringify(resolvedMetadata), { status: 200 });
            }

            if (url.searchParams.get("limit") === "1") {
                // Offset probe
                const probeBody = supportsOffset
                    ? makeFeatureCollection([], {
                          nextLink: `${ITEMS_URL}?offset=1&limit=1&f=json`
                      })
                    : makeFeatureCollection([]);
                return new Response(JSON.stringify(probeBody), { status: 200 });
            }

            // Feature page request
            onFetchFeatures?.(url);
            const idx = featureRequestIndex++;
            const body = featurePageHandler
                ? featurePageHandler(url, idx)
                : makeFeatureCollection([makeGeoJsonFeature(idx)]);
            return new Response(JSON.stringify(body), { status: 200 });
        })
    } satisfies Partial<HttpService> as HttpService;
}

function makeGeoJsonFeature(id: number) {
    return {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [id, id] },
        properties: { testId: id }
    };
}

function makeFeatureCollection(
    features: object[],
    opts?: { nextLink?: string; numberMatched?: number }
) {
    return {
        type: "FeatureCollection",
        numberMatched: opts?.numberMatched,
        features,
        links: opts?.nextLink ? [{ rel: "next", href: opts.nextLink }] : []
    };
}

/**
 * Calls the OL attribution function with a dummy frame state to get the plain string values.
 * Returns null if no attribution function is set.
 */
function getAttributionStrings(source: OgcFeaturesVectorSource): string[] | string | undefined {
    const fn = source.getAttributions();
    return fn ? fn(null as any) : undefined;
}

function createSource(
    options: Partial<OgcFeatureVectorSourceOptions>,
    httpService: HttpService
): OgcFeaturesVectorSource {
    return new OgcFeaturesVectorSource(
        { baseUrl: BASE_URL, collectionId: COLLECTION_ID, ...options },
        httpService
    );
}

async function loadFeaturesAndWait(
    source: OgcFeaturesVectorSource,
    opts?: { extent?: number[]; projection?: Projection }
) {
    const extent = opts?.extent ?? DEFAULT_EXTENT;
    const projection = opts?.projection ?? new Projection({ code: "EPSG:3857" });
    source.loadFeatures(extent, 1, projection);
    await vi.waitUntil(() => source.loading === 0);
}
