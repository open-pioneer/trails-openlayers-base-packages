// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { createTestLayer } from "@open-pioneer/map-test-utils";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TileState from "ol/TileState";
import { ViewStateLayerStateExtent } from "ol/View";
import TileLayer from "ol/layer/Tile";
import { get as getProjection } from "ol/proj";
import { Source, WMTS } from "ol/source";
import { Mock, afterEach, describe, expect, it, vi } from "vitest";
import { MapModel } from "../model/MapModel";
import { WMTSLayer, WMTSLayerConfig } from "./WMTSLayer";
import { ATTACH_TO_MAP, LAYER_DEPS } from "./shared/internals";

const SIMPLE_WMTS_CAPAS = readFileSync(
    resolve(import.meta.dirname, "./wmts/test-data/SimpleWMTSCapas.xml"),
    "utf-8"
);
const WMTS_CAPAS_WITH_LEGEND = readFileSync(
    resolve(import.meta.dirname, "./wmts/test-data/SimpleWMTSCapasWithLegend.xml"),
    "utf-8"
);

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
    const fetch = fetchStaticCapas(SIMPLE_WMTS_CAPAS);

    const { layer } = createLayer({
        title: "foo",
        name: "layer-7328",
        matrixSet: "EPSG:3857",
        url: SERVICE_URL,
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
        fetch: fetch
    });

    // wait for async operations
    await vi.waitFor(() => {
        expect(logErrorSpy).toHaveBeenCalled();
        expect(logErrorSpy.mock.lastCall![0]).toContain("Failed to initialize WMTS layer");
        expect(`${logErrorSpy.mock.lastCall![1]}`).toContain("404");
    });
    // TODO: should be "error" once implemented
    expect(l.layer.loadState).toBe("loaded");
});

it("logs error when layer not detected in capabilities", async () => {
    const fetch = fetchStaticCapas(SIMPLE_WMTS_CAPAS);
    const logErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    createLayer({
        title: "foo",
        name: "layer-not-found",
        matrixSet: "EPSG:3857",
        url: SERVICE_URL,
        fetch: fetch
    });

    // wait for async operations
    await vi.waitFor(() => {
        expect(logErrorSpy).toHaveBeenCalled();
        expect(logErrorSpy.mock.lastCall![0]).toContain("Failed to initialize WMTS layer");
        expect(`${logErrorSpy.mock.lastCall![1]}`).toContain(
            "Layer 'layer-not-found' was not found in capabilities"
        );
    });
});

it("logs error when matrixset not detected in capabilities", async () => {
    const fetch = fetchStaticCapas(SIMPLE_WMTS_CAPAS);
    const logErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    createLayer({
        title: "foo",
        name: "layer-7328",
        matrixSet: "EPSG:9999",
        url: SERVICE_URL,
        fetch: fetch
    });

    // wait for async operations
    await vi.waitFor(() => {
        expect(logErrorSpy).toHaveBeenCalled();
        expect(logErrorSpy.mock.lastCall![0]).toContain("Failed to initialize WMTS layer");
        expect(`${logErrorSpy.mock.lastCall![1]}`).toContain(
            "Tile matrix set 'EPSG:9999' was not found in capabilities"
        );
    });
});

it("logs error when style not detected in capabilities", async () => {
    const fetch = fetchStaticCapas(SIMPLE_WMTS_CAPAS);
    const logErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    createLayer({
        title: "foo",
        name: "layer-7328",
        matrixSet: "EPSG:3857",
        sourceOptions: {
            style: "non-existent-style"
        },
        url: SERVICE_URL,
        fetch: fetch
    });

    // wait for async operations
    await vi.waitFor(() => {
        expect(logErrorSpy).toHaveBeenCalled();
        expect(logErrorSpy.mock.lastCall![0]).toContain("Failed to initialize WMTS layer");
        expect(`${logErrorSpy.mock.lastCall![1]}`).toContain(
            "Style 'non-existent-style' was not found in capabilities"
        );
    });
});

it("allows switching of style, when supported in capabilities", async () => {
    const fetch = fetchStaticCapas(SIMPLE_WMTS_CAPAS);
    const { layer } = createLayer({
        title: "foo",
        name: "layer-7328",
        matrixSet: "EPSG:3857",
        sourceOptions: {
            style: "style=40"
        },
        url: SERVICE_URL,
        fetch: fetch
    });

    // Initializes with metadata
    const source = await waitForSource(layer);
    expect(source.getStyle()).toBe("style=40");
});

describe("attributions", () => {
    it("supports explicit attributions via sourceOptions", async () => {
        const fetch = fetchStaticCapas(SIMPLE_WMTS_CAPAS);
        const { layer } = createLayer({
            title: "foo",
            name: "layer-7328",
            matrixSet: "EPSG:3857",
            url: SERVICE_URL,

            fetch,
            sourceOptions: {
                attributions: "Custom Attributions"
            }
        });

        // Initializes with metadata
        const source = await waitForSource(layer);
        expect(getAttributions(source)).toMatchInlineSnapshot(`"Custom Attributions"`);
    });

    it("supports attributions from service", async () => {
        const fetch = fetchStaticCapas(WMTS_CAPAS_WITH_LEGEND);
        const { layer } = createLayer({
            title: "foo",
            name: "wmts_nw_landbedeckung",
            matrixSet: "EPSG_25832_12",
            url: SERVICE_URL,
            fetch
        });

        // Initializes with metadata
        const source = await waitForSource(layer);
        expect(getAttributions(source)).toMatchInlineSnapshot(
            `"Die Daten der Landbedeckung können unter der Datenlizenz Deutschland – Namensnennung – Version 2.0 genutzt werden. Dabei ist folgender Quellenvermerk anzugeben: "Enthält modifizierte Copernicus Sentinel-2 Daten [2021, 2022], verarbeitet durch Geobasis NRW; dl-de/by-2-0 (www.govdata.de/dl-de/by-2-0); https://www.wms.nrw.de/geobasis/wms_nw_landbedeckung""`
        );
    });
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

function createLayer(options: WMTSLayerConfig & { fetch?: Mock; attach?: boolean }) {
    const { fetch = defaultFetch, attach = true, ...wmtsOptions } = options;

    const httpService = {
        fetch
    } satisfies Partial<HttpService> as HttpService;
    const mapModel = {
        [LAYER_DEPS]: {
            httpService: httpService as HttpService
        }
    } satisfies Partial<MapModel> as MapModel;

    const layer = createTestLayer({ type: WMTSLayer, ...wmtsOptions }, httpService);
    if (attach) {
        // This will currently trigger loading of metadata
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

function getAttributions(source: Source) {
    const attributions = source.getAttributions();
    const extent = {} as ViewStateLayerStateExtent;
    return Array.from(attributions?.(extent) ?? []).join("\n");
}

async function defaultFetch() {
    return new Response("", { status: 200 });
}
