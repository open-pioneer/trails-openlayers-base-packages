// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment node
 */
import Layer from "ol/layer/Layer";
import TileLayer from "ol/layer/Tile";
import { HttpService } from "@open-pioneer/http";
import { Mock, SpyInstance, afterEach, describe, expect, it, vi } from "vitest";
import { HealthCheckFunction, LayerConfig, SimpleLayerConfig } from "../api";
import { AbstractLayer } from "./AbstractLayer";
import Source, { State } from "ol/source/Source";
import { MapModelImpl } from "./MapModelImpl";

afterEach(() => {
    vi.restoreAllMocks();
});

it("supports access to the olLayer", async () => {
    const olLayer = new TileLayer({});
    const { layer } = createLayer({
        id: "a",
        title: "Foo",
        olLayer: olLayer
    });
    expect(layer.olLayer).toBe(olLayer);
});

it("supports the visibility attribute", async () => {
    const { layer } = createLayer({
        id: "a",
        title: "A",
        olLayer: new TileLayer({})
    });
    expect(layer.visible).toBe(true);
    expect(layer.olLayer.getVisible()).toBe(true);

    let changedVisibility = 0;
    let changed = 0;
    layer.on("changed:visible", () => ++changedVisibility);
    layer.on("changed", () => ++changed);

    layer.setVisible(false);
    expect(changedVisibility).toBe(1);
    expect(changed).toBe(1);
    expect(layer.visible).toBe(false);
    expect(layer.olLayer.getVisible()).toBe(false);

    layer.setVisible(true);
    expect(changedVisibility).toBe(2);
    expect(changed).toBe(2);
    expect(layer.visible).toBe(true);
    expect(layer.olLayer.getVisible()).toBe(true);
});

it("logs a warning when setVisible() is called on a base layer", async () => {
    const logSpy = vi.spyOn(global.console, "warn").mockImplementation(() => undefined);
    const { layer } = createLayer({
        id: "a",
        title: "Base Layer 1",
        isBaseLayer: true,
        olLayer: new TileLayer({})
    });
    layer.setVisible(false);
    expect(layer.visible).toBe(true);
    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction warn] {
        "calls": [
          [
            "[WARN] map:AbstractLayer: Cannot change visibility of base layer 'a': use activateBaseLayer() on the map's LayerCollection instead.",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
});

it("tracks the layer source's state", async () => {
    let source = new Source({
        state: "ready"
    });
    const olLayer = new Layer({
        source
    });
    const { layer } = createLayer({
        id: "a",
        title: "A",
        olLayer: olLayer
    });

    // Changes on initial source
    {
        expect(layer.loadState).toBe("loaded");

        source.setState("error");
        expect(layer.loadState).toBe("error");

        source.setState("undefined");
        expect(layer.loadState).toBe("not-loaded");

        // we assume hard "undefined" means loaded because the source likely
        // doesn't support states at all.
        source.setState(undefined as any);
        expect(layer.loadState).toBe("loaded");

        source.setState("ready");
        expect(layer.loadState).toBe("loaded");
    }

    // Also supports source changes
    {
        source = new Source({
            state: "loading"
        });
        olLayer.setSource(source);
        expect(layer.loadState).toBe("loading");

        source.setState("error");
        expect(layer.loadState).toBe("error");
    }
});

describe("performs a health check", () => {
    it("when specified as URL, success", async () => {
        const testUrl = "http://example.org/health";
        const mockedFetch = vi.fn().mockResolvedValue( new Response("", {
            status: 200
        })
        );
        
        const { layer } = createLayerWithHealthCheck({
            healthCheck: testUrl,
            sourceState: "ready",
            fetch: mockedFetch
        });

        let eventEmitted = 0;
        layer.on("changed:loadState", () => eventEmitted++);

        expect(layer.olLayer.getSourceState()).toBe("ready");
        expect(mockedFetch).toHaveBeenCalledWith(testUrl);
        expect(eventEmitted).toBe(0);
        expect(layer.loadState).toBe("loaded");

        await sleep(25);
        // expect(eventEmitted).toBe(0); // no change of state
        expect(layer.loadState).toBe("loaded");
        // ol layer state remains ready and is overwritten by internal health check
        expect(layer.olLayer.getSourceState()).toBe("ready");
    });

    it("when specified as URL, fail", async () => {
        const mockedWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const mockedFetch = vi.fn().mockResolvedValue(
            new Response("", {
                status: 404
            })
        );
        const testUrl = "http://example.org/health";

        const { layer } = createLayerWithHealthCheck({
            healthCheck: testUrl,
            sourceState: "ready",
            fetch: mockedFetch
        });

        let eventEmitted = 0;
        layer.on("changed:loadState", () => eventEmitted++);

        expect(layer.olLayer.getSourceState()).toBe("ready");
        expect(mockedFetch).toHaveBeenCalledWith(testUrl);
        expect(layer.loadState).toBe("loaded");
        expect(eventEmitted).toBe(0);

        await sleep(25);
        // ol layer state remains ready and is overwritten by internal health check
        expect(layer.olLayer.getSourceState()).toBe("ready");
        expect(layer.loadState).toBe("error");
        expect(eventEmitted).toBe(1);

        expect(mockedWarn.mock.calls).toMatchInlineSnapshot(`
          [
            [
              "[WARN] map:AbstractLayer: Health check failed for layer 'a' (http status 404)",
            ],
          ]
        `);
    });

    it("when specified as function", async () => {
        let didResolve = false;
        const mockedFetch: SpyInstance = vi.spyOn(global, "fetch");
        const customHealthCheck: HealthCheckFunction = async () => {
            function wait(milliseconds: number): Promise<void> {
                return new Promise((resolve) => setTimeout(resolve, milliseconds));
            }

            await wait(5);

            didResolve = true;
            return "error";
        };
        const mockedCustomHealthCheck = vi.fn(customHealthCheck);

        const { layer } = createLayerWithHealthCheck({
            sourceState: "ready",
            healthCheck: mockedCustomHealthCheck
        });

        let eventEmitted = 0;
        layer.on("changed:loadState", () => eventEmitted++);

        expect(mockedFetch).toHaveBeenCalledTimes(0);
        expect(mockedCustomHealthCheck).toHaveBeenCalledOnce();
        expect(mockedCustomHealthCheck).toHaveBeenCalledWith(layer);
        expect(layer.olLayer.getSourceState()).toBe("ready");
        expect(eventEmitted).toBe(0);
        expect(layer.loadState).toBe("loaded");
        expect(didResolve).toBe(false);

        await sleep(25);
        expect(didResolve).toBe(true);
        // ol layer state remains ready and is overwritten by internal health check
        expect(layer.olLayer.getSourceState()).toBe("ready");
        expect(eventEmitted).toBe(1);
        expect(layer.loadState).toBe("error");
    });

    it("when specified as function returning 'loaded'", async () => {
        const _mockedFetch: SpyInstance = vi.spyOn(global, "fetch");
        const customHealthCheck: HealthCheckFunction = async () => {
            return "loaded";
        };
        const mockedCustomHealthCheck = vi.fn(customHealthCheck);

        const { layer } = createLayerWithHealthCheck({
            sourceState: "ready",
            healthCheck: mockedCustomHealthCheck
        });

        await sleep(25);
        expect(mockedCustomHealthCheck).toHaveBeenCalledOnce();
        expect(layer.loadState).toBe("loaded");
    });

    it("when specified as function throwing an error", async () => {
        const mockedWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const _mockedFetch: SpyInstance = vi.spyOn(global, "fetch");
        const customHealthCheck: HealthCheckFunction = async () => {
            throw new Error("broken!");
        };
        const mockedCustomHealthCheck = vi.fn(customHealthCheck);

        const { layer } = createLayerWithHealthCheck({
            sourceState: "ready",
            healthCheck: mockedCustomHealthCheck
        });

        await sleep(25);
        expect(mockedCustomHealthCheck).toHaveBeenCalledOnce();
        expect(layer.loadState).toBe("error");

        expect(mockedWarn.mock.calls).toMatchInlineSnapshot(`
          [
            [
              "[WARN] map:AbstractLayer: Health check failed for layer 'a'",
              [Error: broken!],
            ],
          ]
        `);
    });

    it("not when no health check specified in layer config", async () => {
        const mockedFetch: SpyInstance = vi.spyOn(global, "fetch");
        const { layer } = createLayerWithHealthCheck({
            healthCheck: undefined,
            sourceState: "ready"
        });

        let eventEmitted = 0;
        layer.on("changed:loadState", () => eventEmitted++);

        expect(mockedFetch).toHaveBeenCalledTimes(0);
        expect(eventEmitted).toBe(0); // no change of state
        expect(layer.loadState).toBe("loaded");
        expect(layer.olLayer.getSourceState()).toBe("ready");
    });

    it("not when ol layer state already is error", async () => {
        const mockedFetch: SpyInstance = vi.spyOn(global, "fetch");
        const { layer } = createLayerWithHealthCheck({
            healthCheck: "http://example.org/health",
            sourceState: "error"
        });

        let eventEmitted = 0;
        layer.on("changed:loadState", () => eventEmitted++);

        expect(layer.loadState).toBe("error");
        expect(layer.olLayer.getSourceState()).toBe("error");
        expect(mockedFetch).toHaveBeenCalledTimes(0);
        expect(eventEmitted).toBe(0); // no event emitted because state was initially error
    });
});

// Basic impl for tests
class LayerImpl extends AbstractLayer {
    get sublayers(): undefined {
        return undefined;
    }
}

function createLayer(layerConfig: SimpleLayerConfig, options?: { fetch?: Mock }) {
    const httpService = {
        fetch: options?.fetch ?? vi.fn()
    } satisfies Partial<HttpService>;

    const mapModel = {
        __sharedDependencies: {
            httpService
        }
    } as unknown as MapModelImpl;

    const layer = new LayerImpl(layerConfig);
    layer.__attach(mapModel);
    return { layer, mapModel, httpService };
}

function createLayerWithHealthCheck(options?: {
    healthCheck?: LayerConfig["healthCheck"];
    sourceState?: State;
    fetch?: Mock;
}) {
    const source = new Source({
        state: options?.sourceState ?? "ready"
    });
    const olLayer = new Layer({
        source
    });
    const config: SimpleLayerConfig = {
        id: "a",
        title: "A",
        visible: true,
        olLayer: olLayer,
        healthCheck: options?.healthCheck
    };

    const { layer, httpService } = createLayer(config, { fetch: options?.fetch });
    return { layer, source, config, httpService };
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}
