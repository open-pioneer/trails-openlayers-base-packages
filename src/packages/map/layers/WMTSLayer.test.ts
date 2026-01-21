// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { createTestLayer } from "@open-pioneer/map-test-utils";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import TileState from "ol/TileState";
import TileLayer from "ol/layer/Tile";
import { get as getProjection } from "ol/proj";
import { WMTS } from "ol/source";
import { Mock, afterEach, expect, it, vi } from "vitest";
import { MapModel } from "../model/MapModel";
import { WMTSLayer, WMTSLayerConfig } from "./WMTSLayer";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const WMTS_CAPAS = readFileSync(resolve(THIS_DIR, "./wmts/test-data/SimpleWMTSCapas.xml"), "utf-8");

// happy dom does not implement a good XML parser
import jsdom from "jsdom";
import { ATTACH_TO_MAP, LAYER_DEPS } from "./shared/internals";
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
    const fetch = fetchStaticCapas(WMTS_CAPAS);

    const { layer } = createLayer({
        title: "foo",
        name: "layer-7328",
        matrixSet: "EPSG:3857",
        url: SERVICE_URL,
        attach: true,
        fetch
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

it("logs error when capabilities cannot be fetched", async () => {
    const fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === SERVICE_URL) {
            return new Response("Service not found", {
                status: 404
            });
        }

        return new Response("", { status: 200 }); // tile req
    });
    const logErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const l = createLayer({
        title: "foo",
        name: "layer-7328",
        matrixSet: "EPSG:3857",
        url: SERVICE_URL,
        attach: true,
        fetch: fetch
    });

    // wait for async operations
    await vi.waitFor(() => {
        expect(logErrorSpy).toHaveBeenCalled();
        expect(logErrorSpy.mock.lastCall![0]).toContain("Failed initialize WMTS for Layer");
        expect(`${logErrorSpy.mock.lastCall![1]}`).toContain("404");
    });
    // TODO: should be "error" once implemented
    expect(l.layer.loadState).toBe("loaded");
});

it("logs error when layer not detected in capabilities", async () => {
    const fetch = fetchStaticCapas(WMTS_CAPAS);
    const logErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    createLayer({
        title: "foo",
        name: "layer-not-found",
        matrixSet: "EPSG:3857",
        url: SERVICE_URL,
        attach: true,
        fetch: fetch
    });

    // wait for async operations
    await vi.waitFor(() => {
        expect(logErrorSpy).toHaveBeenCalled();
        expect(logErrorSpy.mock.lastCall![0]).toContain("Failed initialize WMTS for Layer");
        expect(`${logErrorSpy.mock.lastCall![1]}`).toContain(
            "Layer 'layer-not-found' was not found in capabilities"
        );
    });
});

it("logs error when matrixset not detected in capabilities", async () => {
    const fetch = fetchStaticCapas(WMTS_CAPAS);
    const logErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    createLayer({
        title: "foo",
        name: "layer-7328",
        matrixSet: "EPSG:9999",
        url: SERVICE_URL,
        attach: true,
        fetch: fetch
    });

    // wait for async operations
    await vi.waitFor(() => {
        expect(logErrorSpy).toHaveBeenCalled();
        expect(logErrorSpy.mock.lastCall![0]).toContain("Failed initialize WMTS for Layer");
        expect(`${logErrorSpy.mock.lastCall![1]}`).toContain(
            "Tile matrix set 'EPSG:9999' was not found in capabilities"
        );
    });
});

it("logs error when style not detected in capabilities", async () => {
    const fetch = fetchStaticCapas(WMTS_CAPAS);
    const logErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    createLayer({
        title: "foo",
        name: "layer-7328",
        matrixSet: "EPSG:3857",
        sourceOptions: {
            style: "non-existent-style"
        },
        url: SERVICE_URL,
        attach: true,
        fetch: fetch
    });

    // wait for async operations
    await vi.waitFor(() => {
        expect(logErrorSpy).toHaveBeenCalled();
        expect(logErrorSpy.mock.lastCall![0]).toContain("Failed initialize WMTS for Layer");
        expect(`${logErrorSpy.mock.lastCall![1]}`).toContain(
            "Style 'non-existent-style' was not found in capabilities"
        );
    });
});

it("allows switching of style, when supported in capabilities", async () => {
    const fetch = fetchStaticCapas(WMTS_CAPAS);
    const { layer } = createLayer({
        title: "foo",
        name: "layer-7328",
        matrixSet: "EPSG:3857",
        sourceOptions: {
            style: "style=40"
        },
        url: SERVICE_URL,
        attach: true,
        fetch: fetch
    });

    // Initializes with metadata
    const source = await waitForSource(layer);
    expect(source.getStyle()).toBe("style=40");
});

function fetchStaticCapas(capabilities: string) {
    return vi.fn(async (url: string) => {
        if (url === SERVICE_URL) {
            return new Response(capabilities, {
                status: 200
            });
        }
        return new Response("", { status: 200 }); // tile req
    });
}

function createLayer(
    options: WMTSLayerConfig & { fetch?: Mock; attach?: boolean; waitForCapas?: boolean }
) {
    const httpService = {
        fetch:
            options?.fetch ??
            vi.fn().mockImplementation(async () => new Response("", { status: 200 }))
    } as HttpService;
    const layer = createTestLayer({ type: WMTSLayer, ...options }, httpService);

    const mapModel = {
        [LAYER_DEPS]: {
            httpService: httpService as HttpService
        }
    } as MapModel;

    // ensure that [ATTACH_TO_MAP] can be called
    function isAttachable(l: unknown): l is { [ATTACH_TO_MAP](mapModel: MapModel): void } {
        return !!l && typeof (l as any)[ATTACH_TO_MAP] === "function";
    }
    if (options?.attach && isAttachable(layer)) {
        layer[ATTACH_TO_MAP](mapModel);
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
