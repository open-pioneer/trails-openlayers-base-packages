// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { vi, it, expect } from "vitest";
import { PrintingController } from "./PrintingController";
import OlMap from "ol/Map";
import { createManualPromise } from "@open-pioneer/core";

it("calls the appropriate methods happy path)", async () => {
    const { olMap, controller, exportMapInPNGSpy } = setUp();

    await controller.handleMapExport();
    // TODO: spy...
});

it("creates an overlay during export", async () => {
    const { olMap, exportToCanvasSpy, controller } = setUp();

    // Block the canvas export until we tell it to continue.
    // This way, we can test the intermediate state (overlay present etc.)
    // Note that this is pretty ugly - it relies on implementation details.
    const { promise, resolve } = createManualPromise();
    exportToCanvasSpy.mockImplementation(() => promise);

    // Start the export, but do _not_ wait for it to finish.
    const exportDonePromise = controller.handleMapExport();

    // Wait for the overlay to appear.
    const overlay = await vi.waitFor(() => {
        const overlay = findOverlay(olMap);
        if (!overlay) {
            throw new Error("Failed to find overlay");
        }
        return overlay;
    });
    expect(overlay.textContent).toBe("Map printing ...");

    // Continue from canvas export
    resolve(document.createElement("canvas"));

    // Wait for the method to complete
    await exportDonePromise;

    // Overlay has been removed
    expect(findOverlay(olMap)).toBe(undefined);
});

function findOverlay(olMap: OlMap) {
    const target = olMap.getTarget() as HTMLElement | undefined;
    if (!target) {
        throw new Error("target not present");
    }

    const overlay = target.querySelector("> .printing-overlay");
    if (!overlay) {
        return undefined;
    }
    return overlay;
}

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
