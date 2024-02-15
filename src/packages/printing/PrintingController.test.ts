// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { vi, expect, it } from "vitest";
import { PrintingController } from "./PrintingController";
import OlMap from "ol/Map";

it("should add overlay while printing and remove it after printing", async () => {
    const { olMap, controller } = setUp();

    await controller.handleMapExport();
});

function setUp() {
    const olMap = new OlMap();
    const target = document.createElement("div");
    olMap.setTarget(target);

    const overlayText = { overlayText: "Map printing ..." };

    const controller = new PrintingController(olMap, overlayText);

    const exportToCanvasSpy = vi.spyOn(controller as any, "exportToCanvas");
    const exportMapInPNGSpy = vi.spyOn(controller as any, "exportMapInPNG");
    const exportMapInPDFSpy = vi.spyOn(controller as any, "exportMapInPDF");

    exportToCanvasSpy.mockImplementation(() => document.createElement("canvas"));
    exportMapInPNGSpy.mockImplementation(() => undefined);
    exportMapInPDFSpy.mockImplementation(() => undefined);

    return { olMap, controller, exportToCanvasSpy, exportMapInPNGSpy, exportMapInPDFSpy };
}
