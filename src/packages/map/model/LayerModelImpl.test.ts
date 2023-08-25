// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { afterEach, expect, it, vi } from "vitest";
import { MapModelImpl } from "./MapModelImpl";
import { createMapModel } from "./createMapModel";
import ResizeObserver from "resize-observer-polyfill";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = ResizeObserver;

let model: MapModelImpl | undefined;
afterEach(() => {
    model?.destroy();
    model = undefined;
    vi.restoreAllMocks();
});

it("logs a warning when setVisible() is called on a base layer", async () => {
    const logSpy = vi.spyOn(global.console, "warn").mockImplementation(() => undefined);

    model = await createMapModel("foo", {
        layers: [
            {
                id: "a",
                title: "Base Layer 1",
                isBaseLayer: true,
                layer: new TileLayer({
                    source: new OSM()
                })
            }
        ]
    });
    const a = model.layers.getLayerById("a")!;
    a.setVisible(false);
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
