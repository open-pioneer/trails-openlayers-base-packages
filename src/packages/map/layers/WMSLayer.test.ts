// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { nextTick } from "@conterra/reactivity-core";
import { HttpService } from "@open-pioneer/http";
import { createTestLayer } from "@open-pioneer/map-test-utils";
import ImageLayer from "ol/layer/Image";
import { get as getProjection } from "ol/proj";
import ImageSource from "ol/source/Image";
import ImageWMS from "ol/source/ImageWMS";
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MapModel } from "../model/MapModel";
import { AbstractLayerBase } from "./AbstractLayerBase";
import { WMSLayer, WMSLayerConfig } from "./WMSLayer";
import { ATTACH_TO_MAP, LAYER_DEPS } from "./shared/internals";
import { ViewStateLayerStateExtent } from "ol/View";
import { Source } from "ol/source";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const WMS_NW_DGK5_CAPAS = readFileSync(
    resolve(import.meta.dirname, "./wms/test-data/wms_nw_dgk5.xml"),
    "utf-8"
);

const SERVICE_URL = "https://example.com/wms-service";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.restoreAllMocks();
});

it("provides the wms service url", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL
    });
    expect(layer.url).toBe(SERVICE_URL);
});

it("creates and configure a wms source", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-name",
                title: "Sublayer"
            }
        ]
    });

    const olLayer = layer.olLayer;
    expect(olLayer).toBeInstanceOf(ImageLayer);

    const olSource = (olLayer as ImageLayer<any>).getSource();
    expect(olSource).toBeInstanceOf(ImageWMS);
});

it("supports additional source options", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-name",
                title: "Sublayer"
            }
        ],
        sourceOptions: {
            attributions: "Test-Attributions",
            ratio: 0.5,
            params: {
                "FOO": "foo"
            }
        }
    });

    const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
    const attributions = olSource.getAttributions()!(undefined as any);
    expect(attributions).toMatchInlineSnapshot(`
      [
        "Test-Attributions",
      ]
    `);

    const ratio = (olSource as any).ratio_ as number; // No getter
    expect(ratio).toBe(0.5);

    // LAYERS is managed by the class but other params are not overwritten
    const params = olSource.getParams();
    expect(params).toMatchInlineSnapshot(`
      {
        "FOO": "foo",
        "LAYERS": [
          "sublayer-name",
        ],
      }
    `);
});

it("uses http service to fetch images", async () => {
    /*
        This test ensures that the image source used by WMSLayer uses
        the httpService provided by the map model to fetch images.

        It triggers a load() on the source used by the image layer (in a way usually done
        by the open layers map) and checks that the mocked httpService is actually being called for the URL.
    */
    let urls: string[] = [];
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1"
            }
        ],
        attach: true,
        fetch: vi.fn(async (url) => {
            urls.push(String(url));
            return new Response("", {
                status: 200
            });
        })
    });

    await vi.waitUntil(() => urls.length > 0); // Initial metadata
    urls = [];

    const source = (layer.olLayer as ImageLayer<ImageSource>).getSource()!;
    const projection = getProjection("EPSG:3857")!;
    const image = source.getImage([1, 2, 3, 4], 123, 42, projection);
    image.load();

    vi.advanceTimersByTime(1000);
    expect(urls).toHaveLength(1);
    expect(urls[0]!).toMatch(/^https:\/\/example\.com\/wms-service\?REQUEST=GetMap/);
});

it("fetches capabilities if 'fetchCapabilities' property is set to true", async () => {
    const urls: string[] = [];
    createLayer({
        title: "Layer",
        url: SERVICE_URL,
        fetchCapabilities: true,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1"
            }
        ],
        attach: true,
        fetch: vi.fn(async (url) => {
            urls.push(String(url));
            return new Response("", {
                status: 200
            });
        })
    });

    await vi.waitUntil(() => urls.length > 0);
    expect(urls[0]!).toMatch(/(^https:\/\/example\.com\/wms-service).*&REQUEST=GetCapabilities/);
});

it("does not fetch capabilities if 'fetchCapabilities' property is set to false", async () => {
    const urls: string[] = [];
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        fetchCapabilities: false,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1"
            }
        ],
        attach: true,
        fetch: vi.fn(async (url) => {
            urls.push(String(url));
            return new Response("", {
                status: 200
            });
        })
    });

    const source = (layer.olLayer as ImageLayer<ImageSource>).getSource()!;
    const projection = getProjection("EPSG:3857")!;
    const image = source.getImage([1, 2, 3, 4], 123, 42, projection);
    image.load();

    vi.advanceTimersByTime(1000);
    expect(urls).toHaveLength(1); // if capabilities were fetched, the length of urls would be 2
    expect(urls[0]!).toMatch(/^https:\/\/example\.com\/wms-service\?REQUEST=GetMap/);
});

it("supports explicit attributions via sourceOptions", async () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-name",
                title: "Sublayer"
            }
        ],
        sourceOptions: {
            attributions: "Custom Attributions"
        }
    });

    const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
    expect(getAttributions(olSource)).toMatchInlineSnapshot(`"Custom Attributions"`);
});

it("loads attributions from service metadata", async () => {
    const fetch = mockFetch(WMS_NW_DGK5_CAPAS);
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-name",
                title: "Sublayer"
            }
        ],
        fetch
    });

    const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
    const attributions = await vi.waitUntil(() => getAttributions(olSource));
    expect(attributions).toMatchInlineSnapshot(
        `"Die Geobasisdaten des amtlichen Vermessungswesens werden als öffentliche Aufgabe gem. VermKatG NRW und gebührenfrei nach Open Data-Prinzipien über online-Verfahren bereitgestellt. Nutzungsbedingungen: Es gelten die durch den IT-Planungsrat im Datenportal für Deutschland (GovData) veröffentlichten einheitlichen Lizenzbedingungen „Datenlizenz Deutschland – Zero“ (https://www.govdata.de/dl-de/zero-2-0). Jede Nutzung ist ohne Einschränkungen oder Bedingungen zulässig. Eine Haftung für die zur Verfügung gestellten Daten und Dienste wird ausgeschlossen. Dies gilt insbesondere für deren Aktualität, Richtigkeit, Verfügbarkeit, Qualität und Vollständigkeit sowie die Kompatibilität und Interoperabilität mit den Systemen des Nutzers. Vom Haftungsausschluss ausgenommen sind gesetzliche Schadensersatzansprüche für eine Verletzung des Lebens, des Körpers und der Gesundheit sowie die gesetzliche Haftung für sonstige Schäden, soweit diese auf einer vorsätzlichen oder grob fahrlässigen Pflichtverletzung beruhen."`
    );
});

describe("sublayers", () => {
    it("does not have a source if no sublayers are visible", () => {
        const { layer } = createLayer({
            title: "Layer",
            url: SERVICE_URL
        });

        // ImageWMS with 'LAYERS' param set to [] produces network errors,
        // so this class just un-sets the source instead while no sublayers are visible.
        const source = (layer.olLayer as ImageLayer<any>).getSource();
        expect(source).toBeNull();
    });

    it("configures the source's LAYERS parameter for sublayers", () => {
        const { layer } = createLayer({
            title: "Layer",
            url: SERVICE_URL,
            sublayers: [
                {
                    name: "sublayer-1",
                    title: "Sublayer 1"
                },
                {
                    name: "sublayer-2",
                    title: "Sublayer 2"
                }
            ]
        });
        const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
        const layersParam = olSource.getParams()["LAYERS"];
        expect(layersParam).toEqual(["sublayer-1", "sublayer-2"]);
    });

    it("only configures the source's LAYERS parameter for sublayers with optional `name` prop ", () => {
        const { layer } = createLayer({
            title: "Layer",
            url: SERVICE_URL,
            sublayers: [
                {
                    title: "Parent sublayer",
                    sublayers: [
                        {
                            title: "Subparent sublayer",
                            sublayers: [{ name: "sublayer-1", title: "Sublayer 1" }]
                        },
                        {
                            name: "sublayer-2",
                            title: "Sublayer 2"
                        }
                    ]
                }
            ]
        });
        const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
        const layersParam = olSource.getParams()["LAYERS"];
        expect(layersParam).toEqual(["sublayer-1", "sublayer-2"]);
    });

    it("only configures the source's LAYERS parameter for leaf sublayers", () => {
        const { layer } = createLayer({
            title: "Layer",
            url: SERVICE_URL,
            sublayers: [
                {
                    name: "parent-sublayer",
                    title: "Parent sublayer",
                    sublayers: [
                        {
                            name: "sublayer-1",
                            title: "Sublayer 1"
                        },
                        {
                            name: "sublayer-2",
                            title: "Sublayer 2"
                        }
                    ]
                }
            ]
        });

        // If parent-sublayer were also included in this array, their children would always
        // be shown, even if those children were set to invisible.
        const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
        const layersParam = olSource.getParams()["LAYERS"];
        expect(layersParam).toEqual(["sublayer-1", "sublayer-2"]);
    });

    it("excludes invisible sublayers from the LAYERS parameter", () => {
        const { layer } = createLayer({
            title: "Layer",
            url: SERVICE_URL,
            sublayers: [
                {
                    name: "sublayer-1",
                    title: "Sublayer 1",
                    visible: false
                },
                {
                    name: "sublayer-2",
                    title: "Sublayer 2"
                }
            ]
        });
        const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
        const layersParam = olSource.getParams()["LAYERS"];
        expect(layersParam).toEqual(["sublayer-2"]);
    });

    it("updates the layer's LAYERS param if a sublayer's visibility changes", async () => {
        const { layer } = createLayer({
            title: "Layer",
            url: SERVICE_URL,
            sublayers: [
                {
                    name: "sublayer-1",
                    title: "Sublayer 1",
                    visible: false
                },
                {
                    name: "sublayer-2",
                    title: "Sublayer 2"
                }
            ],
            attach: true
        });

        const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
        const getLayersParam = () => olSource.getParams()["LAYERS"];
        expect(getLayersParam()).toEqual(["sublayer-2"]);

        layer.sublayers.getSublayers()[0]!.setVisible(true);
        vi.advanceTimersByTime(1000);
        await nextTick();

        expect(getLayersParam()).toEqual(["sublayer-1", "sublayer-2"]);

        layer.sublayers.getSublayers()[1]!.setVisible(false);
        vi.advanceTimersByTime(1000);
        await nextTick();

        expect(getLayersParam()).toEqual(["sublayer-1"]);
    });

    it("provides access to sublayers", () => {
        const { layer } = createLayer({
            title: "Layer",
            url: SERVICE_URL,
            sublayers: [
                {
                    name: "sublayer-1",
                    title: "Sublayer 1"
                }
            ],
            attach: true
        });
        expect(layer.children).toBe(layer.sublayers);

        const sublayers = layer.sublayers.getSublayers();
        expect(sublayers.length).toBe(1);

        const sublayer = sublayers[0]!;
        expect(sublayer).toBeInstanceOf(AbstractLayerBase);
        expect(sublayer.name).toBe("sublayer-1");
        expect(sublayer.title).toBe("Sublayer 1");
        expect(sublayer.parentLayer).toBe(layer);
        expect(sublayer.parent).toBe(layer);
    });

    it("should return internal sublayers only if explicitly specified", () => {
        const { layer } = createLayer({
            title: "Layer",
            url: SERVICE_URL,
            sublayers: [
                {
                    name: "sublayer-1",
                    title: "Sublayer 1"
                },
                {
                    name: "sublayer-2",
                    title: "Sublayer 2",
                    internal: true
                }
            ],
            attach: true
        });

        let sublayers = layer.sublayers.getSublayers();
        expect(sublayers.length).toBe(1);
        sublayers = layer.sublayers.getSublayers({ includeInternalLayers: true });
        expect(sublayers.length).toBe(2);

        sublayers = layer.sublayers.getItems();
        expect(sublayers.length).toBe(1);
        sublayers = layer.sublayers.getItems({ includeInternalLayers: true });
        expect(sublayers.length).toBe(2);
    });

    it("provides access to nested sublayers", () => {
        const { layer } = createLayer({
            title: "Layer",
            url: SERVICE_URL,
            sublayers: [
                {
                    name: "sublayer-1",
                    title: "Sublayer 1",
                    sublayers: [
                        {
                            name: "sublayer-2",
                            title: "Sublayer 2"
                        }
                    ]
                }
            ],
            attach: true
        });

        const sublayer1 = layer.sublayers.getSublayers()[0]!;
        const sublayer2 = sublayer1?.sublayers?.getSublayers()?.length
            ? sublayer1.sublayers.getSublayers()[0]
            : null;
        expect(sublayer2?.name).toBe("sublayer-2");
        expect(sublayer2?.title).toBe("Sublayer 2");
        expect(sublayer2?.parentLayer).toBe(layer);
        expect(sublayer2?.parent).toBe(sublayer1);
    });

    it("should return all wms sublayers", () => {
        const { layer } = createLayer({
            title: "Layer",
            url: SERVICE_URL,
            sublayers: [
                {
                    name: "sublayer-1",
                    title: "Sublayer 1",
                    id: "sublayer1",
                    sublayers: [
                        {
                            name: "sublayer-2",
                            title: "Sublayer 2",
                            id: "sublayer2"
                        }
                    ]
                }
            ],
            attach: true
        });

        const sublayers = layer.sublayers.getRecursiveLayers();
        const sublayerIds = sublayers.map((sublayer) => sublayer.id);
        expect(sublayerIds).toContain("sublayer1");
        expect(sublayerIds).toContain("sublayer2");
    });

    it("should return internal sublayers only if explicitly specified (recursive retrieval)", () => {
        const { layer } = createLayer({
            title: "Layer",
            url: SERVICE_URL,
            sublayers: [
                {
                    name: "sublayer-1",
                    title: "Sublayer 1",
                    id: "sublayer1",
                    sublayers: [
                        {
                            name: "sublayer-2",
                            title: "Sublayer 2",
                            id: "sublayer2",
                            internal: true,
                            sublayers: [
                                {
                                    name: "sublayer-3",
                                    title: "Sublayer 3",
                                    id: "sublayer3"
                                }
                            ]
                        }
                    ]
                }
            ],
            attach: true
        });

        let sublayers = layer.sublayers.getRecursiveLayers();
        let sublayerIds = sublayers.map((sublayer) => sublayer.id);
        expect(sublayerIds.length).toBe(1);
        expect(sublayerIds).toContain("sublayer1");

        sublayers = layer.sublayers.getRecursiveLayers({ includeInternalLayers: true });
        sublayerIds = sublayers.map((sublayer) => sublayer.id);
        expect(sublayerIds.length).toBe(3);
        expect(sublayerIds).toContain("sublayer1");
        expect(sublayerIds).toContain("sublayer2");
        expect(sublayerIds).toContain("sublayer3");
    });
});

function createLayer(options: WMSLayerConfig & { fetch?: Mock; attach?: boolean }) {
    const { fetch = defaultFetch, attach = true, ...wmsOptions } = options;

    const httpService = {
        fetch
    } satisfies Partial<HttpService> as HttpService;
    const mapModel = {
        [LAYER_DEPS]: {
            httpService: httpService as HttpService
        }
    } satisfies Partial<MapModel> as MapModel;

    const layer = createTestLayer(
        {
            type: WMSLayer,
            ...wmsOptions
        },
        {
            fetch
        }
    );

    if (attach) {
        // Triggers load()
        layer[ATTACH_TO_MAP](mapModel);
    }

    return {
        layer,
        mapModel,
        httpService
    };
}

function mockFetch(capas: string) {
    return vi.fn((urlString: string) => {
        const url = new URL(urlString);
        if (url.searchParams.get("REQUEST") === "GetCapabilities") {
            return new Response(capas, { status: 200 });
        }
        throw new Error("Unexpected request URL: " + urlString);
    });
}

function getAttributions(source: Source) {
    const attributions = source.getAttributions();
    const extent = {} as ViewStateLayerStateExtent;
    return Array.from(attributions?.(extent) ?? []).join("\n");
}

async function defaultFetch() {
    return new Response("", { status: 200 });
}
