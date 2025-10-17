// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { createTestOlLayer } from "@open-pioneer/map-test-utils";
import { createService } from "@open-pioneer/test-utils/services";
import { expect, it } from "vitest";
import { LayerFactory } from "./LayerFactory";
import { AbstractLayer } from "./layers/AbstractLayer";
import { SimpleLayer } from "./layers/SimpleLayer";

it("creates layer instances", async () => {
    const mockHttpService = {} as unknown as HttpService; // not called in this test
    const factory = await createService(LayerFactory, {
        references: { httpService: mockHttpService }
    });

    const olLayer = createTestOlLayer();
    const layer: SimpleLayer = factory.create({
        type: SimpleLayer,
        title: "Test title",
        olLayer
    });

    expect(layer).toBeDefined();
    expect(layer).toBeInstanceOf(SimpleLayer);
    expect(layer.title).toBe("Test title");
    expect(layer.olLayer).toBe(olLayer);

    // Testing internals: dependencies are propagated without connection to the map:
    expect((layer as AbstractLayer).__getDeps().httpService).toBe(mockHttpService);
});
