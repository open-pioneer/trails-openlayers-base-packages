// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createTestOlLayer } from "@open-pioneer/map-test-utils";
import { expect, it } from "vitest";
import { SimpleLayerImpl } from "./SimpleLayerImpl";

it("supports wrap an OpenLayers layer", () => {
    const olLayer = createTestOlLayer();
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
        olLayer: createTestOlLayer()
    });
    expect(layer.sublayers).toBeUndefined();
});
