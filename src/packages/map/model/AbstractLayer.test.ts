// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment node
 */
import Layer from "ol/layer/Layer";
import TileLayer from "ol/layer/Tile";
import Source from "ol/source/Source";
import { afterEach, expect, it, vi } from "vitest";
import { SimpleLayerConfig } from "../api";
import { AbstractLayer } from "./AbstractLayer";

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
