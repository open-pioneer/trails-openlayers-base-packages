// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { get as getProjection } from "ol/proj";
import { afterEach, expect, it, vi } from "vitest";
import { OgcFeatureSearchSource, SearchResponse } from "./OgcFeatureSearchSource";
import { OgcFeatureSearchSourceOptions } from "./api";

const mockedFetch = vi.fn();

afterEach(() => {
    vi.restoreAllMocks();
});

const mockedGeoJSON = {
    type: "FeatureCollection",
    numberReturned: 2,
    numberMatched: 2,
    timeStamp: "2023-12-01T12:28:16Z",
    features: [
        {
            type: "Feature",
            id: "4000075001",
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [6.180881022282916, 50.93753948577338],
                        [6.177655835238146, 50.935783536765214],
                        [6.1753887702287855, 50.93348923474242],
                        [6.171611066378628, 50.929665132410996],
                        [6.170217580810749, 50.923855205124035],
                        [6.172889445874459, 50.92460754225249],
                        [6.175265868463677, 50.924095364152805],
                        [6.201271999211225, 50.92009575190638],
                        [6.201279738610664, 50.91595148262405],
                        [6.20336995428963, 50.91598028560698],
                        [6.203361160256082, 50.920847351746],
                        [6.199045406868226, 50.92425189809344],
                        [6.186766104814082, 50.933235731724466],
                        [6.185043058718805, 50.93449599955021],
                        [6.180881022282916, 50.93753948577338]
                    ]
                ]
            },
            properties: { name: "Aldenhoven 6" }
        },
        {
            type: "Feature",
            id: "4000050002",
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [7.455268177793453, 51.48668294227042],
                        [7.459308045576077, 51.48450065302553],
                        [7.460820941611737, 51.4837387159833],
                        [7.463644254483711, 51.48231698319372],
                        [7.465594624018868, 51.48329437569526],
                        [7.467671676923377, 51.48390227149009],
                        [7.468849510709505, 51.484156407864994],
                        [7.472827508700579, 51.48451960484009],
                        [7.478739819258874, 51.4854776297849],
                        [7.476108161955665, 51.49092678898278],
                        [7.472496170784802, 51.48999079929369],
                        [7.468128790680447, 51.49041366436515],
                        [7.458954317165723, 51.48614090871683],
                        [7.455268177793453, 51.48668294227042]
                    ]
                ]
            },
            properties: { name: "Glückaufssegen" }
        }
    ]
} satisfies SearchResponse;

const mockedEmptyGeoJSON = {
    type: "FeatureCollection",
    numberReturned: 0,
    numberMatched: 0,
    timeStamp: "2023-12-01T12:28:16Z",
    features: []
} satisfies SearchResponse;

it("expect search source performs http requests to search", async () => {
    mockedFetch.mockResolvedValue(createFetchResponse(mockedGeoJSON, 200));

    const { source, search } = setup({
        label: "custom label",
        baseUrl: "https://service.example.com",
        collectionId: "col",
        searchProperty: "foo",
        labelProperty: "name"
    });
    expect(source.label).toBe("custom label");

    const results = await search("does-not-matter");
    expect(mockedFetch).toHaveBeenCalledOnce();
    expect(mockedFetch.mock.calls[0]![0]!).toMatchInlineSnapshot(
        '"https://service.example.com/collections/col/items?foo=*does-not-matter*&limit=123&f=json"'
    );

    const simpleResults = results.map((result) => {
        const { geometry, ...rest } = result;
        return {
            ...rest,
            geometry: geometry?.getType() + "..."
        };
    });

    expect(simpleResults).toMatchInlineSnapshot(`
      [
        {
          "geometry": "Polygon...",
          "id": "4000075001",
          "label": "Aldenhoven 6",
          "properties": {
            "name": "Aldenhoven 6",
          },
        },
        {
          "geometry": "Polygon...",
          "id": "4000050002",
          "label": "Glückaufssegen",
          "properties": {
            "name": "Glückaufssegen",
          },
        },
      ]
    `);
});

it("expect search source to use the 'maxResults' parameter as request limit", async () => {
    mockedFetch.mockResolvedValue(createFetchResponse(mockedEmptyGeoJSON, 200));

    const { search } = setup({
        baseUrl: "https://service.example.com?token=1234&foo=xyz", // token transported; foo overwritten
        collectionId: "col",
        searchProperty: "foo"
    });

    const results = await search("does-not-matter", 42);
    expect(results.length).toBe(0);

    expect(mockedFetch).toHaveBeenCalledOnce();

    const url = mockedFetch.mock.calls[0]![0]! as URL;
    expect(url.searchParams.get("limit")).toBe("42");
});

it("expect search source transport original query parameters from base url", async () => {
    mockedFetch.mockResolvedValue(createFetchResponse(mockedEmptyGeoJSON, 200));

    const { search } = setup({
        baseUrl: "https://service.example.com?token=1234&foo=xyz", // token transported; foo overwritten
        collectionId: "col",
        searchProperty: "foo"
    });

    const results = await search("does-not-matter");
    expect(results.length).toBe(0);

    expect(mockedFetch).toHaveBeenCalledOnce();
    expect(mockedFetch.mock.calls[0]![0]!).toMatchInlineSnapshot(
        '"https://service.example.com/collections/col/items?token=1234&foo=*does-not-matter*&limit=123&f=json"'
    );
});

it("expect search source to use the rewriteUrlFunction", async () => {
    mockedFetch.mockResolvedValue(createFetchResponse(mockedEmptyGeoJSON, 200));

    const spy = vi.fn();
    const { search } = setup({
        rewriteUrl: spy
    });

    spy.mockReturnValue(new URL("https://custom.example.com/?foo=bar"));

    const results = await search("does-not-matter");
    expect(results.length).toBe(0);

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(
        '"https://example.com/collections/test-collection/items?test-property=*does-not-matter*&limit=123&f=json"'
    );
    expect(mockedFetch).toHaveBeenCalledOnce();
    expect(mockedFetch.mock.calls[0]![0]!).toMatchInlineSnapshot(
        '"https://custom.example.com/?foo=bar"'
    );
});

it("expect search source to use the renderLabelFunction", async () => {
    mockedFetch.mockResolvedValue(createFetchResponse(mockedGeoJSON, 200));

    const { search } = setup({
        baseUrl: "https://ogc-api.nrw.de/inspire-am-bergbauberechtigungen/v1",
        collectionId: "managementrestrictionorregulationzone",
        searchProperty: "thematicId",
        labelProperty: "name",
        renderLabel(feature) {
            const name = feature?.properties?.name;
            const id = feature?.id;

            if (typeof name === "string") {
                return name + " (" + id + ")";
            } else {
                return String(id);
            }
        }
    });
    const results = await search("500");
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(results?.[0]?.label).toBe("Aldenhoven 6 (4000075001)");
    expect(results?.[1]?.label).toBe("Glückaufssegen (4000050002)");
});

it("expect search source to use the labelProperty", async () => {
    mockedFetch.mockResolvedValue(createFetchResponse(mockedGeoJSON, 200));

    const { search } = setup({
        baseUrl: "https://ogc-api.nrw.de/inspire-am-bergbauberechtigungen/v1",
        collectionId: "managementrestrictionorregulationzone",
        searchProperty: "thematicId",
        labelProperty: "name"
    });

    const results = await search("500");
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(results?.[0]?.label).toBe("Aldenhoven 6");
    expect(results?.[1]?.label).toBe("Glückaufssegen");
});

it("expect search source to use the searchProperty", async () => {
    mockedFetch.mockResolvedValue(createFetchResponse(mockedGeoJSON, 200));

    const { search } = setup({
        baseUrl: "https://ogc-api.nrw.de/inspire-am-bergbauberechtigungen/v1",
        collectionId: "managementrestrictionorregulationzone",
        searchProperty: "thematicId"
    });
    const results = await search("500");
    expect(mockedFetch).toHaveBeenCalledTimes(1);

    // empty because search property is not in features returned by the service
    expect(results?.[0]?.label).toBe("");
    expect(results?.[1]?.label).toBe("");
});

function createFetchResponse(data: object, statusCode: number) {
    return new Response(JSON.stringify(data), {
        status: statusCode
    });
}

function setup(options?: Partial<OgcFeatureSearchSourceOptions>) {
    const source = new OgcFeatureSearchSource(
        {
            label: "Test label",
            baseUrl: "https://example.com",
            collectionId: "test-collection",
            searchProperty: "test-property",
            ...options
        },
        {
            fetch: mockedFetch
        }
    );

    const search = (input: string, maxResults = 123) => {
        const controller = new AbortController();
        const projection = getProjection("EPSG:4326")!;
        return source.search(input, {
            mapProjection: projection,
            maxResults: maxResults,
            signal: controller.signal
        });
    };

    return { source, search };
}
