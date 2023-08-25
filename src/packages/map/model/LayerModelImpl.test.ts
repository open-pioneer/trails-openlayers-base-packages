// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import Layer from "ol/layer/Layer";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Source from "ol/source/Source";
import ResizeObserver from "resize-observer-polyfill";
import { afterEach, expect, it, vi } from "vitest";
import { LayerConfig } from "../api";
import { LayerModelImpl } from "./LayerModelImpl";
import { MapModelImpl } from "./MapModelImpl";
import { createMapModel } from "./createMapModel";
// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = ResizeObserver;

let model: MapModelImpl | undefined;
afterEach(() => {
    model?.destroy();
    model = undefined;
    vi.restoreAllMocks();
});

it("emits a destroy event when destroyed", async () => {
    const layer = await buildSimpleLayer({
        id: "a",
        title: "A",
        layer: new TileLayer({
            source: new OSM()
        })
    });

    let destroyed = 0;
    layer.on("destroy", () => {
        destroyed++;
    });

    layer.destroy();
    expect(destroyed).toBe(1);
});

it("supports the title attribute", async () => {
    const layer = await buildSimpleLayer({
        id: "a",
        title: "A",
        layer: new TileLayer({
            source: new OSM()
        })
    });
    expect(layer.title).toBe("A");

    let changedTitle = 0;
    let changed = 0;
    layer.on("changed:title", () => ++changedTitle);
    layer.on("changed", () => ++changed);

    layer.setTitle("B");
    expect(layer.title).toBe("B");
    expect(changedTitle).toBe(1);
    expect(changed).toBe(1);
});

it("supports the description attribute", async () => {
    const layer = await buildSimpleLayer({
        id: "a",
        title: "A",
        layer: new TileLayer({
            source: new OSM()
        })
    });
    expect(layer.description).toBe("");

    let changedDesc = 0;
    let changed = 0;
    layer.on("changed:description", () => ++changedDesc);
    layer.on("changed", () => ++changed);

    layer.setDescription("Description");
    expect(layer.description).toBe("Description");
    expect(changedDesc).toBe(1);
    expect(changed).toBe(1);
});

it("supports the visibility attribute", async () => {
    const layer = await buildSimpleLayer({
        id: "a",
        title: "A",
        layer: new TileLayer({
            source: new OSM()
        })
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

it("supports arbitrary additional attributes", async () => {
    const hidden = Symbol("hidden");
    const layer = await buildSimpleLayer({
        id: "a",
        title: "A",
        layer: new TileLayer({
            source: new OSM()
        }),
        attributes: {
            foo: "bar",
            [hidden]: "hidden"
        }
    });

    // String and symbol properties are supported
    expect(layer.attributes).toMatchInlineSnapshot(`
      {
        "foo": "bar",
        Symbol(hidden): "hidden",
      }
    `);

    let changedAttributes = 0;
    let changed = 0;
    layer.on("changed:attributes", () => ++changedAttributes);
    layer.on("changed", () => ++changed);

    layer.updateAttributes({
        foo: "baz",
        additional: "new-value",
        [hidden]: "still-hidden"
    });

    // Symbols are also applied on update
    expect(layer.attributes).toMatchInlineSnapshot(`
      {
        "additional": "new-value",
        "foo": "baz",
        Symbol(hidden): "still-hidden",
      }
    `);
    expect(changedAttributes).toBe(1);
    expect(changed).toBe(1);
});

it("logs a warning when setVisible() is called on a base layer", async () => {
    const logSpy = vi.spyOn(global.console, "warn").mockImplementation(() => undefined);
    const layer = await buildSimpleLayer({
        id: "a",
        title: "Base Layer 1",
        isBaseLayer: true,
        layer: new TileLayer({
            source: new OSM()
        })
    });
    layer.setVisible(false);
    expect(layer.visible).toBe(true);
    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction warn] {
        "calls": [
          [
            "[WARN] ol-map:LayerModel: Cannot change visibility of base layer 'a': use activateBaseLayer() on the map's LayerCollection instead.",
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
    const layer = await buildSimpleLayer({
        id: "a",
        title: "A",
        layer: olLayer
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

// NOTE: currently can only be called once per test (because of shared model)
async function buildSimpleLayer(layerConfig: LayerConfig): Promise<LayerModelImpl> {
    if (model) {
        throw new Error("called twice in a test");
    }

    model = await createMapModel("foo", {
        layers: [layerConfig]
    });
    return model.layers.getAllLayers()[0]!;
}
