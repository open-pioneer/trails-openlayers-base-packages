// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import ImageLayer from "ol/layer/Image";
import ImageSource from "ol/source/Image";
import ImageWMS from "ol/source/ImageWMS";
import { get as getProjection } from "ol/proj";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AbstractLayerBase } from "../AbstractLayerBase";
import { MapModelImpl } from "../MapModelImpl";
import { WMSLayerImpl } from "./WMSLayerImpl";

const SERVICE_URL = "https://example.com/wms-service";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.restoreAllMocks();
});

it("provides the wms service url", () => {
    const layer = new WMSLayerImpl({
        title: "Layer",
        url: SERVICE_URL
    });
    expect(layer.url).toBe(SERVICE_URL);
});

it("creates and configure a wms source", () => {
    const layer = new WMSLayerImpl({
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
    const layer = new WMSLayerImpl({
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

it("configures the source's LAYERS parameter for sublayers", () => {
    const layer = new WMSLayerImpl({
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

it("only configures the source's LAYERS parameter for leaf sublayers", () => {
    const layer = new WMSLayerImpl({
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
    const layer = new WMSLayerImpl({
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

it("updates the layer's LAYERS param if a sublayer's visibility changes", () => {
    const layer = new WMSLayerImpl({
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
    layer.__attach({} as MapModelImpl);

    const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
    const getLayersParam = () => olSource.getParams()["LAYERS"];
    expect(getLayersParam()).toEqual(["sublayer-2"]);

    layer.sublayers.getSublayers()[0]!.setVisible(true);
    vi.advanceTimersByTime(1000);
    expect(getLayersParam()).toEqual(["sublayer-1", "sublayer-2"]);

    layer.sublayers.getSublayers()[1]!.setVisible(false);
    vi.advanceTimersByTime(1000);
    expect(getLayersParam()).toEqual(["sublayer-1"]);
});

it("provides access to sublayers", () => {
    const layer = new WMSLayerImpl({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1"
            }
        ]
    });
    layer.__attach({} as MapModelImpl);

    const sublayers = layer.sublayers.getSublayers();
    expect(sublayers.length).toBe(1);

    const sublayer = sublayers[0]!;
    expect(sublayer).toBeInstanceOf(AbstractLayerBase);
    expect(sublayer.name).toBe("sublayer-1");
    expect(sublayer.title).toBe("Sublayer 1");
    expect(sublayer.parentLayer).toBe(layer);
    expect(sublayer.parent).toBe(layer);
});

it("provides access to nested sublayers", () => {
    const layer = new WMSLayerImpl({
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
        ]
    });
    layer.__attach({} as MapModelImpl);

    const sublayer1 = layer.sublayers.getSublayers()[0]!;
    const sublayer2 = sublayer1.sublayers.getSublayers()[0]!;
    expect(sublayer2.name).toBe("sublayer-2");
    expect(sublayer2.title).toBe("Sublayer 2");
    expect(sublayer2.parentLayer).toBe(layer);
    expect(sublayer2.parent).toBe(sublayer1);
});

it("uses http service to fetch images", async () => {
    /*
        This test ensures that the image source used by WMSLayer uses
        the httpService provided by the map model to fetch images.

        It triggers a load() on the source used by the image layer (in a way usually done
        by the open layers map) and checks that the mocked httpService is actually being called for the URL.
    */

    const layer = new WMSLayerImpl({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1"
            }
        ]
    });
    const urls: string[] = [];
    const httpService: Partial<HttpService> = {
        async fetch(url) {
            urls.push(String(url));
            return new Response("", {
                status: 200
            });
        }
    };
    layer.__attach({
        __sharedDependencies: {
            httpService: httpService as HttpService
        }
    } as MapModelImpl);

    const source = (layer.olLayer as ImageLayer<ImageSource>).getSource()!;
    const projection = getProjection("EPSG:3857")!;
    const image = source.getImage([1, 2, 3, 4], 123, 42, projection);
    image.load();

    vi.advanceTimersByTime(1000);
    expect(urls).toHaveLength(1);
    expect(urls[0]!).toMatch(/^https:\/\/example\.com\/wms-service\?REQUEST=GetMap/);
});

it("does not have a source if no sublayers are visible", () => {
    const layer = new WMSLayerImpl({
        title: "Layer",
        url: SERVICE_URL
    });

    // ImageWMS with 'LAYERS' param set to [] produces network errors,
    // so this class just un-sets the source instead while no sublayers are visible.
    const source = (layer.olLayer as ImageLayer<any>).getSource();
    expect(source).toBeNull();
});
