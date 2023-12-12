// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment node
 */
import Layer from "ol/layer/Layer";
import TileLayer from "ol/layer/Tile";
import { SpyInstance, afterEach, describe, expect, it, vi } from "vitest";
import { HealthCheckFunction, LayerConfig, SimpleLayerConfig } from "../api";
import { AbstractLayer } from "./AbstractLayer";
import Source, { State } from "ol/source/Source";

afterEach(() => {
    vi.restoreAllMocks();
});

it("supports access to the olLayer", async () => {
    const olLayer = new TileLayer({});
    const layer = createLayer({
        id: "a",
        title: "Foo",
        olLayer: olLayer
    });
    expect(layer.olLayer).toBe(olLayer);
});

it("supports the visibility attribute", async () => {
    const layer = createLayer({
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
    const layer = createLayer({
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
    const layer = createLayer({
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

it("hides a layer when state changes to error", async () => {
    const source = new Source({
        state: "ready"
    });
    const olLayer = new Layer({
        source
    });
    const layer = createLayer({
        id: "a",
        title: "A",
        visible: true,
        olLayer: olLayer
    });

    {
        expect(layer.loadState).toBe("loaded");
        expect(layer.visible).toBe(true);

        source.setState("loading");
        expect(layer.loadState).toBe("loading");
        expect(layer.visible).toBe(true);

        source.setState("error");
        expect(layer.loadState).toBe("error");
        expect(layer.visible).toBe(false);

        // don't activate visibility again
        source.setState("ready");
        expect(layer.loadState).toBe("loaded");
        expect(layer.visible).toBe(false);
    }
});

describe("performs a health check", () => {
    it("when specified as URL, success", async () => {
        const mockedFetch: SpyInstance = vi.spyOn(global, "fetch");
        mockedFetch.mockResolvedValue(
            new Response("", {
                status: 200
            })
        );

        const testUrl = "http://example.org/health";
        const { layer } = createLayerWithHealthCheck({
            healthCheck: testUrl,
            sourceState: "ready"
        });

        let eventEmitted = 0;
        layer.on("changed:loadState", () => eventEmitted++);

        expect(layer.olLayer.getSourceState()).toBe("ready");
        expect(mockedFetch).toHaveBeenCalledWith(testUrl);
        expect(eventEmitted).toBe(0);
        expect(layer.loadState).toBe("loaded");

        await sleep(25);
        expect(eventEmitted).toBe(0); // no change of state
        expect(layer.loadState).toBe("loaded");
        expect(layer.visible).toBe(true); // still visible
        // ol layer state remains ready and is overwritten by internal health check
        expect(layer.olLayer.getSourceState()).toBe("ready");
    });

    it("when specified as URL, fail", async () => {
        const mockedWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const mockedFetch: SpyInstance = vi.spyOn(global, "fetch");
        mockedFetch.mockResolvedValue(
            new Response("", {
                status: 404
            })
        );
        const testUrl = "http://example.org/health";

        const { layer } = createLayerWithHealthCheck({
            healthCheck: testUrl,
            sourceState: "ready"
        });

        let eventEmitted = 0;
        layer.on("changed:loadState", () => eventEmitted++);

        expect(layer.olLayer.getSourceState()).toBe("ready");
        expect(mockedFetch).toHaveBeenCalledWith(testUrl);
        expect(layer.loadState).toBe("loaded");
        expect(layer.visible).toBe(true);
        expect(eventEmitted).toBe(0);

        await sleep(25);
        // ol layer state remains ready and is overwritten by internal health check
        expect(layer.olLayer.getSourceState()).toBe("ready");
        expect(layer.loadState).toBe("error");
        expect(layer.visible).toBe(false);
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

        const { layer, config } = createLayerWithHealthCheck({
            sourceState: "ready",
            healthCheck: mockedCustomHealthCheck
        });

        let eventEmitted = 0;
        layer.on("changed:loadState", () => eventEmitted++);

        expect(mockedFetch).toHaveBeenCalledTimes(0);
        expect(mockedCustomHealthCheck).toHaveBeenCalledOnce();
        expect(mockedCustomHealthCheck).toHaveBeenCalledWith(config);
        expect(layer.olLayer.getSourceState()).toBe("ready");
        expect(eventEmitted).toBe(0);
        expect(layer.loadState).toBe("loaded");
        expect(layer.visible).toBe(true);
        expect(didResolve).toBe(false);

        await sleep(25);
        expect(didResolve).toBe(true);
        // ol layer state remains ready and is overwritten by internal health check
        expect(layer.olLayer.getSourceState()).toBe("ready");
        expect(eventEmitted).toBe(1);
        expect(layer.loadState).toBe("error");
        expect(layer.visible).toBe(false);
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
        expect(layer.visible).toBe(true);
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
        expect(layer.visible).toBe(false);
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

// NOTE: currently can only be called once per test (because of shared model)
function createLayer(layerConfig: SimpleLayerConfig): AbstractLayer {
    return new LayerImpl(layerConfig);
}

function createLayerWithHealthCheck(options?: {
    healthCheck?: LayerConfig["healthCheck"];
    sourceState?: State;
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

    const layer = createLayer(config);

    return { layer, source, config };
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}
