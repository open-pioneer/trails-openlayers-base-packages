// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment node
 */
import TileLayer from "ol/layer/Tile";
import { expect, it } from "vitest";
import { SimpleLayerImpl } from "./SimpleLayerImpl";

it("supports wrap an open layers layer", () => {
    const olLayer = new TileLayer({});
    const layer = new SimpleLayerImpl({
        id: "a",
        title: "Foo",
        olLayer: olLayer
    });
    expect(layer.olLayer).toBe(olLayer);
});

it("should not have any sublayers", () => {
    const layer = new SimpleLayerImpl({
        id: "a",
        title: "Foo",
        olLayer: new TileLayer({})
    });
    expect(layer.sublayers).toBeUndefined();
});
