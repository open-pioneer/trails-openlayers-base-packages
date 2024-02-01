// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import TileState from "ol/TileState";
import TileLayer from "ol/layer/Tile";
import { get as getProjection } from "ol/proj";
import { WMTS } from "ol/source";
import { Mock, afterEach, expect, it, vi } from "vitest";
import { WMTSLayer, WMTSLayerConfig } from "../../api";
import { MapModelImpl } from "../MapModelImpl";
import { WMTSLayerImpl } from "./WMTSLayerImpl";
import SimpleWMTSCapas from "./test-data/SimpleWMTSCapas.xml?raw";

// happy dom does not implement an XML parser
// https://github.com/capricorn86/happy-dom/issues/282
import jsdom from "jsdom";
window.DOMParser = new jsdom.JSDOM().window.DOMParser;

const SERVICE_URL = "https://example.com/wmts-service/Capabilities.xml";

afterEach(() => {
    vi.restoreAllMocks();
});

it("uses http service to fetch images", async () => {
    /*
        This test ensures that the image source used by WMTSLayer uses
        the httpService provided by the map model to fetch tiles.

        It triggers a load() on the source used by the tile layer (in a way usually done
        by the open layers map) and checks that the mocked httpService is actually being called for the URL.
    */

    const fetch = vi.fn(async (url: string) => {
        if (url === SERVICE_URL) {
            return new Response(SimpleWMTSCapas, {
                status: 200
            });
        }

        return new Response("", { status: 200 }); // tile req
    });
    const { layer } = createLayer({
        title: "foo",
        name: "layer-7328",
        matrixSet: "EPSG:3857",
        url: SERVICE_URL,
        attach: true,
        fetch: fetch
    });

    // Initializes with metadata
    const source = await waitForSource(layer);
    fetch.mockClear();

    // Attempt to fetch a single tile through the source
    const projection = getProjection("EPSG:3857")!;
    const tile = source.getTile(1, 2, 3, 1, projection);
    (tile as any).state = TileState.IDLE; // hack to allow fetch
    tile.load();
    expect(fetch).toHaveBeenCalledOnce();
});

function createLayer(
    options: WMTSLayerConfig & { fetch?: Mock; attach?: boolean; waitForCapas?: boolean }
) {
    const layer = new WMTSLayerImpl(options);
    const httpService = {
        fetch:
            options?.fetch ??
            vi.fn().mockImplementation(async () => new Response("", { status: 200 }))
    } as HttpService;
    const mapModel = {
        __sharedDependencies: {
            httpService: httpService as HttpService
        }
    } as MapModelImpl;

    if (options?.attach) {
        layer.__attach(mapModel);
    }

    return {
        layer,
        mapModel,
        httpService
    };
}

async function waitForSource(layer: WMTSLayer) {
    const olLayer = layer.olLayer as TileLayer<WMTS>;
    const source = await vi.waitUntil(() => olLayer.getSource());
    return source!;
}
